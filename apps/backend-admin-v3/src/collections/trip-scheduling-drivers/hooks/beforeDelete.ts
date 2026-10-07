import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const p = req.payload

  const dependents = [
    { slug: 'trip-scheduling-bookings', field: 'driver', label: 'Bookings' },
    { slug: 'trip-scheduling-adhoc', field: 'driver', label: 'Adhoc Requests' },
    { slug: 'trip-scheduling-shuttles', field: 'driver', label: 'Shuttles' },
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
        `Driver cannot be deleted. They are still assigned to ${item.label}. Please reassign those trips first.`,
      )
    }
  }
}
