'use client'

import { useEffect } from 'react'
import { useNav, usePreferences } from '@payloadcms/ui'

export const SIDEBAR_PERSISTENCE_KEY = 'doha-admin-nav-open'

const isDesktopViewport = (): boolean => {
  if (typeof window === 'undefined') return true
  // Payload's small breakpoint is 768px; below this, sidebar is an overlay drawer, not a persistent column.
  return window.innerWidth > 768
}

const readStoredNavOpen = (): boolean | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SIDEBAR_PERSISTENCE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return null
  } catch {
    return null
  }
}

const writeStoredNavOpen = (open: boolean): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SIDEBAR_PERSISTENCE_KEY, JSON.stringify(open))
  } catch {
    // Storage quota exceeded or disabled in private browsing modes
  }
}

// Module-scoped, not component refs: `SidebarPersistence` is rendered via
// `admin.components.actions`, inside Payload's per-view `DefaultTemplate` —
// it unmounts/remounts on every client-side navigation (list<->edit,
// doc<->doc), while `NavProvider`'s `navOpen` context state does not. Refs
// would reset on every one of those remounts, re-entering the "restore"
// branch below and reverting any toggle click made in the following settle
// window, which read as "the sidebar stopped toggling" after the first
// navigation. Module scope survives remounts and only resets on an actual
// full page load, which is the only time this workaround is needed.
let settled = false
let settleTimeout: ReturnType<typeof setTimeout> | null = null
let prevNavOpen: boolean | null = null

export function useSidebarPersistence(): void {
  const { navOpen, setNavOpen, hydrated } = useNav()
  const { setPreference } = usePreferences()

  useEffect(() => {
    if (!hydrated) return
    if (!isDesktopViewport()) return

    if (prevNavOpen === null) prevNavOpen = navOpen

    if (!settled) {
      const stored = readStoredNavOpen()
      const desired = stored === null ? true : stored

      if (navOpen !== desired) {
        setNavOpen(desired)
        return
      }

      if (!settleTimeout) {
        settleTimeout = setTimeout(() => {
          settled = true
          prevNavOpen = navOpen
          settleTimeout = null
        }, 300)
      }
      return
    }

    if (prevNavOpen === navOpen) return
    prevNavOpen = navOpen
    writeStoredNavOpen(navOpen)
    void setPreference('nav', { open: navOpen }, true).catch(() => {})
  }, [hydrated, navOpen, setNavOpen, setPreference])

  useEffect(() => {
    const handleResize = () => {
      if (!isDesktopViewport()) return
      const stored = readStoredNavOpen()
      if (stored !== null && navOpen !== stored) {
        prevNavOpen = stored
        setNavOpen(stored)
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== SIDEBAR_PERSISTENCE_KEY) return
      if (!isDesktopViewport()) return
      if (e.newValue === 'true' && !navOpen) {
        prevNavOpen = true
        setNavOpen(true)
      } else if (e.newValue === 'false' && navOpen) {
        prevNavOpen = false
        setNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('storage', handleStorage)
    }
  }, [navOpen, setNavOpen])
}
