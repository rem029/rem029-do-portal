'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { loadTripForCompletion, type TripCompletionSlug } from './complete-trip-load'
import { settleTrip } from './settle-trip'

export type CompleteTripResult =
  | { ok: true }
  | { ok: false; state: 'invalid' | 'too-early' | 'completed' }

export async function completeTrip({
  slug,
  id,
  token,
}: {
  slug: string
  id: string
  token: string
}): Promise<CompleteTripResult> {
  const payload = await getPayload({ config })

  try {
    const loaded = await loadTripForCompletion(payload, { slug, id, token })
    if (loaded.state !== 'completable') return { ok: false, state: loaded.state }

    const result = await settleTrip(payload, {
      slug: slug as TripCompletionSlug,
      id,
      trip: loaded.trip,
      source: 'driver',
    })
    if (result === 'already-settled') return { ok: false, state: 'completed' }

    return { ok: true }
  } catch (err) {
    payload.logger.error(
      `[Complete Trip] Completion failed for ${slug}/${id}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { ok: false, state: 'invalid' }
  }
}
