'use client'

import React, { useEffect, useState } from 'react'
import { UseBrowserNotifications } from '@/common/hooks/useBrowserNotifications'
import { cn } from '@/utilities/cn'
import { OUTLINE_BUTTON_CLASSES } from './index'
import { NotificationSettingsPanel } from './notification-settings-panel'

export interface NotificationSettingsMenuProps {
  notifications: UseBrowserNotifications
}

export const NotificationSettingsMenu: React.FC<NotificationSettingsMenuProps> = ({
  notifications,
}) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (notifications.permission === 'unsupported') {
    return null
  }

  const showDot = notifications.permission === 'default' || notifications.ringing

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          OUTLINE_BUTTON_CLASSES,
          'relative px-3 py-1.5 text-base leading-none font-bold',
        )}
        aria-label="Notification settings"
        title="Notification settings"
      >
        ⋯
        {showDot && (
          <span
            className={cn(
              'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-[var(--theme-elevation-1000)]',
              notifications.ringing ? 'bg-red-500 animate-ping' : 'bg-amber-500',
            )}
            title={notifications.ringing ? 'Ringing' : 'Notification setup needed'}
          />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Notification settings"
        >
          <div
            className="bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-800)] border-l-2 border-[var(--theme-elevation-1000)] w-full max-w-md h-full overflow-y-auto p-6 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--theme-elevation-150)]">
              <h2 className="font-bold text-xl m-0">Notification settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={OUTLINE_BUTTON_CLASSES}
              >
                Close
              </button>
            </div>
            <NotificationSettingsPanel notifications={notifications} />
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationSettingsMenu
