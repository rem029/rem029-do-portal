'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isTripApprover } from '@/utilities/trip-scheduling-approver'

const ALLOWED_STATUSES = ['approved', 'declined', 'pending']

export async function updateBookingStatus({
  docId,
  status,
  driverId,
  declineReason,
  approverNotes,
}: {
  docId: string
  status: 'approved' | 'declined' | 'pending'
  driverId?: string | null
  driverPhone?: string | null
  declineReason?: string
  approverNotes?: string
}) {
  const payload = await getPayload({ config })

  try {
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    // Authentication alone is not authorization: this is the admin panel's approval action, so it must
    // require the same grant the collection's own `update` access requires (matches its access model).
    if (!isTripApprover(user, 'trip-scheduling-bookings')) {
      return { success: false, error: 'You are not allowed to perform this action.' }
    }

    // The TS types aren't enforced at runtime for a server action, so validate here.
    if (!docId || !ALLOWED_STATUSES.includes(status)) {
      return { success: false, error: 'Missing required fields: docId and status.' }
    }

    const updateData: Record<string, any> = {
      status,
    }

    if (status === 'pending') {
      updateData.driver = null
      updateData.driverPhone = null
      updateData.declineReason = null
    } else if (status === 'declined') {
      updateData.driver = null
      updateData.driverPhone = null
      if (declineReason !== undefined) updateData.declineReason = declineReason
    } else if (driverId) {
      // The driver is validated as a real, active record centrally in beforeValidate.
      updateData.driver = driverId
    }

    if (approverNotes !== undefined) {
      updateData.approverNotes = approverNotes
    }

    const updatedDoc = await payload.update({
      collection: 'trip-scheduling-bookings',
      id: docId,
      data: updateData,
      user,
      overrideAccess: true,
    })

    // Keep the response minimal: the admin UI only reads `success`, and the full doc would otherwise
    // carry approvalToken/driverToken past field-level access, which strips them only on read.
    return {
      success: true,
      doc: {
        id: updatedDoc.id,
        status: updatedDoc.status,
        driver: updatedDoc.driver,
        driverPhone: updatedDoc.driverPhone,
      },
    }
  } catch (error: any) {
    payload.logger.error(
      `[UpdateBookingStatus Action Error]: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, error: error.message || 'Failed to update booking status' }
  }
}
