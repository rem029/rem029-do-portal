import type { Order } from '@/payload-types'

// Plain module (no 'use server' / 'use client' directive) so both the server
// actions and the event board's actions can share these without violating
// Next.js's "a 'use server' file may only export async functions" rule.

export type OrderListScope = 'active' | 'history'

export const ORDER_LIST_STATUSES: Record<OrderListScope, Order['status'][]> = {
  active: ['pending', 'confirmed', 'preparing', 'prepared', 'served'],
  history: ['completed', 'cancelled'],
}
