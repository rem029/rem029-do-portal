'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IoMdClose } from 'react-icons/io'
import { CiSearch } from 'react-icons/ci'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import { useMenuStore } from '@/app/(frontend)/fnb/menu/_store/store'
import useDebounce from '@/app/(frontend)/fnb/menu/_hooks/useDebounce'
import { Language, t } from '@/utilities/translations'
import { cn } from '@/utilities/cn'
import MenuCard from '@/app/(frontend)/fnb/menu/_components/cards'
import { MenuItem } from '@/payload-types'

const SearchOverlay = () => {
  const { selectedLanguage, searchText, handleSearchText } = useMenuNav()
  const searchResults = useMenuStore((state) => state.searchResults)
  // Own loading flag, separate from isLoadingItems (the main items list's category-
  // browsing flag) - the two surfaces no longer affect each other (see useMenuItems.ts).
  const isSearchLoading = useMenuStore((state) => state.isSearchLoading)
  const searchOverlayOpen = useMenuStore((state) => state.searchOverlayOpen)
  const setSearchOverlayOpen = useMenuStore((state) => state.setSearchOverlayOpen)

  const [mounted, setMounted] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)
  const [searchInput, setSearchInput] = useState(searchText || '')

  const inputRef = useRef<HTMLInputElement>(null)
  const prevOpenRef = useRef(false)

  const isRtl = selectedLanguage === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'

  const searchValue = useDebounce({ value: searchInput, delay: 300 })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-fill input with the current active query when the overlay opens - in practice
  // this is normally blank now, since closing (handleClose below) clears the search;
  // kept so the input still matches searchText correctly if it's ever non-empty on open
  // (e.g. a deep-linked ?search= before the overlay has been opened/closed once).
  useEffect(() => {
    if (searchOverlayOpen && !prevOpenRef.current) {
      setSearchInput(searchText || '')
    }
    prevOpenRef.current = searchOverlayOpen
  }, [searchOverlayOpen, searchText])

  // Auto-focus input on open
  useEffect(() => {
    if (searchOverlayOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      inputRef.current?.blur()
    }
  }, [searchOverlayOpen])

  // Closing (X or Escape) clears the search entirely - the main list behind the overlay
  // never shows search results anyway (see useMenuItems.ts), so there's nothing left
  // that needs ?search= once the overlay that owns that state is dismissed. Guarded on
  // searchText being non-empty so a plain close doesn't fire a needless navigation.
  const handleClose = useCallback(() => {
    setSearchOverlayOpen(false)
    if (searchText) {
      handleSearchText('')
    }
    setSearchInput('')
  }, [setSearchOverlayOpen, searchText, handleSearchText])

  // Close overlay on Escape key
  useEffect(() => {
    if (!searchOverlayOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOverlayOpen, handleClose])

  // Predictive text suggestions - unique by title, capped to 5
  const suggestions = useMemo(() => {
    if (!searchInput.trim() || searchInput.length < 2 || !searchResults) return []

    const uniqueSuggestions = new Map()
    searchResults.forEach((result) => {
      const title = result.item?.title
      if (title && !uniqueSuggestions.has(title)) {
        uniqueSuggestions.set(title, result)
      }
    })

    return Array.from(uniqueSuggestions.values()).slice(0, 5)
  }, [searchInput, searchResults])

  useEffect(() => {
    if (suggestions.length > 1) {
      setSuggestionsVisible(true)
    } else {
      setSuggestionsVisible(false)
    }
  }, [suggestions])

  // Debounced search query dispatch
  useEffect(() => {
    handleSearchText(searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  // Fills the query from a suggestion chip - the overlay now renders results itself
  // (see below), so there's no page to "return to"; stays open, debounce picks up the
  // new value the same as typing it would.
  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion)
    setSuggestionsVisible(false)
  }

  // Enter just dismisses the on-screen keyboard (results are already live via debounce,
  // same reasoning as handleSuggestionClick - no close-and-return-to-main-page anymore).
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-md flex flex-col overflow-y-auto bg-menu-background text-menu-text p-4 pb-16 transition-all duration-300 ease-out',
        searchOverlayOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-2 pointer-events-none invisible',
      )}
      dir={dir}
      aria-hidden={!searchOverlayOpen}
    >
      {/* Top bar with dir-aware close button: top-right in LTR, top-left in RTL */}
      <div className="flex flex-row items-center w-full mb-2">
        <button
          type="button"
          aria-label={t('Close search', (selectedLanguage || 'en') as Language)}
          className={cn(
            'btn btn-circle btn-ghost ms-auto text-menu-text hover:text-menu-primary-contrast',
          )}
          onClick={handleClose}
          tabIndex={searchOverlayOpen ? 0 : -1}
        >
          <IoMdClose className="text-2xl" />
        </button>
      </div>

      {/* Search input (relocated existing markup) */}
      <div className="w-full mb-3">
        <label
          className={cn(
            'input input-sm rounded-2xl box-border px-3 font-menu-tertiary font-light text-menu-primary bg-transparent flex w-full items-center gap-2 transition-all duration-500 menu-search-input',
            // Focus previously filled the pill with bg-menu-neutral (gray) - didn't fit
            // this UI (flagged during 12C-6 review). Border highlight is enough affordance
            // on its own; no background change on focus.
            searchFocused ? 'input-bordered border-menu-primary' : 'input-ghost',
          )}
        >
          <input
            ref={inputRef}
            type="text"
            className="grow"
            placeholder={`${t('Search menu', (selectedLanguage || 'en') as Language)}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleInputKeyDown}
            tabIndex={searchOverlayOpen ? 0 : -1}
          />
          <CiSearch className="h-6 w-6 opacity-70 rounded-full text-menu-primary-contrast bg-menu-primary p-1" />
        </label>
      </div>

      {/* Predictive suggestions - row that wraps instead of the carousel used elsewhere
          on this page: capped at 5 short title chips, wrapping reads better here than
          horizontal scroll/drag. */}
      {suggestionsVisible && suggestions.length > 0 && (
        <div className="w-full flex flex-row flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.item.id}
              type="button"
              className={cn(
                'box-border font-menu-secondary px-2 py-1 text-[11px]! whitespace-nowrap text-center cursor-pointer menu-search-chip',
                'text-menu-neutral/50 hover:text-menu-neutral/70',
              )}
              onClick={() => handleSuggestionClick(s.item?.title || '')}
              tabIndex={searchOverlayOpen ? 0 : -1}
            >
              {s.item?.title || 'No Title'}
            </button>
          ))}
        </div>
      )}

      {/* Results - rendered with the same MenuCard used by the main items list
          (blocks/items.tsx), so a match here looks/behaves identically (tap to view,
          add-to-cart control, etc). Gated on the live searchInput (not the
          debounce-lagged searchText) so the section disappears the moment the field is
          cleared, same as it appears the moment something's typed. */}
      {searchInput.trim() && (
        <div className="w-full flex flex-col gap-3 mt-4">
          {/* searchResults undefined covers the gap between the first keystroke and the
              debounce settling (before useMenuItems.ts's search effect has run even
              once) - without this, that window briefly renders "No items found" before
              flipping to real results. */}
          {isSearchLoading || searchResults === undefined ? (
            <p className={cn('text-sm text-center', 'text-menu-neutral')}>
              {t('Loading', (selectedLanguage || 'en') as Language)}...
            </p>
          ) : searchResults.length === 0 ? (
            <p className={cn('text-sm', 'text-menu-neutral')}>
              {t('No items found', (selectedLanguage || 'en') as Language)}
            </p>
          ) : (
            searchResults?.map((r, idx) => (
              <MenuCard key={r.item.id} item={r.item as MenuItem} position={idx} />
            ))
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}

export default SearchOverlay
