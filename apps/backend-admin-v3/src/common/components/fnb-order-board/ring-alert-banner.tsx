'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { TOAST_ACTION_BUTTON_CLASSES } from './order-display'

export interface RingAlertBannerProps {
  count: number
  silenced: boolean
  onSilence: () => void
  className?: string
}

// Floating alert for orders still ringing for this role's attention - same
// neubrutalist card language as undo-toast.tsx's ToastEntry. Lives in the
// shared bottom-overlay wrapper in the board files: left side on desktop,
// stacked above the undo toast on mobile.
export const RingAlertBanner: React.FC<RingAlertBannerProps> = ({
  count,
  silenced,
  onSilence,
  className,
}) => (
  <div
    className={cn(
      'pointer-events-auto w-full sm:w-auto sm:max-w-sm rounded-lg border-2 border-[var(--theme-elevation-1000)] px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm',
      silenced
        ? 'bg-[var(--theme-elevation-100)] text-[var(--theme-elevation-700)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)]'
        : 'bg-[var(--theme-warning-150)] text-[var(--theme-elevation-900)] shadow-[4px_4px_0px_0px_var(--theme-elevation-1000)]',
      className,
    )}
  >
    <div className="flex items-center gap-2 font-bold min-w-0">
      <span className="text-base shrink-0">🔔</span>
      <span className="truncate">
        {count} {count === 1 ? 'order' : 'orders'} waiting for you
      </span>
    </div>
    {silenced ? (
      <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded border-2 border-[var(--theme-elevation-400)] bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-600)] select-none">
        Ringing paused
      </span>
    ) : (
      <button type="button" onClick={onSilence} className={cn(TOAST_ACTION_BUTTON_CLASSES, 'shrink-0')}>
        Silence
      </button>
    )}
  </div>
)

export default RingAlertBanner
