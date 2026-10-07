import type { CollectionBeforeChangeHook } from 'payload'

export const normalizeOnApprove: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  // Automatically fetch phone details when a trip is approved to prevent manual typing
  if (data.status === 'approved') {
    const driverId = typeof data.driver === 'object' ? (data.driver as any)?.id : data.driver

    if (driverId && req) {
      try {
        const driver = await req.payload.findByID({
          collection: 'trip-scheduling-drivers',
          id: driverId,
        })

        if (driver) {
          // Micro-injection: Syncs the phone record to your booking's sidebar field
          data.driverPhone = driver.phone
        }
      } catch (e) {
        req.payload.logger.warn(`[Booking Hook] Could not resolve driver phone for ID ${driverId}.`)
      }
    }
  }

  return data
}
