'use client'

import React, { useCallback, useEffect, useSyncExternalStore } from 'react'
import { Pill } from '@payloadcms/ui'
import { TOAST_ACTION_BUTTON_CLASSES } from './order-display'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'prepared'
  | 'served'
  | 'completed'
  | 'cancelled'

// Local copy of @payloadcms/ui's PillStyle union - not exported from its public entry.
// (Duplicated from index.tsx, same as STATUS_LABEL below, to avoid a circular import
// between the board and this standalone toast module.)
type PillStyle = 'always-white' | 'dark' | 'error' | 'light' | 'light-gray' | 'success' | 'warning' | 'white'

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  prepared: 'Prepared',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// Mirrors STATUS_PILL in index.tsx so the toast's destination-status badge reads
// identically to the one on the card it came from.
const STATUS_PILL: Record<OrderStatus, PillStyle> = {
  pending: 'warning',
  confirmed: 'light-gray',
  preparing: 'dark',
  prepared: 'light',
  served: 'success',
  completed: 'success',
  cancelled: 'error',
}

export interface UndoToastOptions {
  orderId: string
  orderNumber?: number | string | null
  previousStatus: OrderStatus
  newStatus: OrderStatus
  onUndo: (orderId: string, previousStatus: OrderStatus) => void | Promise<void>
}

export interface UndoToastItem extends UndoToastOptions {
  id: string
  createdAt: number
}

type Listener = () => void
let toastsState: UndoToastItem[] = []
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l())
}

export function pushUndoToast(options: UndoToastOptions) {
  const id = `${options.orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  toastsState = [...toastsState, { ...options, id, createdAt: Date.now() }]
  notify()
}

export function dismissUndoToast(id: string) {
  toastsState = toastsState.filter((t) => t.id !== id)
  notify()
}

const ToastEntry: React.FC<{
  toast: UndoToastItem
  onDismiss: (id: string) => void
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 7000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const handleUndo = async () => {
    onDismiss(toast.id)
    await toast.onUndo(toast.orderId, toast.previousStatus)
  }

  const orderNumText = toast.orderNumber != null ? `Order #${toast.orderNumber}` : 'Order'

  return (
    // Same neubrutalist card language as OrderCard's CARD_CLASSES / OrderCard's
    // BACK_BUTTON_CLASSES: light elevation-50 fill, 2px elevation-1000 border, hard
    // offset shadow, no blur - built on --theme-elevation-* vars so it flips with
    // the admin light/dark toggle the same way the boards already do.
    <div className="pointer-events-auto relative overflow-hidden rounded-lg border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-50)] text-[var(--theme-elevation-800)] px-3.5 py-2.5 shadow-[4px_4px_0px_0px_var(--theme-elevation-1000)] flex items-center justify-between gap-3 text-sm animate-fadeIn">
      {/* 7s shrinking countdown bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-[var(--theme-warning-600)]"
        style={{
          animation: 'undoToastShrink 7000ms linear forwards',
        }}
      />

      <div className="flex items-center gap-2 min-w-0">
        <span className="font-bold truncate">{orderNumText}</span>
        <span className="text-[var(--theme-elevation-400)]">→</span>
        <Pill pillStyle={STATUS_PILL[toast.newStatus]} size="small" rounded className="!rounded-full shrink-0">
          {STATUS_LABEL[toast.newStatus] || toast.newStatus}
        </Pill>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={handleUndo} className={TOAST_ACTION_BUTTON_CLASSES}>
          Undo
        </button>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-[var(--theme-elevation-150)] transition-colors duration-150 border-none bg-transparent cursor-pointer text-[var(--theme-elevation-400)] hover:text-[var(--theme-elevation-800)] text-xs"
          aria-label="Dismiss toast"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export const UndoToastStack: React.FC<{
  toasts?: UndoToastItem[]
  onDismiss?: (id: string) => void
}> = ({ toasts: propToasts, onDismiss: propDismiss }) => {
  const storeToasts = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => toastsState,
    () => [],
  )

  const toasts = propToasts ?? storeToasts
  const handleDismiss = propDismiss ?? dismissUndoToast

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes undoToastShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {/* Positioning (fixed/bottom/right) lives in the shared bottom-overlay wrapper
          in the board files, alongside ring-alert-banner.tsx, so the two floating
          alerts share one responsive layout (side-by-side on desktop, stacked on
          mobile) instead of each fixing its own corner. */}
      <div className="flex flex-col gap-2 pointer-events-none w-full sm:w-auto sm:max-w-sm sm:ml-auto">
        {toasts.map((toast) => (
          <ToastEntry key={toast.id} toast={toast} onDismiss={handleDismiss} />
        ))}
      </div>
    </>
  )
}

export function useUndoToast() {
  const toasts = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => toastsState,
    () => [],
  )

  const push = useCallback((options: UndoToastOptions) => {
    pushUndoToast(options)
  }, [])

  const dismiss = useCallback((id: string) => {
    dismissUndoToast(id)
  }, [])

  const BoundStack = useCallback(
    () => <UndoToastStack toasts={toasts} onDismiss={dismiss} />,
    [toasts, dismiss],
  )

  return { push, dismiss, toasts, UndoToastStack: BoundStack }
}

export default useUndoToast
