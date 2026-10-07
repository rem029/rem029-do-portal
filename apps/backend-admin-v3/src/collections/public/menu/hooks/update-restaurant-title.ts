import type { FieldHook } from 'payload'

/**
 * Looks up the restaurant title from the relationship.
 * Can be used as a virtual field hook.
 */
export const updateRestaurantTitle: FieldHook = async ({ data, req, value }) => {
  const { payload } = req
  const restaurantId = typeof data?.restaurant === 'object' ? data?.restaurant?.id : data?.restaurant

  if (restaurantId) {
    const restaurant = await payload.findByID({
      id: restaurantId,
      collection: 'restaurants',
      req,
      depth: 0,
    })

    if (restaurant) {
      return restaurant?.title || ''
    }
  }

  return value
}
