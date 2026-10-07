import type { CollectionBeforeDeleteHook } from 'payload'

// 🛠️ TESTING / CLEANUP TOGGLE: Set to true to allow deleting all bookings regardless of status
const BYPASS_DELETE_LOCK = true

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  try {
    const doc = await req.payload.findByID({
      collection: 'trip-scheduling-bookings',
      id,
    })

    if (!doc) return

    if (!BYPASS_DELETE_LOCK) {
      if (doc.status === 'approved' || doc.status === 'completed') {
        throw new Error(
          `Operational Lock: Cannot physically delete a booking that is currently '${doc.status}'. This restriction protects active driver assignments and historical logistics logs.`,
        )
      }
    }

    const identifier = (doc as any).bookingId || doc.id
    req.payload.logger.info(`[Booking Hook] Safely deleting request: ${identifier}`)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error during deletion'
    req.payload.logger.error(`[Booking Hook] beforeDelete Error: ${message}`)
    throw e
  }
}
