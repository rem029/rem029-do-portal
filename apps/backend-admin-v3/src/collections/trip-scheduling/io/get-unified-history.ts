'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getHistoryViewer } from '@/utilities/trip-scheduling-history-session'
import {
  normalizeBookingDoc,
  normalizeAdhocDoc,
  getTimelineWeight,
} from '@/utilities/helper/trip-scheduling-utils'

export async function getUnifiedHistory() {
  const payload = await getPayload({ config })

  try {
    const viewer = await getHistoryViewer()
    if (!viewer) {
      return { success: false, error: 'Not authorized', docs: [] }
    }

    const [bookingsResult, adhocResult] = await Promise.all([
      payload.find({
        collection: 'trip-scheduling-bookings',
        overrideAccess: true,
        depth: 2,
        limit: 1000,
        sort: '-createdAt',
      }),
      payload.find({
        collection: 'trip-scheduling-adhoc',
        overrideAccess: true,
        depth: 2,
        limit: 1000,
        sort: '-createdAt',
      }),
    ])

    const normalizedBookings = (bookingsResult.docs || []).map(normalizeBookingDoc)
    const normalizedAdhoc = (adhocResult.docs || []).map(normalizeAdhocDoc)

    const fullCombinedLedger = [...normalizedBookings, ...normalizedAdhoc].sort((a, b) => {
      return (
        getTimelineWeight(b.requestedDate, b.requestedTime) -
        getTimelineWeight(a.requestedDate, a.requestedTime)
      )
    })

    return {
      success: true,
      docs: fullCombinedLedger,
    }
  } catch (err) {
    payload.logger.error(
      `[Unified History Server Action Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      success: false,
      error: 'Internal server error processing unified history ledger.',
      docs: [],
    }
  }
}
