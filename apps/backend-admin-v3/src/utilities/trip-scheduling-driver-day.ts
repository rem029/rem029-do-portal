import type { Payload, Where } from 'payload'
import type { TripRequestSlug } from '@/utilities/trip-scheduling-approver'
import { relToId } from '@/utilities/helper/trip-scheduling-utils'

export type DriverDayAssignment = {
  kind: 'Booking' | 'Ad-hoc'
  reference: string
  time: string
  status: string
}

// Server-local calendar day — travelDate is stored as local midnight, so a raw UTC comparison would
// put morning trips on the previous day.
export const localDayRange = (travelDate: string | Date): { start: Date; end: Date } | null => {
  const date = new Date(travelDate)
  if (isNaN(date.getTime())) return null
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return { start, end }
}

// Other approved (assigned, not yet completed) trips for this driver on the same calendar day, across
// both request collections. Advisory only: callers warn, never block. Returns no requester details,
// since the result is also shown on the public token approval page.
export async function findSameDayDriverAssignments(
  payload: Payload,
  {
    driver,
    travelDate,
    self,
  }: {
    driver: unknown
    travelDate: string | Date | null | undefined
    self: { slug: TripRequestSlug; id?: string | number | null }
  },
): Promise<DriverDayAssignment[]> {
  const driverId = relToId(driver)
  const range = travelDate ? localDayRange(travelDate) : null
  if (!driverId || !range) return []

  const sameDay = (slug: TripRequestSlug): Where => {
    const and: Where[] = [
      { driver: { equals: driverId } },
      { status: { equals: 'approved' } },
      { travelDate: { greater_than_equal: range.start.toISOString() } },
      { travelDate: { less_than: range.end.toISOString() } },
    ]
    if (self.slug === slug && self.id) and.push({ id: { not_equals: self.id } })
    return { and }
  }

  const [bookings, adhoc] = await Promise.all([
    payload.find({
      collection: 'trip-scheduling-bookings',
      where: sameDay('trip-scheduling-bookings'),
      depth: 0,
      limit: 20,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'trip-scheduling-adhoc',
      where: sameDay('trip-scheduling-adhoc'),
      depth: 0,
      limit: 20,
      overrideAccess: true,
    }),
  ])

  return [
    ...bookings.docs.map((doc) => ({
      kind: 'Booking' as const,
      reference: doc.bookingId || String(doc.id),
      time: doc.travelTime,
      status: doc.status || 'approved',
    })),
    ...adhoc.docs.map((doc) => ({
      kind: 'Ad-hoc' as const,
      reference: doc.adhocId || String(doc.id),
      time: doc.pickupTime,
      status: doc.status || 'approved',
    })),
  ].sort((a, b) => a.time.localeCompare(b.time))
}
