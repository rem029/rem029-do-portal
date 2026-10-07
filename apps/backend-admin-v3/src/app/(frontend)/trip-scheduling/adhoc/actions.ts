'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface AdhocFormSubmissionInput {
  fullName: string
  email: string
  phone: string
  passengers: number
  operator: string
  vehicleNeeded: string
  travelDate: string
  pickupTime: string
  dropoffTime?: string
  origin: string
  destination: string
  reason: string
}

export async function submitAdhocRequest(data: AdhocFormSubmissionInput) {
  const payload = await getPayload({ config })

  try {
    // Basic structural guard
    if (!data.fullName || !data.email || !data.travelDate || !data.pickupTime || !data.origin || !data.destination || !data.reason) {
      return { success: false, error: 'Please fill out all required fields marked with an asterisk (*).' }
    }

    const [y, m, d] = data.travelDate.split('-').map(Number)
    const travelDateUTC = new Date(Date.UTC(y, m - 1, d)).toISOString()
    // → "2026-09-17T00:00:00.000Z", explicit and unambiguous
    
    // Create the document via Payload Local API. 
    // This automatically fires beforeValidate, beforeChange, token generation, and email jobs!
    const newDoc = await payload.create({
      collection: 'trip-scheduling-adhoc',
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passengers: Number(data.passengers) || 1,
        operator: data.operator,
        vehicleNeeded: data.vehicleNeeded,
        // travelDate: data.travelDate,
        travelDate: travelDateUTC,
        pickupTime: data.pickupTime,
        dropoffTime: data.dropoffTime || undefined,
        origin: data.origin,
        destination: data.destination,
        reason: data.reason,
        status: 'pending',
      },
    })

    return { success: true, docId: newDoc.id }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected system error occurred during submission.'
    payload.logger.error(`[Adhoc Form Submission Error]: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}