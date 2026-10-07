'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { FnbMenuEvent, Order, Restaurant, User } from '@/payload-types'
import {
  getStaffEventScope,
  findEventSlugs,
  isFnbEventStaff,
  resolveStaffEventScope,
  type StaffEventRole,
} from '@/utilities/fnb-staff-access'
import { updateOrderStatusAction } from '../fnb-order-board/actions'
import { ORDER_LIST_STATUSES, type OrderListScope } from '../fnb-order-board/order-list-scope'

export { updateOrderStatusAction }
export type { OrderListScope }

export interface StaffEventItem {
  slug: string
  title: string
  restaurantName: string
}

export interface EventStaffContextData {
  events: StaffEventItem[]
  defaultSlug?: string
}

/**
 * Shared by the waiter/back-of-house/cashier event panels - resolves which
 * event(s) the logged-in staff member may operate on for the given role.
 *   - super_user → every published event in scope (not role-filtered)
 *   - event staff → only the events they hold a `fnb-event-staff` row for in THIS role
 */
export async function getEventStaffContextAction(
  role: StaffEventRole,
): Promise<{ success: true; data: EventStaffContextData } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false as const, error: 'Not authenticated' }
    }
    if (!isFnbEventStaff(user)) {
      return { success: false as const, error: 'Not permitted' }
    }

    const isManager = !!user.super_user

    let slugs: string[]
    if (isManager) {
      slugs = await findEventSlugs(payload)
    } else {
      const staffScope = getStaffEventScope(user)
      slugs = staffScope[role] || []
    }

    if (slugs.length === 0) {
      return { success: true as const, data: { events: [], defaultSlug: undefined } }
    }

    const { docs } = await payload.find({
      collection: 'fnb-menu-events',
      where: { 'info.slug': { in: slugs } },
      depth: 1,
      limit: 200,
      overrideAccess: true,
    })

    const eventBySlug = new Map<string, FnbMenuEvent>()
    for (const doc of docs as FnbMenuEvent[]) {
      if (doc.info?.slug) eventBySlug.set(doc.info.slug, doc)
    }

    const events: StaffEventItem[] = slugs.map((slug) => {
      const doc = eventBySlug.get(slug)
      const restaurant =
        doc && typeof doc.restaurant === 'object' && doc.restaurant !== null
          ? (doc.restaurant as Restaurant)
          : null
      return {
        slug,
        title: doc?.info?.title || slug,
        restaurantName: restaurant?.title || '',
      }
    })

    return {
      success: true as const,
      data: { events, defaultSlug: events[0]?.slug },
    }
  } catch (error) {
    console.error('Error fetching event staff context:', error)
    return { success: false as const, error: 'Failed to load panel' }
  }
}

/**
 * Baseline order list for an event panel - called on mount and on every stream
 * (re)connect. The SSE stream only carries deltas after this snapshot.
 */
export async function listEventOrdersAction(
  orderingSlug: string,
  scope: OrderListScope,
): Promise<{ success: true; data: Order[] } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false as const, error: 'Not authenticated' }
    }
    if (!isFnbEventStaff(user)) {
      return { success: false as const, error: 'Forbidden' }
    }

    const allowed = await resolveStaffEventScope(payload, user, [orderingSlug])
    if (!allowed.includes(orderingSlug)) {
      return { success: false as const, error: 'Forbidden' }
    }

    const { docs } = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { ordering_slug: { equals: orderingSlug } },
          { status: { in: ORDER_LIST_STATUSES[scope] } },
        ],
      },
      sort: '-createdAt',
      depth: 2,
      limit: 100,
      overrideAccess: true,
    })

    return { success: true as const, data: docs as Order[] }
  } catch (error) {
    console.error('Error listing event orders:', error)
    return { success: false as const, error: 'Failed to load orders' }
  }
}
