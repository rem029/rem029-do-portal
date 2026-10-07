import { CollectionBeforeValidateHook, APIError } from 'payload'

/**
 * Ensures that the event slug does not collide with any existing menu-pages slug.
 */
export const assertEventSlugUniqueVsMenuPages: CollectionBeforeValidateHook = async ({
  data,
  req,
}) => {
  const slug =
    (data as { info?: { slug?: string }; slug?: string } | undefined)?.info?.slug ??
    (data as { info?: { slug?: string }; slug?: string } | undefined)?.slug

  if (!slug) return data

  const { docs } = await req.payload.find({
    collection: 'menu-pages',
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
    throw new APIError('That URL slug is already used by a menu page. Pick another.', 400)
  }

  return data
}
