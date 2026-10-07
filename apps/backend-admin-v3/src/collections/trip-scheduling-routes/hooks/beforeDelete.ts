import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const p = req.payload

  const dependents = [
    { slug: 'trip-scheduling-locations', field: 'route', label: 'Locations' },
    { slug: 'trip-scheduling-shuttles', field: 'route', label: 'Shuttles' },
  ]

  for (const item of dependents) {
    const usage = await p.find({
      collection: item.slug as any,
      where: { [item.field]: { equals: id } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    if (usage.totalDocs > 0) {
      throw new Error(
        `Route cannot be deleted. There are ${item.label} still linked to this route.`,
      )
    }
  }
}
