import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const p = req.payload
  // Bookings store pickup/destination as free text, so only shuttles reference locations.
  const dependents = [{ slug: 'trip-scheduling-shuttles', field: 'location', label: 'Shuttles' }]

  for (const item of dependents) {
    const usage = await p.find({
      collection: item.slug as any,
      where: { [item.field]: { equals: id } },
      limit: 1,
      overrideAccess: true,
    })

    if (usage.totalDocs > 0) {
      throw new Error(`Location cannot be deleted because it is still used in ${item.label}.`)
    }
  }
}
