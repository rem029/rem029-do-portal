'use server'

import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import type { Form, SurveyInvitation, User } from '@/payload-types'
import { hasSurveyFormGrant } from '@/collections/survey-invitations/access'
import {
  buildInvitationEmailHtml,
  buildInvitationEmailSubject,
} from '@/collections/survey-invitations/utilities/invitation-email'

export interface ResendInvitationResult {
  success: boolean
  error?: string
  /** The row's status/sent_at after the attempt, so the edit view can update its form state. */
  status?: 'sent' | 'error'
  sentAt?: string
}

/** Normalises a Payload relationship value (id string or populated doc) to its id. */
const relationId = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'string' ? id : undefined
  }
  return undefined
}

/**
 * Re-sends the invitation email for an existing `survey-invitations` row right away (no job
 * queue), reusing the row's current code. Used by the list-view and edit-view Resend buttons.
 * The row becomes `sent` on success or `error` (with the SMTP message) on failure.
 *
 * Auth mirrors the other survey server actions: a server action has no admin session cookie, so
 * the user is re-derived from `userId` and the per-form `survey-send-invitation-<form.slug>`
 * update grant is re-checked live — never trust the client to have gated this.
 *
 * `responded` invitations are refused: the code is spent and a resent email would carry a dead
 * code.
 */
export async function resendSurveyInvitation(
  userId: string,
  invitationId: string,
): Promise<ResendInvitationResult> {
  const payload = await getPayload({ config })
  const { logger } = payload

  if (!userId || !invitationId) {
    return { success: false, error: 'Missing user or invitation' }
  }

  try {
    const user = (await payload
      // `depth: 1` so the `access` relationship (→ `users-access`) is populated for the grant check.
      .findByID({ collection: 'users', id: userId, depth: 1, overrideAccess: true })
      .catch(() => null)) as User | null

    if (!user) {
      logger.warn('[survey-invitations resend] Unauthenticated request rejected.')
      return { success: false, error: 'Unauthorized' }
    }

    const invitation = (await payload
      .findByID({
        collection: 'survey-invitations',
        id: invitationId,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)) as SurveyInvitation | null

    if (!invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    const formId = relationId(invitation.form)
    if (!formId) {
      return { success: false, error: 'Invitation has no form' }
    }

    const form = (await payload
      .findByID({ collection: 'forms', id: formId, depth: 0, overrideAccess: true })
      .catch(() => null)) as Form | null

    if (!form) {
      return { success: false, error: 'Form not found' }
    }

    if (!hasSurveyFormGrant(user, form.slug, 'update')) {
      logger.warn(
        `[survey-invitations resend] ${user.email} lacks survey-send-invitation-${form.slug}:update.`,
      )
      return { success: false, error: 'Forbidden' }
    }

    if (invitation.status === 'responded') {
      return {
        success: false,
        error: 'This code has already been used — resending is disabled.',
      }
    }

    // A local `req` carrying the acting user so the `survey-invitations` update below stamps
    // `updated_by` correctly (the beforeChange hook reads `req.user`).
    const req = await createLocalReq({ user: { ...user, collection: 'users' } }, payload)

    const to = invitation.email.trim().toLowerCase()

    try {
      await payload.sendEmail({
        to,
        subject: buildInvitationEmailSubject(form),
        html: buildInvitationEmailHtml({ form, code: invitation.code }),
      })
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError)
      logger.error(`[survey-invitations resend] Send to ${to} failed: ${message}`)
      await payload.update({
        collection: 'survey-invitations',
        id: invitation.id,
        data: { status: 'error', error_message: message },
        overrideAccess: true,
        req,
      })
      return { success: false, error: message, status: 'error' }
    }

    const sentAt = new Date().toISOString()
    await payload.update({
      collection: 'survey-invitations',
      id: invitation.id,
      data: { status: 'sent', sent_at: sentAt, error_message: null },
      overrideAccess: true,
      req,
    })

    logger.info(`[survey-invitations resend] ${user.email} re-sent invitation ${invitation.id} to ${to}.`)

    return { success: true, status: 'sent', sentAt }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resend failed'
    logger.error(`[survey-invitations resend] ${message}`)
    return { success: false, error: message }
  }
}
