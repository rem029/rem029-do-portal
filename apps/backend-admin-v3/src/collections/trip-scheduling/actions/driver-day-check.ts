'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isTripApprover, type TripRequestSlug } from '@/utilities/trip-scheduling-approver'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'
import {
  findSameDayDriverAssignments,
  type DriverDayAssignment,
} from '@/utilities/trip-scheduling-driver-day'

type DriverDayCheckResult =
  | { success: true; assignments: DriverDayAssignment[] }
  | { success: false; error: string }

const TRIP_SLUGS: TripRequestSlug[] = ['trip-scheduling-bookings', 'trip-scheduling-adhoc']

async function checkDriverDay(
  slug: TripRequestSlug,
  id: string,
  driverId: string,
  authorize: (doc: { approvalToken?: string | null }) => Promise<boolean>,
): Promise<DriverDayCheckResult> {
  // The TS union isn't enforced at runtime for a server action, so validate here.
  if (!TRIP_SLUGS.includes(slug) || !id || !driverId) {
    return { success: false, error: 'Missing or invalid parameters.' }
  }

  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({ collection: slug, id, depth: 0 })
    if (!doc || !(await authorize(doc))) {
      return { success: false, error: 'You are not allowed to perform this action.' }
    }

    const assignments = await findSameDayDriverAssignments(payload, {
      driver: driverId,
      travelDate: doc.travelDate,
      self: { slug, id: doc.id },
    })
    return { success: true, assignments }
  } catch (err) {
    payload.logger.error(`[Driver Day Check] Lookup failed: ${err instanceof Error ? err.message : err}`)
    return { success: false, error: 'Could not check the driver’s other assignments.' }
  }
}

// Admin approval panels: same guard as updateBookingStatus.
export async function checkDriverDayForApprover(input: {
  slug: TripRequestSlug
  id: string
  driverId: string
}): Promise<DriverDayCheckResult> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return checkDriverDay(input.slug, input.id, input.driverId, async () =>
    Boolean(user && isTripApprover(user, input.slug)),
  )
}

// Public token approval pages: same guard as processBookingWorkflow / processAdhocWorkflow.
export async function checkDriverDayForToken(input: {
  slug: TripRequestSlug
  id: string
  token: string
  driverId: string
}): Promise<DriverDayCheckResult> {
  return checkDriverDay(input.slug, input.id, input.driverId, async (doc) =>
    Boolean(input.token && isTokenMatch(doc.approvalToken, input.token)),
  )
}
