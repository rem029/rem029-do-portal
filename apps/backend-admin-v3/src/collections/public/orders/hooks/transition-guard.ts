import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'
import { hasUserAccess } from '@/utilities/access'
import type { User } from '@/payload-types'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'prepared'
  | 'served'
  | 'completed'
  | 'cancelled'

/**
 * Guest places the order -> waiter confirms with the guest -> back of house starts preparing ->
 * back of house marks it prepared (ready for pickup) -> waiter serves it -> cashier closes it out.
 * Cancellation is only allowed before back of house has started preparing it.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled', 'pending'],
  preparing: ['prepared', 'confirmed'],
  prepared: ['served', 'preparing'],
  served: ['completed', 'prepared'],
  completed: ['served'],
  cancelled: [],
}

type StaffRole = 'waiter' | 'boh' | 'cashier'

// Which Payload global each role's authority is tied to - reuses the same
// users-access grants that already gate who can even open that panel. Restaurant
// panels authorise transitions on non-event orders; event panels authorise them
// only on orders for events the user holds that role on (checked below).
const ROLE_PANEL_SLUG: Record<StaffRole, string> = {
  waiter: 'waiter-panel',
  boh: 'back-of-house-panel',
  cashier: 'cashier-panel',
}

// The transitions each role is trusted to make. This is the actual lock -
// the panels only ever render buttons for these same pairs, but a button
// being hidden client-side was never enforcement, just a convenience.
const ROLE_TRANSITIONS: Record<StaffRole, Array<[OrderStatus, OrderStatus]>> = {
  waiter: [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['confirmed', 'cancelled'],
    ['prepared', 'served'],
    ['confirmed', 'pending'],
    ['prepared', 'preparing'],
    ['served', 'prepared'],
  ],
  boh: [
    ['confirmed', 'preparing'],
    ['preparing', 'prepared'],
    ['confirmed', 'pending'],
    ['preparing', 'confirmed'],
    ['prepared', 'preparing'],
  ],
  cashier: [
    ['served', 'completed'],
    ['served', 'prepared'],
    ['completed', 'served'],
  ],
}

// On a Back-of-House-only order the waiter is out of the loop entirely: BOH takes
// over the waiter's transitions, and a waiter has no authority over the order.
const BOH_ONLY_EXTRA_TRANSITIONS: Array<[OrderStatus, OrderStatus]> = [
  ['pending', 'confirmed'],
  ['pending', 'cancelled'],
  ['confirmed', 'cancelled'],
  ['prepared', 'served'],
  ['served', 'prepared'],
]

const transitionsForRole = (
  role: StaffRole,
  fulfillment?: string | null,
): Array<[OrderStatus, OrderStatus]> => {
  if (fulfillment === 'boh_only') {
    if (role === 'boh') return [...ROLE_TRANSITIONS.boh, ...BOH_ONLY_EXTRA_TRANSITIONS]
    if (role === 'waiter') return [] // waiter is not involved in BOH-only orders
  }
  return ROLE_TRANSITIONS[role]
}

type OrderScope = {
  fulfillment?: string | null
  ordering_slug?: string | null
  ordering_collection?: string | null
}

const userCanPerformTransition = (
  user: User,
  from: OrderStatus,
  to: OrderStatus,
  order: OrderScope,
): boolean => {
  if (user.super_user) return true
  const isEventOrder = order.ordering_collection === 'fnb-menu-events'

  for (const role of Object.keys(ROLE_TRANSITIONS) as StaffRole[]) {
    const ownsTransition = transitionsForRole(role, order.fulfillment).some(
      ([f, t]) => f === from && t === to,
    )
    if (!ownsTransition) continue

    if (isEventOrder) {
      if (!order.ordering_slug) continue
      if (hasUserAccess(user, `fnb-order-panel:${order.ordering_slug}:${role}`, 'update')) return true
    } else {
      if (hasUserAccess(user, ROLE_PANEL_SLUG[role], 'update')) return true
    }
  }
  return false
}

export const guardOrderStatusTransition: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation !== 'update' || !data?.status || !originalDoc) return data

  const from = originalDoc.status as OrderStatus
  const to = data.status as OrderStatus

  if (from === to) return data

  const allowed = ORDER_STATUS_TRANSITIONS[from] || []
  if (!allowed.includes(to)) {
    throw new APIError(`Order cannot move from "${from}" to "${to}".`, 400)
  }

  // No req.user means an unauthenticated/system call - the guest cancel action
  // (pending -> cancelled) and internal writes go through this path. Any
  // authenticated staff member must additionally hold the role that owns
  // this specific transition, scoped to the order's restaurant or event.
  const user = req.user as User | undefined
  if (
    user &&
    !userCanPerformTransition(user, from, to, {
      fulfillment: originalDoc.fulfillment as string | null | undefined,
      ordering_slug: originalDoc.ordering_slug as string | null | undefined,
      ordering_collection: originalDoc.ordering_collection as string | null | undefined,
    })
  ) {
    throw new APIError(
      `Your role isn't permitted to move an order from "${from}" to "${to}".`,
      403,
    )
  }

  return data
}
