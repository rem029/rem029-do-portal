import { CollectionAfterChangeHook } from 'payload'
import { TripSchedulingBooking } from '@/payload-types'
import { notifyApprovers } from './notifyApprovers'
import { sendStatusChangeEmail } from './sendStatusChangeEmail'

export const afterChangeHook: CollectionAfterChangeHook<TripSchedulingBooking> = async (args) => {
  const { operation } = args

  // Sanitize args to resolve strict null/undefined relationship type conflicts
  const sanitizedArgs = {
    ...args,
    doc: {
      ...args.doc,
      vehicleNeeded: args.doc.vehicleNeeded ?? undefined,
      operator: args.doc.operator ?? undefined,
      driver: args.doc.driver ?? undefined,
    },
  }

  // ==========================================
  // 1. INTAKE NOTIFICATIONS (ONLY ON INITIAL CREATE)
  // ==========================================
  if (operation === 'create') {
    // Path A: Immediate Confirmation/Itinerary Receipt to Requester
    try {
      await sendStatusChangeEmail(sanitizedArgs as any)
    } catch (err) {
      args.req.payload.logger.error(
        `[Notification Error] Failed to send creation receipt to requester: ${err}`,
      )
    }

    // Path B: Handshake Email Blast to Legacy Approver Group List
    try {
      await notifyApprovers(sanitizedArgs as any)
    } catch (err) {
      args.req.payload.logger.error(
        `[Notification Error] Failed to execute approver blast handshake sequence: ${err}`,
      )
    }
  }

  // ==========================================
  // 2. LIFECYCLE RECEPTIONS (ON STATUS UPDATE UPDATES)
  // ==========================================
  if (operation === 'update') {
    try {
      await sendStatusChangeEmail(sanitizedArgs as any)
    } catch (err) {
      args.req.payload.logger.error(
        `[Notification Error] Failed to execute status transition delivery update: ${err}`,
      )
    }
  }
}
