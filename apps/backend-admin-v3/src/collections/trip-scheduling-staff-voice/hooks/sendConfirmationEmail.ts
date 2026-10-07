import type { CollectionAfterChangeHook } from 'payload'
import { buildConfirmationEmail, queueStaffVoiceEmail } from '../emails'

// Receipt for the submitter. Contains no review link or token.
export const sendConfirmationEmail: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || !req) return

  const p = req.payload
  const to = typeof doc?.email === 'string' ? doc.email.trim() : ''

  if (!to) {
    p.logger.warn(`[Staff Voice Hook] Skipped confirmation email: no email on doc ${doc?.id}.`)
    return
  }

  try {
    const { subject, html } = buildConfirmationEmail(doc)
    await queueStaffVoiceEmail(p, { to, subject, html })
  } catch (err) {
    p.logger.error(
      `[Staff Voice Hook] Failed to queue confirmation email for ${to}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
