'use client'

import React from 'react'
import { useAdminSearch } from './use-admin-search'
import { SearchOverlay } from './search-overlay'

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

/**
 * Topbar search trigger button for the global admin search palette.
 * Replaces the Phase 2 decorative placeholder with real cross-collection search.
 */
export const SearchTrigger: React.FC = () => {
  const {
    isOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    isLoading,
    navigation,
    results,
    flatItems,
    activeIndex,
    setActiveIndex,
    selectItem,
    inputRef,
    isMac,
  } = useAdminSearch()

  return (
    <>
      <button
        type="button"
        className="admin-topbar-actions__search"
        onClick={openSearch}
        aria-label={`Search admin (${isMac ? '⌘K' : 'Ctrl+K'})`}
      >
        <SearchIcon />
        <span className="admin-topbar-actions__search-label">Search admin...</span>
        <kbd className="admin-topbar-actions__search-kbd">
          {isMac ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </button>

      <SearchOverlay
        isOpen={isOpen}
        onClose={closeSearch}
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        navigation={navigation}
        results={results}
        flatItems={flatItems}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        onSelectItem={selectItem}
        inputRef={inputRef}
      />
    </>
  )
}
