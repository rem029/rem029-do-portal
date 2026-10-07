'use server'

import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres/drizzle'
import config from '@payload-config'
import {
  buildResponseEmail,
  queueStaffVoiceEmail,
} from '@/collections/trip-scheduling-staff-voice/emails'
import { runAtomicClaim } from '@/utilities/atomic-claim'
import { isReviewLinkValid } from './review-token'

const MAX_NOTE_LENGTH = 2000

export interface StaffVoiceResponseInput {
  id: string
  token: string
  note: string
}

export type StaffVoiceResponseResult =
  | { success: true; emailQueued: boolean }
  | { success: false; error: string }

const ALREADY_RESPONDED = 'This submission has already been responded to.'

export async function sendStaffVoiceResponse({
  id,
  token,
  note,
}: StaffVoiceResponseInput): Promise<StaffVoiceResponseResult> {
  const payload = await getPayload({ config })

  try {
    const cleanNote = note?.trim()

    if (!id || !token || !cleanNote) {
      return { success: false, error: 'Please write a response before sending.' }
    }

    if (cleanNote.length > MAX_NOTE_LENGTH) {
      return {
        success: false,
        error: `The response must be ${MAX_NOTE_LENGTH} characters or fewer.`,
      }
    }

    // A missing document and a bad token look the same to the caller.
    const doc = await payload
      .findByID({ collection: 'trip-scheduling-staff-voice', id, depth: 0, overrideAccess: true })
      .catch(() => null)

    if (!doc || !isReviewLinkValid(doc, token)) {
      return { success: false, error: 'Invalid or expired security token.' }
    }

    if (doc.respondedAt) {
      return { success: false, error: ALREADY_RESPONDED }
    }

    // Keep any internal notes an admin already typed: append the response instead of overwriting.
    const existingNotes = doc.resolutionNotes?.trim()
    const sentAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Qatar' })
    const resolutionNotes = existingNotes
      ? `${existingNotes}\n\n--- Response sent to requester (${sentAt}) ---\n${cleanNote}`
      : cleanNote

    // The one-time rule is enforced by a single atomic statement: it only matches while nothing has
    // been responded to yet, so simultaneous sends cannot both win. (payload.update with a `where`
    // is a find followed by an update by id, which is not atomic.)
    const claim = await runAtomicClaim(
      payload,
      sql`
      UPDATE "trip_scheduling_staff_voice"
      SET "resolution_notes" = ${resolutionNotes}, "responded_at" = now(), "updated_at" = now()
      WHERE "id" = ${id} AND "responded_at" IS NULL
      RETURNING "id"`,
    )

    if (claim.length === 0) {
      return { success: false, error: ALREADY_RESPONDED }
    }

    // The response is already recorded, so an email failure must not undo it or allow a resend.
    try {
      const { subject, html } = buildResponseEmail(doc, cleanNote)
      await queueStaffVoiceEmail(payload, { to: doc.email, subject, html })
      return { success: true, emailQueued: true }
    } catch (emailErr) {
      payload.logger.error(
        `[Staff Voice Response] Response saved for ${id} but the email could not be queued: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`,
      )
      return { success: true, emailQueued: false }
    }
  } catch (err: unknown) {
    payload.logger.error(
      `[Staff Voice Response Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      success: false,
      error: 'Something went wrong while sending your response. Please try again.',
    }
  }
}
