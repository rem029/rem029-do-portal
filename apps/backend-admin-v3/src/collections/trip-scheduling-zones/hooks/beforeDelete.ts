import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const p = req.payload
  // Only bookings reference zones (field `zones`); adhoc requests have no zone.
  const dependents = [{ slug: 'trip-scheduling-bookings', field: 'zones', label: 'Bookings' }]

  for (const item of dependents) {
    const usage = await p.find({
      collection: item.slug as any,
      where: { [item.field]: { equals: id } },
      limit: 1,
      overrideAccess: true,
    })

    if (usage.totalDocs > 0) {
      throw new Error(`Zone cannot be deleted because it is still used in ${item.label}.`)
    }
  }
}
