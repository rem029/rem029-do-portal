'use client'

import React from 'react'
import { format } from 'date-fns'
import { cn } from '@/utilities/cn'
import type { MenuItem, Order, Table } from '@/payload-types'

// Shared order-display primitives (heading, notes, item list, formatting helpers).
// Pulled out of index.tsx so confirm-dialog.tsx can render the same order info
// without importing index.tsx back (which imports confirm-dialog.tsx - would be circular).

// Small bordered action button used inside the floating bottom-of-screen cards
// (undo-toast.tsx's Undo button, ring-alert-banner.tsx's Silence button) - one
// shared definition so the two stay visually identical.
export const TOAST_ACTION_BUTTON_CLASSES =
  'px-2.5 py-1 rounded text-xs font-bold cursor-pointer border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-150)] text-[var(--theme-elevation-800)] hover:bg-[var(--theme-elevation-200)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)] transition-transform duration-100 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0px_0px_var(--theme-elevation-1000)]'

export const orderTotal = (order: Order) =>
  (order.items || []).reduce((sum, line) => sum + (line.price_at_order || 0) * (line.quantity || 0), 0)

// One row per line item - back-of-house staff scan for "the 3rd item" and its modifiers, not prose.
export const OrderItemsList = ({ order }: { order: Order }) => (
  <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
    {(order.items || []).map((line, idx) => {
      const item = line.item as MenuItem
      const modifiers = (line.selected_modifiers || []).flatMap((m) => m.selections || [])
      return (
        <li key={line.id || idx} className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'inline-flex items-center justify-center shrink-0 min-w-[1.75rem]',
                'px-1 py-0.5 rounded text-xs font-bold',
                'bg-[var(--theme-elevation-800)] text-[var(--theme-elevation-0)]',
              )}
            >
              {line.quantity}&times;
            </span>
            <span className="font-semibold leading-snug text-[var(--theme-elevation-900)]">
              {typeof item === 'object' ? item?.title : ''}
            </span>
          </div>
          {modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 pl-[2.25rem]">
              {modifiers.map((mod, mi) => (
                <span
                  key={mi}
                  className="text-[11px] leading-none px-1.5 py-0.5 rounded-full bg-[var(--theme-elevation-100)] text-[var(--theme-elevation-700)]"
                >
                  {mod}
                </span>
              ))}
            </div>
          )}
        </li>
      )
    })}
  </ul>
)

// Keeps the board's card grid in a stable order (order # ascending) instead of
// jumping cards around every time a status update reorders the underlying array.
// Orders without a number yet (shouldn't normally happen - assigned on create)
// sort after numbered ones, oldest first among themselves.
export const sortOrdersByNumber = (orders: Order[]): Order[] =>
  [...orders].sort((a, b) => {
    if (a.order_number != null && b.order_number != null) return a.order_number - b.order_number
    if (a.order_number != null) return -1
    if (b.order_number != null) return 1
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })

export const tableLabel = (order: Order) =>
  typeof order.table === 'object' ? (order.table as Table)?.label : order.table

export const tableSeatLabel = (order: Order) =>
  order.seat_number != null
    ? `${tableLabel(order)} · Seat ${order.seat_number}`
    : `${tableLabel(order)}`

export const notifyTitle = (order: Order) =>
  order.order_number != null
    ? `New order #${order.order_number} — ${tableSeatLabel(order)}`
    : `New order — ${tableSeatLabel(order)}`

export const fmtDateTime = (iso?: string | null) => {
  if (!iso) return ''
  try {
    return format(new Date(iso), 'd MMM yyyy · h:mm a')
  } catch {
    return ''
  }
}

// Order number leads (staff call it out); then table/seat, placed time, optional guest name.
export const OrderHeading = ({ order }: { order: Order }) => (
  <div className="flex flex-col min-w-0 flex-1">
    <div className="flex items-baseline gap-2 min-w-0">
      {order.order_number != null && (
        <span className="text-xl font-extrabold leading-none shrink-0">#{order.order_number}</span>
      )}
      <span className="font-bold truncate text-[var(--theme-elevation-700)]">
        {tableSeatLabel(order)}
      </span>
    </div>
    {order.createdAt && (
      <span className="text-xs font-semibold text-[var(--theme-elevation-600)]">
        Placed {fmtDateTime(order.createdAt)}
      </span>
    )}
    {order.guest_name && (
      <span className="text-sm text-[var(--theme-elevation-700)] truncate">{order.guest_name}</span>
    )}
  </div>
)

export const OrderNote = ({ order }: { order: Order }) =>
  order.notes ? (
    <div className="rounded bg-[var(--theme-elevation-100)] px-2.5 py-2 text-sm leading-snug text-[var(--theme-elevation-800)] whitespace-pre-line break-words">
      <span className="font-semibold">Note: </span>
      {order.notes}
    </div>
  ) : null
