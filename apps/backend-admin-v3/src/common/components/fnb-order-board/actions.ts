'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { Order, Restaurant, User } from '@/payload-types'
import { resolveStaffRestaurantId } from '@/utilities/fnb-staff-access'
import { ORDER_LIST_STATUSES, type OrderListScope } from './order-list-scope'

// Re-export the type only. A 'use server' module may not export the const object
// (Next.js: "a 'use server' file can only export async functions") - importers
// that need ORDER_LIST_STATUSES take it from ./order-list-scope directly.
export type { OrderListScope }

/**
 * Shared by the waiter/back-of-house/cashier panels - resolves which restaurant(s) the
 * logged-in staff member may operate on (single restaurant, or all restaurants for
 * super_user / operator-level access).
 */
export async function getFnbStaffContextAction() {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false as const, error: 'Not authenticated' }
    }

    const userRestaurantId =
      typeof user.restaurant === 'object' ? user.restaurant?.id : user.restaurant
    const userOperatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator

    if (userRestaurantId) {
      const restaurant = await payload.findByID({
        collection: 'restaurants',
        id: userRestaurantId,
        depth: 0,
        overrideAccess: true,
      })
      return {
        success: true as const,
        data: { restaurants: [restaurant] as Restaurant[], defaultRestaurantId: restaurant.id },
      }
    }

    if (user.super_user || userOperatorId) {
      const { docs } = await payload.find({
        collection: 'restaurants',
        where: user.super_user ? {} : { operator: { equals: userOperatorId } },
        limit: 100,
        overrideAccess: true,
      })
      return {
        success: true as const,
        data: {
          restaurants: docs as Restaurant[],
          defaultRestaurantId: (docs[0] as Restaurant | undefined)?.id,
        },
      }
    }

    return { success: false as const, error: 'No restaurant access' }
  } catch (error) {
    console.error('Error fetching FnB staff context:', error)
    return { success: false as const, error: 'Failed to load panel' }
  }
}

/**
 * Baseline order list for a panel - called on mount and on every stream
 * (re)connect. The SSE stream only carries deltas after this snapshot.
 */
export async function listOrdersAction(restaurantId: string, scope: OrderListScope) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false as const, error: 'Not authenticated' }
    }

    const allowedRestaurantId = await resolveStaffRestaurantId(payload, user, restaurantId)
    if (!allowedRestaurantId || allowedRestaurantId !== restaurantId) {
      return { success: false as const, error: 'No access to this restaurant' }
    }

    const { docs } = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { status: { in: ORDER_LIST_STATUSES[scope] } },
          {
            or: [
              { ordering_collection: { not_equals: 'fnb-menu-events' } },
              { ordering_collection: { equals: null } },
            ],
          },
        ],
      },
      sort: '-createdAt',
      depth: 2,
      limit: 100,
      overrideAccess: true,
    })

    return { success: true as const, data: docs as Order[] }
  } catch (error) {
    console.error('Error listing orders:', error)
    return { success: false as const, error: 'Failed to load orders' }
  }
}

/**
 * Status change from a panel button. Runs as the requesting user
 * (overrideAccess: false) so collection access rules apply, and the
 * transition-guard hook rejects any skipped lifecycle step server-side.
 */
export async function updateOrderStatusAction(orderId: string, status: Order['status']) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false as const, error: 'Not authenticated' }
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { status },
      user,
      overrideAccess: false,
    })

    return { success: true as const }
  } catch (error) {
    console.error('Error updating order status:', error)
    const message =
      error instanceof Error && error.message ? error.message : 'Failed to update order'
    return { success: false as const, error: message }
  }
}
