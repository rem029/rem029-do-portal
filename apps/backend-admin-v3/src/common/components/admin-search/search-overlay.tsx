'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminSearchGroup,
  AdminSearchNavItem,
  AdminSearchResultItem,
  AdminSearchItem,
} from './actions'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  isLoading: boolean
  navigation: AdminSearchNavItem[]
  results: AdminSearchGroup[]
  flatItems: AdminSearchItem[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  onSelectItem: (item: AdminSearchItem) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SearchIcon = () => (
  <svg
    className="admin-search-modal__icon"
    width="18"
    height="18"
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

const SpinnerIcon = () => (
  <svg
    className="admin-search-modal__spinner"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const ArrowReturnIcon = () => (
  <svg
    className="admin-search-modal__return-icon"
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
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg
    className="admin-search-modal__arrow-right-icon"
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const CollectionIcon = () => (
  <svg
    className="admin-search-modal__nav-icon"
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
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
)

const CloseIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

interface SearchInputHeaderProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  query: string
  setQuery: (q: string) => void
  onClose: () => void
}

const SearchInputHeader = ({ inputRef, query, setQuery, onClose }: SearchInputHeaderProps) => (
  <div className="admin-search-modal__header">
    <SearchIcon />
    <input
      ref={inputRef}
      type="text"
      className="admin-search-modal__input"
      placeholder="Search outlets, users, restaurants, forms..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      aria-label="Search admin"
      autoComplete="off"
      spellCheck={false}
    />
    {query.length > 0 ? (
      <button
        type="button"
        className="admin-search-modal__clear"
        onClick={() => {
          setQuery('')
          inputRef.current?.focus()
        }}
        aria-label="Clear query"
      >
        <CloseIcon />
      </button>
    ) : (
      <button
        type="button"
        className="admin-search-modal__esc-badge"
        onClick={onClose}
        aria-label="Close search"
      >
        ESC
      </button>
    )}
  </div>
)

interface SearchNavItemProps {
  item: AdminSearchNavItem
  globalIndex: number
  isActive: boolean
  onMouseEnter: () => void
  onClick: () => void
}

const SearchNavItem = ({
  item,
  globalIndex,
  isActive,
  onMouseEnter,
  onClick,
}: SearchNavItemProps) => {
  const itemRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isActive])

  return (
    <button
      ref={itemRef}
      type="button"
      id={`admin-search-item-${globalIndex}`}
      role="option"
      aria-selected={isActive}
      className={`admin-search-modal__item admin-search-modal__item--nav ${
        isActive ? 'admin-search-modal__item--active' : ''
      }`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="admin-search-modal__nav-content">
        <CollectionIcon />
        <span className="admin-search-modal__nav-text">
          {'Go to '}
          <strong>{item.label}</strong>
        </span>
        <span className="admin-search-modal__nav-badge">
          {item.target === 'global' ? 'Global' : 'Collection'}
        </span>
      </div>
      <span className="admin-search-modal__item-action">
        {isActive ? <ArrowReturnIcon /> : <ArrowRightIcon />}
      </span>
    </button>
  )
}

interface SearchItemProps {
  item: AdminSearchResultItem
  globalIndex: number
  isActive: boolean
  onMouseEnter: () => void
  onClick: () => void
}

const SearchItem = ({ item, globalIndex, isActive, onMouseEnter, onClick }: SearchItemProps) => {
  const itemRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isActive])

  return (
    <button
      ref={itemRef}
      type="button"
      id={`admin-search-item-${globalIndex}`}
      role="option"
      aria-selected={isActive}
      className={`admin-search-modal__item ${isActive ? 'admin-search-modal__item--active' : ''}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <span className="admin-search-modal__item-title">{item.title}</span>
      <span className="admin-search-modal__item-action">
        {isActive && <ArrowReturnIcon />}
      </span>
    </button>
  )
}

interface SearchGroupProps {
  group: AdminSearchGroup
  startIndex: number
  activeIndex: number
  setActiveIndex: (index: number) => void
  onSelectItem: (item: AdminSearchItem) => void
}

const SearchGroup = ({
  group,
  startIndex,
  activeIndex,
  setActiveIndex,
  onSelectItem,
}: SearchGroupProps) => (
  <div className="admin-search-modal__group" role="group" aria-label={group.collectionLabel}>
    <div className="admin-search-modal__group-header">
      <span className="admin-search-modal__group-title">{group.collectionLabel}</span>
      <span className="admin-search-modal__group-count">{group.items.length}</span>
    </div>
    <div className="admin-search-modal__group-items" role="listbox">
      {group.items.map((item, idx) => {
        const itemGlobalIndex = startIndex + idx
        return (
          <SearchItem
            key={`${item.collection}-${item.id}`}
            item={item}
            globalIndex={itemGlobalIndex}
            isActive={itemGlobalIndex === activeIndex}
            onMouseEnter={() => setActiveIndex(itemGlobalIndex)}
            onClick={() => onSelectItem(item)}
          />
        )
      })}
    </div>
  </div>
)

interface SearchResultsProps {
  isLoading: boolean
  query: string
  navigation: AdminSearchNavItem[]
  results: AdminSearchGroup[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  onSelectItem: (item: AdminSearchItem) => void
}

const SearchResults = ({
  isLoading,
  query,
  navigation,
  results,
  activeIndex,
  setActiveIndex,
  onSelectItem,
}: SearchResultsProps) => {
  const trimmed = query.trim()

  if (isLoading) {
    return (
      <div className="admin-search-modal__status">
        <SpinnerIcon />
        <span>Searching...</span>
      </div>
    )
  }

  if (trimmed.length < 2) {
    return (
      <div className="admin-search-modal__status admin-search-modal__status--hint">
        <span>Type at least 2 characters to search across collections</span>
      </div>
    )
  }

  if (navigation.length === 0 && results.length === 0) {
    return (
      <div className="admin-search-modal__status">
        <span>
          No results found for &ldquo;<strong>{trimmed}</strong>&rdquo;
        </span>
      </div>
    )
  }

  let runningIndex = navigation.length

  return (
    <div className="admin-search-modal__results" id="admin-search-results">
      {navigation.length > 0 && (
        <div className="admin-search-modal__group" role="group" aria-label="Navigation">
          <div className="admin-search-modal__group-header">
            <span className="admin-search-modal__group-title">Navigation</span>
            <span className="admin-search-modal__group-count">{navigation.length}</span>
          </div>
          <div className="admin-search-modal__group-items" role="listbox">
            {navigation.map((item, idx) => (
              <SearchNavItem
                key={`nav-${item.path}`}
                item={item}
                globalIndex={idx}
                isActive={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelectItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {results.map((group) => {
        const groupStartIndex = runningIndex
        runningIndex += group.items.length
        return (
          <SearchGroup
            key={group.collection}
            group={group}
            startIndex={groupStartIndex}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            onSelectItem={onSelectItem}
          />
        )
      })}
    </div>
  )
}

const SearchFooter = () => (
  <div className="admin-search-modal__footer">
    <span className="admin-search-modal__footer-shortcut">
      <kbd>↑</kbd>
      <kbd>↓</kbd>
      <span>to navigate</span>
    </span>
    <span className="admin-search-modal__footer-shortcut">
      <kbd>↵</kbd>
      <span>to select</span>
    </span>
    <span className="admin-search-modal__footer-shortcut">
      <kbd>esc</kbd>
      <span>to close</span>
    </span>
  </div>
)

// ---------------------------------------------------------------------------
// Main SearchOverlay Component
// ---------------------------------------------------------------------------

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  query,
  setQuery,
  isLoading,
  navigation,
  results,
  flatItems,
  activeIndex,
  setActiveIndex,
  onSelectItem,
  inputRef,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while palette is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Keyboard navigation within the dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (flatItems.length > 0) {
        setActiveIndex((activeIndex + 1) % flatItems.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (flatItems.length > 0) {
        setActiveIndex((activeIndex - 1 + flatItems.length) % flatItems.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems.length > 0 && flatItems[activeIndex]) {
        onSelectItem(flatItems[activeIndex])
      }
    }
  }

  if (!mounted || !isOpen) {
    return null
  }

  return createPortal(
    <div
      className="admin-search-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="admin-search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Admin command palette"
      >
        <SearchInputHeader
          inputRef={inputRef}
          query={query}
          setQuery={setQuery}
          onClose={onClose}
        />
        <SearchResults
          isLoading={isLoading}
          query={query}
          navigation={navigation}
          results={results}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onSelectItem={onSelectItem}
        />
        <SearchFooter />
      </div>
    </div>,
    document.body,
  )
}
