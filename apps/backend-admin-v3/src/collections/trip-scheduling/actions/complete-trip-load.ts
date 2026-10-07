// Server-only: loads a trip for the driver's completion page and action. Deliberately not 'use server'
// (that would expose the loader as a public action); only complete-trip.ts is an action.
import type { Payload } from 'payload'
import type { TripSchedulingAdhoc, TripSchedulingBooking } from '@/payload-types'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'
import { travelDayKey } from '@/utilities/trip-scheduling-driver-token'
import { formatZoneLabel } from '@/utilities/trip-scheduling-zone-label'

export const TRIP_COMPLETION_SLUGS = ['trip-scheduling-bookings', 'trip-scheduling-adhoc'] as const
export type TripCompletionSlug = (typeof TRIP_COMPLETION_SLUGS)[number]

// Only what the driver's assignment email already shows. Never tokens, the requester's email, trip cost,
// zone or district.
export type TripCompletionView = {
  requesterName: string
  requesterPhone: string
  operator: string
  passengers: number | null
  pickup: string
  destination: string
  // Bookings only; null for adhoc and for a zone that isn't populated.
  zone: string | null
  travelDate: string
  travelTime: string
  vehicle: string
  category: string | null
  reason: string
  specialNotes: string
  driverName: string
}

export type TripCompletionState = 'too-early' | 'completable' | 'completed'

export type TripCompletionLoad =
  | { state: 'invalid' }
  | { state: TripCompletionState; trip: TripCompletionView }

const INVALID = { state: 'invalid' } as const

export const isTripCompletionSlug = (slug: unknown): slug is TripCompletionSlug =>
  TRIP_COMPLETION_SLUGS.includes(slug as TripCompletionSlug)

// Title or name of a populated relationship, '' when it isn't populated.
const relationLabel = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of ['title', 'name']) {
    const value = record[key]
    if (typeof value === 'string' && value) return value
  }
  return ''
}

// Shared with the trip lifecycle job, which builds the same view for auto-settled trips.
export function toTripCompletionView(
  slug: TripCompletionSlug,
  doc: TripSchedulingBooking | TripSchedulingAdhoc,
): TripCompletionView {
  const common = {
    requesterName: doc.fullName || '',
    requesterPhone: doc.phone || '',
    operator: relationLabel(doc.operator),
    passengers: doc.passengers ?? null,
    destination: doc.destination || '',
    travelDate: formatDateOnly(doc.travelDate),
    vehicle: relationLabel(doc.vehicleNeeded),
    reason: doc.reason || '',
    specialNotes: doc.approverNotes || '',
    driverName: relationLabel(doc.driver),
  }

  if (slug === 'trip-scheduling-bookings') {
    const booking = doc as TripSchedulingBooking
    return {
      ...common,
      pickup: booking.pickupLocation || '',
      travelTime: booking.travelTime || '',
      category: relationLabel(booking.tripCategory) || null,
      zone: typeof booking.zones === 'object' ? formatZoneLabel(booking.zones) : null,
    }
  }

  const adhoc = doc as TripSchedulingAdhoc
  return { ...common, pickup: adhoc.origin || '', travelTime: adhoc.pickupTime || '', category: null, zone: null }
}

// Every failure (unknown slug or id, no/wrong/expired token, trip not approved or completed) is one
// 'invalid' state, so the response never reveals which check failed. Settled beats the travel-day
// guard; a trip whose status is already 'completed' but not settled (e.g. marked completed in the
// admin) stays completable so its approvers are still notified.
export async function loadTripForCompletion(
  payload: Payload,
  { slug, id, token }: { slug: unknown; id: unknown; token: unknown },
): Promise<TripCompletionLoad> {
  if (!isTripCompletionSlug(slug) || typeof id !== 'string' || !id) return INVALID
  if (typeof token !== 'string' || !token) return INVALID

  // Local API with the default overrideAccess, so the hidden driverToken fields are readable.
  // depth 1 populates operator, vehicle, category and driver for display.
  const doc = await payload
    .findByID({ collection: slug, id, depth: 1 })
    .catch(() => null)
  if (!doc) return INVALID

  const expiresAt = doc.driverTokenExpiration ? new Date(doc.driverTokenExpiration).getTime() : NaN
  if (
    !isTokenMatch(doc.driverToken, token) ||
    !(expiresAt > Date.now()) ||
    (doc.status !== 'approved' && doc.status !== 'completed')
  ) {
    return INVALID
  }

  const trip = toTripCompletionView(slug, doc)
  if (doc.is_trip_settled === true) return { state: 'completed', trip }

  const travelDay = travelDayKey(doc.travelDate)
  const today = travelDayKey(new Date())
  if (travelDay && today && today < travelDay) return { state: 'too-early', trip }

  return { state: 'completable', trip }
}
