// apps/backend-admin-v3/src/collections/trip-scheduling-vehicles/hooks/beforeDelete.ts
import type { CollectionBeforeDeleteHook } from 'payload'

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const p = req.payload

  // Define the collections that might be using this vehicle
  const dependents = [
    { slug: 'trip-scheduling-bookings', field: 'vehicleNeeded', label: 'Bookings' },
    { slug: 'trip-scheduling-adhoc', field: 'vehicleNeeded', label: 'Adhoc Requests' },
    { slug: 'trip-scheduling-shuttles', field: 'vehicle', label: 'Shuttles' },
  ]

  for (const item of dependents) {
    const usage = await p.find({
      collection: item.slug as any,
      where: {
        [item.field]: { equals: id },
      },
      limit: 1, // We only need to find one to block deletion
      overrideAccess: true,
      depth: 0,
    })

    if (usage.totalDocs > 0) {
      throw new Error(
        `Cannot delete this vehicle because it is currently assigned to one or more ${item.label}. Please reassign or remove the vehicle from those records first.`,
      )
    }
  }

  p.logger.info(`[Vehicle Hook] Integrity check passed. Deleting vehicle ID: ${id}`)
}
