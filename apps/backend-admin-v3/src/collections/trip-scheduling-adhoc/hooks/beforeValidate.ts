import type { CollectionBeforeValidateHook } from 'payload'
import { TripSchedulingAdhoc } from '@/payload-types'
import { v4 as uuidv4 } from 'uuid'
import { validateApprovalDriver } from '@/utilities/trip-scheduling-approver'
import { findSameDayDriverAssignments } from '@/utilities/trip-scheduling-driver-day'

export const beforeValidate: CollectionBeforeValidateHook<TripSchedulingAdhoc> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const recordData = data as Record<string, unknown>

  // ==========================================
  // 1. CONDITIONAL INTAKE INITIALIZATION (ON CREATE)
  // ==========================================
  if (operation === 'create') {
    if (!recordData.adhocId) recordData.adhocId = uuidv4()

    const fullName = recordData.fullName
    if (fullName && typeof fullName === 'string') {
      recordData.slug = fullName
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    }
  }

  // ==========================================
  // 2. CORPORATE EMAIL DOMAIN GATE
  // ==========================================
  const emailVal = recordData.email
  if (emailVal && typeof emailVal === 'string') {
    try {
      const settings = await req.payload.findGlobal({
        slug: 'trip-scheduling-settings',
      })

      const settingsRecord = settings as unknown as Record<string, unknown>
      const allowedRows = (settingsRecord?.allowedDomains as Array<Record<string, unknown>>) || []
      const allowedDomains = allowedRows
        .map((row) => (typeof row.domain === 'string' ? row.domain.toLowerCase().trim() : ''))
        .filter(Boolean)

      if (allowedDomains.length > 0) {
        const emailDomain = emailVal.split('@')[1]?.toLowerCase()?.trim()
        const isDomainAllowed = emailDomain ? allowedDomains.includes(emailDomain) : false

        if (!isDomainAllowed) {
          throw new Error(
            `Submission rejected: The email domain '@${emailDomain}' is not authorized to request transport scheduling.`,
          )
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      req.payload.logger.warn(`[Adhoc Domain Gate] Bypassed or settings missing: ${message}`)
    }
  }

  // ==========================================
  // 3. STRICT VALIDATION FOR DECLINED STATUS
  // ==========================================
  if (recordData.status === 'declined' && !recordData.declineReason) {
    throw new Error('Decline reason is required when status is declined.')
  }

  // ==========================================
  // 4. DRIVER AVAILABILITY
  // ==========================================
  // Approving a request (or re-assigning the driver of an approved one) needs a real, active driver record.
  await validateApprovalDriver({ operation, data, originalDoc, req })

  if (recordData.status === 'approved') {
    const driver = recordData.driver
    const driverName = recordData.driverName
    const driverPhone = recordData.driverPhone

    // Creates (CSV imports, workflow sync) may still carry fallback contact details instead of a driver.
    if (operation === 'create' && !driver && !(driverName && driverPhone)) {
      throw new Error(
        'Driver profile allocation or fallback contact details must be provided when approved.',
      )
    }

    // Advisory only — approvers see this in the approval UI before confirming; logged here for paths
    // without one (admin form save, imports). Trip length is unpredictable, so it never blocks.
    const sameDay = await findSameDayDriverAssignments(req.payload, {
      driver: driver ?? originalDoc?.driver,
      travelDate: (recordData.travelDate as string | undefined) ?? originalDoc?.travelDate,
      self: { slug: 'trip-scheduling-adhoc', id: originalDoc?.id },
    })
    if (sameDay.length > 0) {
      req.payload.logger.warn(
        `[Driver Day Check] Ad-hoc ${originalDoc?.id ?? '(new)'}: driver already has ${sameDay.length} open assignment(s) that day: ${sameDay.map((a) => `${a.kind} ${a.reference} @ ${a.time}`).join(', ')}`,
      )
    }
  }

  return data
}
