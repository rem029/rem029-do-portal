import type { PayloadRequest, Where } from 'payload'
import type { User } from '@/payload-types'
import { getStaffEventScope } from './fnb-staff-access'

export const operatorAccessRefine = async (
  hasAccess: boolean,
  slug: string,
  req: PayloadRequest,
): Promise<boolean | Where> => {
  const user = req.user as User | undefined

  if (!hasAccess || !user) return false

  if (user.super_user) return true

  // Admin UI access should be boolean, not a Where clause
  if (slug === 'admin') return true

  if (user.operator) {
    const operatorId = typeof user.operator === 'string' ? user.operator : user.operator.id

    try {
      const operator = await req.payload.findByID({
        collection: 'operators',
        id: operatorId,
        depth: 0,
        req,
        overrideAccess: true,
      })

      if (operator.super_user) {
        return true
      }

      return {
        operator: {
          equals: operatorId,
        },
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false
    }
  }

  return false
}

/**
 * Refines access to `orders`. A non-super_user reaches an order two ways:
 *   - it belongs to the one restaurant they're pinned to, OR
 *   - its snapshotted `ordering_slug` is an event they're staff on
 *     (`fnb-event-staff`, any role - see getStaffEventScope).
 * Restaurant-pinned staff only see events they're *explicitly* added to - the
 * no-event-rows branch returns just the restaurant filter, not the restaurant's
 * events. `transition-guard` layers the per-role panel-grant check on top.
 */
export const orderAccessRefine = async (
  hasAccess: boolean,
  slug: string,
  req: PayloadRequest,
): Promise<boolean | Where> => {
  const user = req.user as User | undefined

  if (!hasAccess || !user) return false
  if (user.super_user) return true
  if (slug === 'admin') return true

  const restaurantId = typeof user.restaurant === 'object' ? user.restaurant?.id : user.restaurant

  const scope = getStaffEventScope(user) // sync — no fnb-event-staff query
  const eventSlugs = Array.from(
    new Set([...scope.waiter, ...scope.boh, ...scope.cashier]),
  )

  // The restaurant clause deliberately EXCLUDES event orders (they carry the
  // hosting restaurant's id too): restaurant-pinned staff reach an event's
  // orders only via an explicit fnb-event-staff row (decision §5.1). Legacy
  // orders have a null ordering_collection - keep them in scope.
  const restaurantClause: Where | null = restaurantId
    ? {
        and: [
          { restaurant: { equals: restaurantId } },
          {
            or: [
              { ordering_collection: { not_equals: 'fnb-menu-events' } },
              { ordering_collection: { equals: null } },
            ],
          },
        ],
      }
    : null
  const eventClause: Where | null =
    eventSlugs.length > 0 ? { ordering_slug: { in: eventSlugs } } : null

  if (restaurantClause && eventClause) return { or: [restaurantClause, eventClause] }
  return restaurantClause ?? eventClause ?? false
}

/**
 * Refines access to filter by operator and restaurant.
 * If user has a restaurant assigned, they only see data for that restaurant.
 * If user only has an operator, they see all data for that operator.
 */
export const restaurantAccessRefine = async (
  hasAccess: boolean,
  slug: string,
  req: PayloadRequest,
): Promise<boolean | Where> => {
  const user = req.user as User | undefined

  if (!hasAccess || !user) return false
  if (user.super_user) return true
  if (slug === 'admin') return true

  const operatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator
  const restaurantId = typeof user.restaurant === 'object' ? user.restaurant?.id : user.restaurant

  if (operatorId) {
    if (restaurantId) {
      return {
        and: [
          { operator: { equals: operatorId } },
          { restaurant: { equals: restaurantId } },
        ],
      }
    }
    return {
      operator: { equals: operatorId },
    }
  }

  return false
}

/**
 * Item-level ownership refine, for any collection that adds `OwnersField`
 * (`@/common/fields/owners`) alongside the required `CreatedByField`. Reached
 * only when the caller does NOT have the collection's own `super_user` grant
 * (that short-circuits earlier in `accessCheck` via `isCollectionSuperUser`)
 * — so everyone here has a plain read/update/etc. boolean for the collection
 * and must be additionally scoped to:
 *   - their operator (tenant boundary, non-negotiable), AND
 *   - EITHER the document they created OR one they're listed as an owner on.
 *
 * Introduced for `fnb-menu-events` (TECH-0098 Task 11C) — see `CLAUDE.md` →
 * "Item-level Ownership (optional)" before reusing on another collection.
 * Pair with `canUserAccessOwnedDocument` (`@/utilities/ownership-condition`)
 * for any client-side `admin.condition` that needs the same rule.
 */
export const ownershipAccessRefine = async (
  hasAccess: boolean,
  slug: string,
  req: PayloadRequest,
): Promise<boolean | Where> => {
  const user = req.user as User | undefined

  if (!hasAccess || !user) return false
  if (user.super_user) return true
  if (slug === 'admin') return true

  const operatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator
  if (!operatorId) return false

  return {
    and: [
      { operator: { equals: operatorId } },
      {
        or: [
          { created_by: { equals: user.id } },
          { owners: { in: [user.id] } },
        ],
      },
    ],
  }
}

