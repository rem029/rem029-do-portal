'use client'

import { useEffect, useRef } from 'react'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import {
  MenuItemWithCategory,
  UNCATEGORIZED_CATEGORY_SLUG,
  useMenuStore,
  useRestaurantStore,
} from '@/app/(frontend)/fnb/menu/_store/store'
import {
  getMenuItemsByCategoryAction,
  getUncategorizedMenuItemsAction,
  searchMenuItemsAction,
} from '@/app/(frontend)/fnb/menu/_actions'
import { MenuCategory, MenuItem } from '@/payload-types'

const toItemsWithCategory = (items: MenuItem[], categorySlug: string): MenuItemWithCategory[] =>
  items.map((item) => ({ item, categorySlug }))

/**
 * Orchestrates on-demand item fetching for the menu page: one category at a time
 * (see _actions/index.ts), instead of the old approach of embedding every item for
 * every category in the initial page load. Call this once, high up (blocks/items.tsx);
 * other components (e.g. the search suggestions dropdown) just read the resulting
 * state straight off useMenuStore.
 */
export const useMenuItems = () => {
  const { selectedLanguage, filters, categories } = useMenuNav()
  const restaurant = useRestaurantStore((s) => s.restaurant)
  const itemsByCategorySlug = useMenuStore((s) => s.itemsByCategorySlug)
  const loadedCategorySlugs = useMenuStore((s) => s.loadedCategorySlugs)
  const isLoadingItems = useMenuStore((s) => s.isLoadingItems)
  const setCategoryItems = useMenuStore((s) => s.setCategoryItems)
  const setSearchResults = useMenuStore((s) => s.setSearchResults)
  const setIsLoadingItems = useMenuStore((s) => s.setIsLoadingItems)
  const setIsSearchLoading = useMenuStore((s) => s.setIsSearchLoading)
  const resetItemCache = useMenuStore((s) => s.resetItemCache)

  const language = selectedLanguage || 'en'
  const restaurantId = restaurant?.id
  const search = filters.search || ''

  // Defensive: a single page mounts one restaurant for its lifetime today, but this
  // keeps stale cross-restaurant data from leaking if that ever changes.
  const restaurantIdRef = useRef(restaurantId)
  useEffect(() => {
    if (restaurantIdRef.current && restaurantIdRef.current !== restaurantId) {
      resetItemCache()
    }
    restaurantIdRef.current = restaurantId
  }, [restaurantId, resetItemCache])

  // itemsByCategorySlug is keyed only by category slug, not by language - switching the
  // page's language would otherwise hit the "already cached" early-return below with
  // titles/descriptions still resolved in the previous language. Clear the cache on a
  // language change so every category re-fetches in the new language (same pattern as
  // the restaurant-change guard above).
  const languageRef = useRef(language)
  useEffect(() => {
    if (languageRef.current && languageRef.current !== language) {
      resetItemCache()
    }
    languageRef.current = language
  }, [language, resetItemCache])

  // Search results only ever render inside the search overlay (search-overlay.tsx) now -
  // the main list below (isSearching/isSingleCategory further down) no longer reacts to
  // `search` at all, so this effect's own isSearchLoading flag is kept separate from
  // isLoadingItems (shared by the category-browsing effects below) to avoid the two
  // surfaces' loading states clobbering each other. `search` is already debounced
  // upstream (search-overlay.tsx debounces the raw input before it reaches
  // `filters.search`), so no second debounce here.
  useEffect(() => {
    if (!restaurantId) return
    if (!search) {
      setSearchResults(undefined)
      setIsSearchLoading(false)
      return
    }

    let cancelled = false
    setIsSearchLoading(true)
    searchMenuItemsAction(restaurantId, search, language).then((result) => {
      if (cancelled) return
      setIsSearchLoading(false)
      if (result.success && result.data) {
        setSearchResults(toItemsWithCategory(result.data as MenuItem[], ''))
      }
    })

    return () => {
      cancelled = true
      setIsSearchLoading(false)
    }
  }, [restaurantId, search, language, setSearchResults, setIsSearchLoading])

  // A specific category tab - fetch once, cache it. No longer gated on `search` - the
  // main list ignores search entirely now (see isSearching removal below), so category
  // browsing keeps working normally even while a search is active in the overlay.
  useEffect(() => {
    if (!restaurantId || !filters.category) return
    if (itemsByCategorySlug[filters.category]) {
      // Already cached (e.g. from the "All" tab's background prefetching, or a previous
      // visit to this category) - nothing to fetch, but still clear any loading flag left
      // behind by a rapid-switch that cancelled a previous category's in-flight fetch below.
      setIsLoadingItems(false)
      return
    }

    let cancelled = false
    const categorySlug = filters.category
    setIsLoadingItems(true)
    const fetchItems =
      categorySlug === UNCATEGORIZED_CATEGORY_SLUG
        ? getUncategorizedMenuItemsAction(restaurantId, language)
        : getMenuItemsByCategoryAction(restaurantId, categorySlug, language)

    fetchItems.then((result) => {
      if (cancelled) return
      setIsLoadingItems(false)
      if (result.success && result.data) {
        setCategoryItems(categorySlug, toItemsWithCategory(result.data as MenuItem[], categorySlug))
      }
    })

    return () => {
      cancelled = true
      // A rapid category switch tears this down before its fetch ever lands - clear the
      // loading flag it set so the next category's effect isn't stuck showing "Loading..."
      // if it turns out to already be cached (the early-return path above).
      setIsLoadingItems(false)
    }
  }, [restaurantId, filters.category, language, itemsByCategorySlug, setCategoryItems, setIsLoadingItems])

  const hasMoreCategories = loadedCategorySlugs.length < categories.length

  // Reads loadedCategorySlugs/isLoadingItems fresh from the store (rather than the
  // hook's render-time closure) since useInfiniteScroll may call this again before a
  // re-render happens (see its "recheck" logic for why). Returns a promise so that
  // recheck can wait for this fetch to land before re-testing trigger visibility.
  const loadNextCategory = (): Promise<void> => {
    if (!restaurantId) return Promise.resolve()
    const state = useMenuStore.getState()
    if (state.isLoadingItems) return Promise.resolve()

    const nextCategory = categories.find(
      (c) => !state.loadedCategorySlugs.includes((c as MenuCategory).slug),
    ) as MenuCategory | undefined
    if (!nextCategory) return Promise.resolve()

    setIsLoadingItems(true)
    const fetchItems =
      nextCategory.slug === UNCATEGORIZED_CATEGORY_SLUG
        ? getUncategorizedMenuItemsAction(restaurantId, language)
        : getMenuItemsByCategoryAction(restaurantId, nextCategory.slug, language)

    return fetchItems.then((result) => {
      setIsLoadingItems(false)
      if (result.success && result.data) {
        setCategoryItems(
          nextCategory.slug,
          toItemsWithCategory(result.data as MenuItem[], nextCategory.slug),
        )
      }
    })
  }

  // Note: there's no separate "load the first category automatically" effect for the
  // "All" tab - the infinite-scroll trigger mounts as soon as hasMore is true (even with
  // zero items loaded yet), and IntersectionObserver always reports its target's current
  // state the moment it starts observing, so the first category load happens through the
  // same path as every subsequent one (see useInfiniteScroll.ts). A separate effect here
  // previously raced with that initial report and caused duplicate/stuck fetches.

  // Rendered in category order regardless of fetch order, so tab-clicking a category
  // before ever viewing "All" doesn't scramble the eventual "All" list.
  //
  // An item can belong to more than one category (see task-12C-2 - items carry their
  // own category[] and can be tagged into several), so the same item shows up in more
  // than one category's cached list. Flat-mapping those lists together would then
  // render it once per category it's in. Dedupe by item slug, keeping its first
  // (category-order) occurrence, so "All" shows each item exactly once.
  const seenItemSlugs = new Map<string, MenuItemWithCategory>()
  for (const c of categories) {
    for (const entry of itemsByCategorySlug[(c as MenuCategory).slug] || []) {
      const itemSlug = entry.item.slug
      if (!seenItemSlugs.has(itemSlug)) {
        seenItemSlugs.set(itemSlug, entry)
      }
    }
  }
  const allItems: MenuItemWithCategory[] = Array.from(seenItemSlugs.values())

  // Browsing (this hook's own items/hasMore) is fully decoupled from search now - a
  // search only ever affects the store's searchResults/isSearchLoading (consumed
  // directly by search-overlay.tsx), never this list. Opening the overlay and typing a
  // query no longer changes what's shown behind it.
  const isSingleCategory = !!filters.category

  const items = isSingleCategory ? itemsByCategorySlug[filters.category!] || [] : allItems

  const hasMore = !isSingleCategory && hasMoreCategories

  return {
    items,
    isLoadingItems,
    hasMore,
    loadNextCategory,
  }
}

export default useMenuItems
