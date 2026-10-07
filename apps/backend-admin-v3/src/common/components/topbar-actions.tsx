'use client'

import React from 'react'
import { toast } from '@payloadcms/ui'
import { SearchTrigger } from './admin-search'
import { SidebarPersistence } from './sidebar-persistence'

const BellIcon = () => (
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
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

/**
 * Topbar action widgets from the admin redesign:
 * - SearchTrigger: real cross-collection command palette (TECH-0112 Phase 8)
 * - Notification bell: surfaces notifications status toast (TECH-0112 Phase 2)
 */
export const TopbarActions = () => {
  const handleNotificationsClick = () => {
    toast('No new notifications')
  }

  return (
    <div className="admin-topbar-actions">
      <SidebarPersistence />
      <SearchTrigger />
      <button
        type="button"
        className="admin-topbar-actions__icon-button"
        aria-label="Notifications"
        onClick={handleNotificationsClick}
      >
        <BellIcon />
      </button>
    </div>
  )
}
