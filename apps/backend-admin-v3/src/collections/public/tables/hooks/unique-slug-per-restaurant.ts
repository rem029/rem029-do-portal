import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Table slugs aren't globally unique (see Slug(true, ...)) but must be unique per
 * restaurant, since the guest `?table=` QR link resolves a table by slug scoped to
 * its restaurant (resolveTableAction).
 */
export const uniqueSlugPerRestaurant: CollectionBeforeValidateHook = async ({
  req,
  data,
  operation,
  originalDoc,
}) => {
  const slug = (data?.slug ?? originalDoc?.slug) as string | undefined
  const restaurant = data?.restaurant ?? originalDoc?.restaurant
  const restaurantId = typeof restaurant === 'object' ? restaurant?.id : restaurant

  if (!slug || !restaurantId) return data

  const { payload } = req

  const { docs } = await payload.find({
    collection: 'tables',
    where: {
      and: [
        { slug: { equals: slug } },
        { restaurant: { equals: restaurantId } },
        ...(operation === 'update' && originalDoc?.id
          ? [{ id: { not_equals: originalDoc.id } }]
          : []),
      ],
    },
    limit: 1,
    depth: 0,
    req,
  })

  if (docs.length > 0) {
    throw new APIError(`A table with slug "${slug}" already exists for this restaurant.`, 400)
  }

  return data
}
