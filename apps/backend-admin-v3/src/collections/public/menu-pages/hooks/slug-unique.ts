import { CollectionBeforeValidateHook, APIError } from 'payload'

/**
 * Ensures that the menu page slug does not collide with any existing fnb-menu-events slug.
 */
export const assertMenuPageSlugUniqueVsEvents: CollectionBeforeValidateHook = async ({
  data,
  req,
}) => {
  const slug =
    (data as { info?: { slug?: string }; slug?: string } | undefined)?.info?.slug ??
    (data as { info?: { slug?: string }; slug?: string } | undefined)?.slug

  if (!slug) return data

  const { docs } = await req.payload.find({
    collection: 'fnb-menu-events',
    where: {
      'info.slug': {
        equals: slug,
      },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (docs.length > 0) {
    throw new APIError('That URL slug is already used by an event page. Pick another.', 400)
  }

  return data
}
