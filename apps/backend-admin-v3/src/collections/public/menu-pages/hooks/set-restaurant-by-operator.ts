import type { FieldHook } from 'payload'
import { APIError } from 'payload'
import type { User } from '@/payload-types'

/**
 * Automatically sets the restaurant field based on the user's operator.
 * For users that are not admins, if they have an operator, find restaurants
 * belonging to that operator and auto-assign if only one is available.
 */
export const fnbSetRestaurantByOperator: FieldHook = async ({ req, operation, value }) => {
  const { user, payload } = req
  const { logger } = payload
  if (!user) throw new APIError('No User Found')

  const u = user as User

  if (operation === 'create' && !value) {
    // If user has an operator, try to auto-assign a restaurant
    if (u.operator) {
      const operatorId = typeof u.operator === 'string' ? u.operator : u.operator.id

      const restaurants = await payload.find({
        collection: 'restaurants',
        where: {
          operator: { equals: operatorId },
        },
        limit: 2,
        depth: 0,
        req,
        overrideAccess: true,
      })

      if (restaurants.totalDocs === 1) {
        logger.info(
          `[fnbSetRestaurantByOperator] Auto-assigning restaurant ${restaurants.docs[0].id} for user ${u.email}`,
        )
        return restaurants.docs[0].id
      }
    }
  }

  return value
}
