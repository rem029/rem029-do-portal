'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useMenuStore, MenuItemAvailability } from '../_store/store'
import { addAnalyticsAction } from '@/common/actions/analytics'
import { Analytics } from '@/payload-types'
import { BASE_PATH } from '@/utilities/constant'

const useMenuNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    filters,
    updateFilters,
    showFilters,
    setShowFilters,
    allergens,
    fetchAllergens,
    categories,
    setCategories,
    selectedItemSlug,
    setSelectedItemSlug,
  } = useMenuStore()

  const isPreview = searchParams.get('preview') === 'true'
  const selectedCategorySlug = searchParams.get('category')
  const selectedAvailability = searchParams.get('availability')
  const selectedLanguage = searchParams.get('lang')
  const selectedAllergens = searchParams.get('allergens')?.split(',').filter(Boolean) || []
  const searchText = searchParams.get('search') || ''

  const addAnalytics = (
    eventType: Analytics['eventType'],
    path: string,
    options: any = {},
    preview: boolean = isPreview,
    elementId?: string,
  ) => {
    if (preview) {
      console.log('Analytics (Preview):', eventType, path, { elementId, ...options })
      return
    }
    // Deferred a tick: callers fire this synchronously alongside another server action
    // (e.g. a category/search/item fetch triggered by the same click) - dispatching two
    // server actions in the same task leaves one of them permanently pending in Next's
    // dev-mode action handling. This call is fire-and-forget tracking data, so it's the
    // one that yields rather than the user-facing fetch.
    setTimeout(() => {
      addAnalyticsAction({ eventType, path, ...options, elementId })
    }, 0)
  }

  useEffect(() => {
    updateFilters({
      search: searchText,
      category: selectedCategorySlug || undefined,
      availability: (selectedAvailability as MenuItemAvailability) || 'all_day',
      allergens: selectedAllergens,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, selectedCategorySlug, selectedAvailability, selectedAllergens.join(',')])

  // Seeds the client-only selection from a shared/deep-linked `?item=` URL on
  // first load only - after this, selection is driven by the store, not the
  // URL, so it never triggers a router navigation (see handleSelectItem).
  useEffect(() => {
    const initialItemSlug = searchParams.get('item')
    if (initialItemSlug) {
      setSelectedItemSlug(initialItemSlug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      }

      return newParams.toString()
    },
    [searchParams],
  )

  const handleSearchText = (text: string) => {
    updateFilters({ search: text })
    if (!text) {
      router.push(pathname + '?' + createQueryString({ search: null }), { scroll: false })
      return
    }

    addAnalytics(
      'search',
      pathname,
      { additionalData: { searchText: text } },
      isPreview,
      'search_text',
    )

    router.push(pathname + '?' + createQueryString({ search: text }), { scroll: false })
  }

  // Full page reload rather than router.push: several pieces of page state
  // (categories, filters, header/page blocks) are seeded once on mount from
  // the initial server-rendered props and don't re-derive from a
  // searchParams-only client navigation, so a soft navigation left stale
  // content on screen until a manual browser refresh. A hard navigation
  // guarantees everything re-fetches fresh in the new locale.
  // BASE_PATH must be prepended by hand here - `pathname` from usePathname()
  // never includes it (Next strips it for app code, same as handleSelectItem's
  // pushState calls below), but window.location.href is a raw browser API
  // with no knowledge of Next's basePath config, unlike router.push.
  const handleSelectLanguage = (language?: string) => {
    if (!language) {
      window.location.href = BASE_PATH + pathname + '?' + createQueryString({ lang: null })
      return
    }

    addAnalytics('click', pathname, { additionalData: { language } }, isPreview, 'select_language')

    if (selectedLanguage === language) {
      window.location.href = BASE_PATH + pathname + '?' + createQueryString({ lang: null })
    } else {
      window.location.href = BASE_PATH + pathname + '?' + createQueryString({ lang: language })
    }
  }

  // Item selection is client-only state (see useMenuStore.selectedItemSlug) -
  // it never calls router.push. This route is `dynamic = 'force-dynamic'`
  // and its Server Component reads `searchParams`, so any router navigation
  // that changes the query string forces a full depth-5 Payload re-fetch of
  // the page, even though the modal's data is already in the client store.
  // history.pushState keeps the URL bar/shareability in sync without
  // invoking Next's navigation lifecycle.
  const handleSelectItem = (slug?: string, position?: number) => {
    if (!slug) {
      setSelectedItemSlug(undefined)
      window.history.pushState(
        null,
        '',
        BASE_PATH + pathname + '?' + createQueryString({ item: null }),
      )
      return
    }

    addAnalytics(
      'click',
      pathname,
      { additionalData: { searchText, slug, position } },
      isPreview,
      'select_item',
    )

    const nextSlug = selectedItemSlug === slug ? undefined : slug
    setSelectedItemSlug(nextSlug)
    window.history.pushState(
      null,
      '',
      BASE_PATH + pathname + '?' + createQueryString({ item: nextSlug || null }),
    )
  }

  const handleSelectCategory = (slug?: string, position?: number) => {
    addAnalytics(
      'click',
      pathname,
      {
        additionalData: { categoryId: slug ? slug : 'all', position },
      },
      isPreview,
      'select_category',
    )

    if (!slug) {
      updateFilters({ category: undefined })
      router.push(pathname + '?' + createQueryString({ category: null }), { scroll: false })
      return
    }

    if (selectedCategorySlug === slug) {
      updateFilters({ category: undefined })
      router.push(pathname + '?' + createQueryString({ category: null }), { scroll: false })
    } else {
      updateFilters({ category: slug })
      router.push(pathname + '?' + createQueryString({ category: slug }), { scroll: false })
    }
  }

  const handleSelectAvailability = (availability?: string, position?: number) => {
    addAnalytics(
      'click',
      pathname,
      {
        additionalData: {
          availability: availability ? availability : 'all_day',
          position,
        },
      },
      isPreview,
      'select_availability',
    )

    if (selectedAvailability === availability) {
      updateFilters({ availability: 'all_day' })
      router.push(pathname + '?' + createQueryString({ availability: 'all_day' }), {
        scroll: false,
      })
    } else if (availability) {
      updateFilters({ availability: availability as MenuItemAvailability })
      router.push(pathname + '?' + createQueryString({ availability: availability }), {
        scroll: false,
      })
    }
  }

  const handleSelectAllergens = (slug: string, position?: number) => {
    addAnalytics(
      'click',
      pathname,
      {
        additionalData: {
          allergens: slug ? slug : 'all_day',
          position,
        },
      },
      isPreview,
      'select_allergens',
    )
    const current = new Set(filters.allergens || [])
    if (current.has(slug)) {
      current.delete(slug)
    } else {
      current.add(slug)
    }
    const newVal = Array.from(current)
    updateFilters({ allergens: newVal })
    router.push(pathname + '?' + createQueryString({ allergens: newVal.join(',') || null }), {
      scroll: false,
    })
  }

  const handleResetFilters = () => {
    updateFilters({
      search: '',
      category: undefined,
      availability: 'all_day',
      allergens: [],
    })
    router.push(
      pathname +
        '?' +
        createQueryString({
          search: null,
          category: null,
          availability: null,
          allergens: null,
        }),
      { scroll: false },
    )
  }

  return {
    selectedItemSlug,
    selectedCategorySlug,
    selectedAvailability,
    selectedLanguage,
    selectedAllergens,
    searchText,
    handleSelectItem,
    handleSelectCategory,
    handleSelectAvailability,
    handleSelectLanguage,
    handleSearchText,
    handleSelectAllergens,
    handleResetFilters,
    isPreview,
    filters,
    showFilters,
    setShowFilters,
    allergens,
    fetchAllergens,
    categories,
    setCategories,
    addAnalytics,
  }
}

export default useMenuNav
