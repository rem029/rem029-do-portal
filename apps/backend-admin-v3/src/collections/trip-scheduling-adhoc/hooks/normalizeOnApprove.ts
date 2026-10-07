import type { CollectionBeforeChangeHook } from 'payload'
import { TripSchedulingAdhoc, TripSchedulingDriver } from '@/payload-types'

/**
 * Normalizes driver snapshot fields directly from the Driver relationship profile
 */
export const normalizeOnApprove: CollectionBeforeChangeHook<TripSchedulingAdhoc> = async ({
  data,
  req,
}) => {
  if (!data) return data

  const recordData = data as Record<string, unknown>

  // Automatically fetch phone details when a trip is approved to prevent administrative manual entry errors
  if (recordData.status === 'approved') {
    const driver = recordData.driver
    const driverId =
      typeof driver === 'object' && driver !== null
        ? (driver as { id: string | number }).id
        : driver

    if (driverId && req) {
      try {
        const driverDoc = await req.payload.findByID({
          collection: 'trip-scheduling-drivers',
          id: driverId as string,
        })

        const driverRecord = driverDoc as unknown as TripSchedulingDriver

        if (driverRecord) {
          // Micro-injection: Syncs the phone record to your adhoc request's sidebar field cleanly
          recordData.driverPhone = driverRecord.phone
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        req.payload.logger.warn(
          `[Adhoc Hook] Could not resolve driver phone for ID ${driverId}: ${message}`,
        )
      }
    }
  }

  return data
}
