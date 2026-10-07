import type { Payload, Where } from 'payload'
import type { TripSchedulingAdhoc, TripSchedulingBooking } from '@/payload-types'
import {
  TRIP_COMPLETION_SLUGS,
  toTripCompletionView,
  type TripCompletionSlug,
} from '@/collections/trip-scheduling/actions/complete-trip-load'
import { settleTrip } from '@/collections/trip-scheduling/actions/settle-trip'
import { driverWindowClosed, travelDayEnded } from '@/utilities/trip-scheduling-driver-token'

const BATCH_SIZE = 100

export type LifecycleCounts = { settled: number; expired: number; skipped: number; errors: number }

type TripDoc = TripSchedulingBooking | TripSchedulingAdhoc

// Collects the matching ids first, then loads them in batches: trips that get settled or expired
// mid-run leave the result set, which would otherwise shift page offsets and skip rows.
async function forEachTrip(
  payload: Payload,
  slug: TripCompletionSlug,
  where: Where,
  handle: (doc: TripDoc) => Promise<void>,
): Promise<void> {
  const { docs: idDocs } = await payload.find({
    collection: slug,
    where,
    select: { travelDate: true },
    depth: 0,
    pagination: false,
    sort: 'travelDate',
  })
  const ids = idDocs.map((doc) => doc.id)

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const { docs } = await payload.find({
      collection: slug,
      where: { id: { in: ids.slice(i, i + BATCH_SIZE) } },
      depth: 1,
      pagination: false,
      sort: 'travelDate',
    })
    for (const doc of docs) await handle(doc)
  }
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

// A) Approved trips whose driver completion window has closed are settled as if the driver had
// confirmed them (source: auto). The bookings requester gets the usual COMPLETED email.
async function autoSettle(payload: Payload, slug: TripCompletionSlug, counts: LifecycleCounts) {
  const where: Where = {
    and: [
      { status: { in: ['approved', 'completed'] } },
      { is_trip_settled: { not_equals: true } },
      { travelDate: { less_than: new Date().toISOString() } },
    ],
  }

  await forEachTrip(payload, slug, where, async (doc) => {
    try {
      const closed = driverWindowClosed(doc.travelDate)
      if (closed === null) {
        payload.logger.warn(`[Trip Lifecycle] ${slug}/${doc.id}: invalid travel date; not auto-settled.`)
        counts.skipped++
        return
      }
      if (!closed) {
        counts.skipped++
        return
      }

      const result = await settleTrip(payload, {
        slug,
        id: doc.id,
        trip: toTripCompletionView(slug, doc),
        source: 'auto',
      })
      if (result === 'settled') counts.settled++
      else counts.skipped++
    } catch (err) {
      counts.errors++
      payload.logger.error(`[Trip Lifecycle] ${slug}/${doc.id}: auto-settle failed: ${errorMessage(err)}`)
    }
  })
}

// B) Pending trips whose travel day has ended without a decision become 'expired'. The update runs
// the collection hooks, so the requester gets the status email.
async function expirePending(payload: Payload, slug: TripCompletionSlug, counts: LifecycleCounts) {
  const where: Where = {
    and: [
      { status: { equals: 'pending' } },
      { travelDate: { less_than: new Date().toISOString() } },
    ],
  }

  await forEachTrip(payload, slug, where, async (doc) => {
    try {
      const ended = travelDayEnded(doc.travelDate)
      if (ended === null) {
        payload.logger.warn(`[Trip Lifecycle] ${slug}/${doc.id}: invalid travel date; not expired.`)
        counts.skipped++
        return
      }
      if (!ended) {
        counts.skipped++
        return
      }

      // Only while still pending, in case an approver decided since the query.
      const result = await payload.update({
        collection: slug,
        where: { and: [{ id: { equals: doc.id } }, { status: { equals: 'pending' } }] },
        data: { status: 'expired' },
        overrideAccess: true,
      })
      if (result.errors.length > 0) {
        counts.errors++
        payload.logger.error(
          `[Trip Lifecycle] ${slug}/${doc.id}: expiry failed: ${result.errors.map((e) => e.message).join('; ')}`,
        )
      } else if (result.docs.length === 1) {
        counts.expired++
      } else {
        counts.skipped++
      }
    } catch (err) {
      counts.errors++
      payload.logger.error(`[Trip Lifecycle] ${slug}/${doc.id}: expiry failed: ${errorMessage(err)}`)
    }
  })
}

export async function runTripSchedulingLifecycle(payload: Payload): Promise<LifecycleCounts> {
  const counts: LifecycleCounts = { settled: 0, expired: 0, skipped: 0, errors: 0 }

  for (const slug of TRIP_COMPLETION_SLUGS) {
    await autoSettle(payload, slug, counts)
    await expirePending(payload, slug, counts)
  }

  return counts
}
