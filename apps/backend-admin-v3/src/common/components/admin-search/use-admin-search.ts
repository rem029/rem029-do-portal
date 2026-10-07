'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  searchAdmin,
  type AdminSearchGroup,
  type AdminSearchNavItem,
  type AdminSearchItem,
} from './actions'

export interface UseAdminSearchReturn {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  query: string
  setQuery: (q: string) => void
  isLoading: boolean
  results: AdminSearchGroup[]
  navigation: AdminSearchNavItem[]
  flatItems: AdminSearchItem[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  openSearch: () => void
  closeSearch: () => void
  selectItem: (item: AdminSearchItem) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  isMac: boolean
}

/**
 * Hook to manage admin command palette search state, debouncing, keyboard navigation,
 * and routing.
 */
export function useAdminSearch(): UseAdminSearchReturn {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<AdminSearchGroup[]>([])
  const [navigation, setNavigation] = useState<AdminSearchNavItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMac, setIsMac] = useState(true)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const queryIdRef = useRef(0)

  // Detect OS for shortcut hint (⌘K vs Ctrl+K)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || ''))
    }
  }, [])

  // Flattened items for linear keyboard navigation (navigation shortcuts first, then documents)
  const flatItems = useMemo<AdminSearchItem[]>(() => {
    const docItems = results.flatMap((group) => group.items)
    return [...navigation, ...docItems]
  }, [navigation, results])

  // Open & close handlers
  const openSearch = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsOpen(false)
  }, [])

  const selectItem = useCallback(
    (item: AdminSearchItem) => {
      closeSearch()
      if (item.kind === 'navigation') {
        router.push(item.path)
      } else {
        router.push(item.editPath)
      }
    },
    [closeSearch, router],
  )

  // Global keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0)
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Debounced search trigger (~250ms)
  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setNavigation([])
      setIsLoading(false)
      setActiveIndex(0)
      return
    }

    setIsLoading(true)
    const currentQueryId = ++queryIdRef.current

    const debounceTimer = setTimeout(async () => {
      try {
        const data = await searchAdmin(trimmed)
        if (currentQueryId === queryIdRef.current) {
          setResults(data.groups)
          setNavigation(data.navigation)
          setIsLoading(false)
          setActiveIndex(0)
        }
      } catch (err) {
        if (currentQueryId === queryIdRef.current) {
          console.error('Failed to search admin:', err)
          setResults([])
          setNavigation([])
          setIsLoading(false)
        }
      }
    }, 250)

    return () => clearTimeout(debounceTimer)
  }, [query])

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    isLoading,
    results,
    navigation,
    flatItems,
    activeIndex,
    setActiveIndex,
    openSearch,
    closeSearch,
    selectItem,
    inputRef,
    isMac,
  }
}
