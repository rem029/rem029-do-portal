import type { Order } from '@/payload-types'

/**
 * Trimmed order shape safe to send to an unauthenticated guest (tracker page/socket) -
 * no restaurant id, created_by, or full nested table/menu-item docs.
 */
export interface GuestOrderSnapshot {
  id: string
  order_number?: number
  order_date?: string
  status: Order['status']
  table?: string
  seat_number?: number
  guest_name?: string
  notes?: string
  items: {
    title: string
    quantity: number
    price: number | null | undefined
    modifiers?: string
  }[]
  total: number
  show_prices?: boolean
  createdAt: string
  confirmed_at?: string | null
  preparing_at?: string | null
  prepared_at?: string | null
  served_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
}

export const toGuestOrderSnapshot = (order: Order): GuestOrderSnapshot => {
  const total = (order.items || []).reduce(
    (sum, line) => sum + (line.price_at_order || 0) * (line.quantity || 0),
    0,
  )

  return {
    id: order.id,
    order_number: order.order_number ?? undefined,
    order_date: order.order_date ?? undefined,
    status: order.status,
    table: typeof order.table === 'object' ? order.table?.label : undefined,
    seat_number: order.seat_number,
    guest_name: order.guest_name || undefined,
    notes: order.notes || undefined,
    items: (order.items || []).map((line) => ({
      title: typeof line.item === 'object' ? line.item?.title : '',
      quantity: line.quantity,
      price: line.price_at_order,
      modifiers: (line.selected_modifiers || [])
        .map((m) => m.selections?.join(', '))
        .filter(Boolean)
        .join(' · '),
    })),
    total,
    show_prices: order.show_prices ?? true,
    createdAt: order.createdAt,
    confirmed_at: order.confirmed_at,
    preparing_at: order.preparing_at,
    prepared_at: order.prepared_at,
    served_at: order.served_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
  }
}
