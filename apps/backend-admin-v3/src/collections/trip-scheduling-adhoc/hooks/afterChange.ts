import { CollectionAfterChangeHook } from 'payload'
import { TripSchedulingAdhoc } from '@/payload-types'
import { notifyApprovers } from './notifyApprovers'
import { sendStatusChangeEmail } from './sendStatusChangeEmail'

export const afterChangeHook: CollectionAfterChangeHook<TripSchedulingAdhoc> = async (args) => {
  const { operation } = args

  // ==========================================
  // 1. INTAKE NOTIFICATIONS (ONLY ON INITIAL CREATE)
  // ==========================================
  if (operation === 'create') {
    // Path A: Immediate Confirmation/Itinerary Receipt to Requester
    try {
      await sendStatusChangeEmail(args)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      args.req.payload.logger.error(
        `[Adhoc Notification Error] Failed to send creation receipt to requester: ${message}`,
      )
    }

    // Path B: Handshake Email Blast to Legacy Approver Group List
    try {
      await notifyApprovers(args)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      args.req.payload.logger.error(
        `[Adhoc Notification Error] Failed to execute approver blast handshake sequence: ${message}`,
      )
    }
  }

  // ==========================================
  // 2. LIFECYCLE RECEPTIONS (ON STATUS UPDATE UPDATES)
  // ==========================================
  if (operation === 'update') {
    try {
      await sendStatusChangeEmail(args)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      args.req.payload.logger.error(
        `[Adhoc Notification Error] Failed to execute status transition delivery update: ${message}`,
      )
    }
  }
}
