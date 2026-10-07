'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'

const HAS_SIDEBAR_SELECTOR = '.document-fields--has-sidebar'
const CONTROLS_SELECTOR = '.doc-controls__controls'
const OPEN_CLASS = 'document-fields--sidebar-open'
const DRAWER_TOP_VAR = '--doc-sidebar-drawer-top'

/**
 * `--doc-controls-height` only covers the Save/Publish row — collections
 * whose fields are organized with a `type: 'tabs'` field (e.g. Menu Pages'
 * Information/Content/Advanced/SEO) render that tab strip as part of the
 * same sticky header, taller than --doc-controls-height alone. Payload's
 * own stock (non-overlay) sidebar never notices because `position: sticky`
 * lays it out in-flow below both first; a `position: fixed` drawer has no
 * flow to fall back on, so it needs the real measured height instead.
 */
const measureDrawerTop = () => {
  const controls = document.querySelector('.doc-controls')
  if (controls) {
    document.documentElement.style.setProperty(DRAWER_TOP_VAR, `${controls.getBoundingClientRect().bottom}px`)
  }
}

// A panel-with-right-column glyph reads as "toggle the sidebar" at a
// glance and looks nothing like Payload's own adjacent `.doc-controls__dots`
// (a plain 3-dot menu) — the two were easy to mistake for duplicates of the
// same control before this.
const SidebarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="15" y1="4" x2="15" y2="20" />
  </svg>
)

/**
 * Global topbar action (renders on every page — mounts here only as an
 * anchor, then portals its actual button into the real document-edit DOM;
 * see below) that hides itself when the current page has no
 * `.document-fields--has-sidebar` — every collection/global with an
 * `admin.position: 'sidebar'` field renders that real class, so this works
 * across all of them without per-collection wiring. Desktop only: on
 * mobile/tablet (<=1024px, Payload's own breakpoint) the sidebar keeps its
 * stock stacked-below layout untouched — see the matching media query in
 * admin-theme/_components.scss.
 *
 * Portals into `.doc-controls__controls` (the Save/Publish button group)
 * so the toggle sits inline right after Publish, ahead of Payload's own
 * separate `.doc-controls__dots` menu (Copy to locale/Create New/Delete) —
 * per explicit request, rather than floating in the global topbar. Toggles
 * a class on the sidebar DOM node directly (not React state) since that
 * node lives in a separate render tree from this component; a
 * MutationObserver re-detects both target nodes across Next.js
 * client-side navigations, which don't remount this component.
 */
export const DocumentSidebarToggle = () => {
  const pathname = usePathname()
  const [controlsEl, setControlsEl] = React.useState<HTMLElement | null>(null)
  const sidebarRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    sidebarRef.current = null
    setControlsEl(null)

    const detect = () => {
      const sidebar = document.querySelector<HTMLElement>(HAS_SIDEBAR_SELECTOR)
      if (sidebar !== sidebarRef.current) {
        sidebarRef.current = sidebar
        sidebar?.classList.remove(OPEN_CLASS)
        if (sidebar) {
          measureDrawerTop()
        }
      }

      const controls = sidebar ? document.querySelector<HTMLElement>(CONTROLS_SELECTOR) : null
      setControlsEl((prev) => (prev === controls ? prev : controls))
    }

    detect()

    const observer = new MutationObserver(detect)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', measureDrawerTop)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureDrawerTop)
    }
  }, [pathname])

  const handleToggle = () => {
    measureDrawerTop()
    sidebarRef.current?.classList.toggle(OPEN_CLASS)
  }

  if (!controlsEl) {
    return null
  }

  return createPortal(
    <button
      type="button"
      className="admin-doc-sidebar-toggle"
      aria-label="Toggle document sidebar"
      onClick={handleToggle}
    >
      <SidebarIcon />
    </button>,
    controlsEl,
  )
}
