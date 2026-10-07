import type { CollectionBeforeValidateHook } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import { validateApprovalDriver } from '@/utilities/trip-scheduling-approver'
import { findSameDayDriverAssignments } from '@/utilities/trip-scheduling-driver-day'

export const beforeValidate: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data

  // 1. Only generate ID and Slug on initial creation
  if (operation === 'create') {
    if (!data.bookingId) data.bookingId = uuidv4()

    if (data.fullName) {
      data.slug = data.fullName
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    }
  }

  // 2. Strict Corporate Email Domain Gate
  if (data.email) {
    try {
      const settings = await req.payload.findGlobal({
        slug: 'trip-scheduling-settings',
      })

      const allowedRows = settings?.allowedDomains || []
      const allowedDomains = allowedRows
        .map((row: any) => row.domain?.toLowerCase()?.trim())
        .filter(Boolean)

      if (allowedDomains.length > 0) {
        const emailDomain = data.email.split('@')[1]?.toLowerCase()?.trim()
        const isDomainAllowed = allowedDomains.includes(emailDomain)

        if (!isDomainAllowed) {
          throw new Error(
            `Submission rejected: The email domain '@${emailDomain}' is not authorized to request transport scheduling.`,
          )
        }
      }
    } catch (err: any) {
      req.payload.logger.warn(`[Domain Gate] Bypassed or settings missing: ${err.message}`)
    }
  }

  // 3. Strict Validation Logic for Status Changes
  if (data.status === 'declined' && !data.declineReason) {
    throw new Error('Decline reason is required when status is declined.')
  }

  // 4. Driver Availability
  // Approving a booking (or re-assigning the driver of an approved one) needs a real, active driver record.
  await validateApprovalDriver({ operation, data, originalDoc, req })

  if (data.status === 'approved') {
    if (!data.driver) {
      throw new Error(
        'A verified driver must be assigned to the booking before it can be marked as approved.',
      )
    }

    // Advisory only — approvers see this in the approval UI before confirming; logged here for paths
    // without one (admin form save, imports). Trip length is unpredictable, so it never blocks.
    const sameDay = await findSameDayDriverAssignments(req.payload, {
      driver: data.driver,
      travelDate: data.travelDate ?? originalDoc?.travelDate,
      self: { slug: 'trip-scheduling-bookings', id: originalDoc?.id },
    })
    if (sameDay.length > 0) {
      req.payload.logger.warn(
        `[Driver Day Check] Booking ${originalDoc?.id ?? '(new)'}: driver already has ${sameDay.length} open assignment(s) that day: ${sameDay.map((a) => `${a.kind} ${a.reference} @ ${a.time}`).join(', ')}`,
      )
    }
  }

  return data
}
