'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'

interface BookingWorkflowInput {
  id: string
  token: string
  status: 'approved' | 'declined' | 'pending' | 'completed' | 'expired'
  declineReason?: string
  driverId?: string
  approverNotes?: string
}

export async function processBookingWorkflow(input: BookingWorkflowInput) {
  const payload = await getPayload({ config })

  try {
    const { id, token, status, declineReason, driverId, approverNotes } = input

    if (!id || !token || !status) {
      return { success: false, error: 'Missing critical identification parameters.' }
    }

    const booking = await payload.findByID({
      collection: 'trip-scheduling-bookings',
      id,
      depth: 0,
    })

    if (!booking || !isTokenMatch(booking.approvalToken, token)) {
      return { success: false, error: 'Invalid or expired verification security signature.' }
    }

    if (booking.status !== 'pending') {
      return { success: false, error: 'This booking workflow transaction is already finalized.' }
    }

    // A real, active driver record is required to approve; validated centrally in beforeValidate
    // (validateApprovalDriver), which also rejects an unknown or inactive id. This check exists only
    // to fail fast with a clearer message before that hook runs.
    if (status === 'approved' && !driverId) {
      return {
        success: false,
        error: 'Please assign a driver.',
      }
    }

    const updateData: Record<string, any> = { status }

    if (status === 'declined') {
      updateData.declineReason = declineReason
    } else {
      updateData.driver = driverId || null
      if (approverNotes) updateData.approverNotes = approverNotes
    }

    await payload.update({
      collection: 'trip-scheduling-bookings',
      id,
      overrideAccess: true,
      data: updateData,
    })

    return { success: true }
  } catch (err) {
    payload.logger.error(
      `[Public Booking Workflow Transaction Crash]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { success: false, error: 'Internal system engine transactional failure.' }
  }
}