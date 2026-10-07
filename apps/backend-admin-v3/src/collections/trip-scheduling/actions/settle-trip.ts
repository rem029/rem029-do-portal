// Server-only: settles a trip (completes it and emails the approvers) once the caller has validated it.
// Deliberately not 'use server', so it can't be called directly; shared by the completeTrip action and
// the trip lifecycle job.
import type { Payload } from 'payload'
import { sql, type SQL } from '@payloadcms/db-postgres/drizzle'
import { runAtomicClaim } from '@/utilities/atomic-claim'
import type { TripCompletionSlug, TripCompletionView } from './complete-trip-load'
import { queueTripSettledEmails, type TripSettledSource } from './complete-trip-emails'

const TABLES: Record<TripCompletionSlug, SQL> = {
  'trip-scheduling-bookings': sql`"trip_scheduling_bookings"`,
  'trip-scheduling-adhoc': sql`"trip_scheduling_adhoc"`,
}

// Throws if the Payload update fails (after releasing the claim); callers decide how to report it.
export async function settleTrip(
  payload: Payload,
  {
    slug,
    id,
    trip,
    source,
  }: { slug: TripCompletionSlug; id: string; trip: TripCompletionView; source: TripSettledSource },
): Promise<'settled' | 'already-settled'> {
  // One atomic claim, so only one of several concurrent submissions settles the trip and emails the
  // approvers. Status 'completed' is accepted because a trip can be completed without being settled
  // (e.g. marked completed in the admin).
  const claimed = await runAtomicClaim<{ id: string }>(
    payload,
    sql`
      UPDATE ${TABLES[slug]}
      SET "is_trip_settled" = true
      WHERE "id" = ${id}
        AND "is_trip_settled" IS NOT TRUE
        AND "status" IN ('approved', 'completed')
      RETURNING "id"`,
  )
  if (claimed.length !== 1) return 'already-settled'

  try {
    // Through Payload so the hooks behave as the endpoint's update did (completedAt, requester email).
    await payload.update({
      collection: slug,
      id,
      overrideAccess: true,
      data: { status: 'completed', is_trip_settled: true, settlementSource: source },
    })
  } catch (updateErr) {
    // Release the claim so the trip can be settled again.
    await runAtomicClaim(
      payload,
      sql`UPDATE ${TABLES[slug]} SET "is_trip_settled" = false WHERE "id" = ${id} RETURNING "id"`,
    )
    throw updateErr
  }

  await queueTripSettledEmails(payload, slug, id, trip, source)
  return 'settled'
}
