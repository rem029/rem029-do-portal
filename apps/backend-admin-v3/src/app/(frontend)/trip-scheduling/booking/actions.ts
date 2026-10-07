'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface BookingFormSubmissionInput {
  fullName: string
  email: string
  phone: string
  operator: string
  tripCategory: string
  passengers: number
  vehicleNeeded: string
  pickupLocation: string
  destination: string
  zones: string
  travelDate: string
  travelTime: string
  reason: string
}

export async function submitBookingRequest(data: BookingFormSubmissionInput) {
  const payload = await getPayload({ config })

  try {
    // Basic structural guard
    if (
      !data.fullName ||
      !data.email ||
      !data.operator ||
      !data.tripCategory ||
      !data.pickupLocation ||
      !data.destination ||
      !data.zones ||
      !data.travelDate ||
      !data.travelTime ||
      !data.reason
    ) {
      return { success: false, error: 'Please fill out all required fields marked with an asterisk (*).' }
    }

    const [y, m, d] = data.travelDate.split('-').map(Number)
    const travelDateUTC = new Date(Date.UTC(y, m - 1, d)).toISOString()
    // → "2026-09-17T00:00:00.000Z", explicit and unambiguous

    // Create the document via Payload Local API.
    // This automatically fires hooks, token generation, and email jobs!
    const newDoc = await payload.create({
      collection: 'trip-scheduling-bookings',
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        operator: data.operator,
        tripCategory: data.tripCategory,
        passengers: Number(data.passengers) || 1,
        vehicleNeeded: data.vehicleNeeded,
        pickupLocation: data.pickupLocation,
        destination: data.destination,
        zones: data.zones,
        travelDate: travelDateUTC,
        travelTime: data.travelTime,
        reason: data.reason,
        status: 'pending',
      },
    })

    return { success: true, docId: newDoc.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected system error occurred during submission.'
    payload.logger.error(`[Booking Form Submission Error]: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}