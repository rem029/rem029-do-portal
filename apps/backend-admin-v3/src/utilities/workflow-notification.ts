import type { Payload, PayloadRequest } from 'payload'
import type { WorkflowInstance } from '@/payload-types'
import { generateEmailHtml } from '@/utilities/email-generator'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { WorkflowEventEntry, makeEvent } from '@/utilities/workflow-event-log'

type TokenEntry = { email: string; token: string }

function buildReviewUrl(collection: string, documentId: string, token: string): string {
  const base = BACKEND_URL_WITH_BASE
  switch (collection) {
    case 'form-submissions':
    default:
      return `${base}/forms/submissions/${documentId}?token=${token}`
  }
}

/**
 * Re-sends reviewer token emails for the current pending step of a workflow instance.
 * Safe to call multiple times — does not modify the instance.
 */
export async function sendCurrentStepNotifications(args: {
  payload: Payload
  req: PayloadRequest
  instance: WorkflowInstance
}): Promise<{ sent: number; errors: string[] }> {
  const { payload, req, instance } = args

  const collection = instance.document_collection as string
  const documentId = instance.document_id as string

  const currentReview = (instance.reviews ?? []).find(
    (r) => r.status_slug === instance.current_step && r.response === 'pending',
  )

  if (!currentReview) return { sent: 0, errors: [] }

  const stepLabel =
    currentReview.label || instance.current_step_label || instance.current_step || 'Review'

  const recipients: TokenEntry[] = (
    (currentReview.reviewer_tokens as
      | Array<{ email?: string | null; token?: string | null; response?: string | null }>
      | null
      | undefined) ?? []
  )
    .filter((entry) => entry.email && entry.token && entry.response === 'pending')
    .map((entry) => ({ email: entry.email as string, token: entry.token as string }))

  let sent = 0
  const errors: string[] = []
  const sentEvents: WorkflowEventEntry[] = []

  for (const { email, token } of recipients) {
    const reviewUrl = buildReviewUrl(collection, documentId, token)
    const emailHtml = generateEmailHtml({
      title: `${instance.title} – ${stepLabel}`,
      message: `You have been assigned to review <strong>${instance.title}</strong> at step <strong>${stepLabel}</strong>.`,
      actionButtons: currentReview.hide_email_actions
        ? []
        : [{ label: 'Review Now', url: reviewUrl, color: '#059669' }],
    })

    try {
      await payload.sendEmail({
        to: email,
        subject: `Action Required: ${instance.title} – ${stepLabel}`,
        html: emailHtml,
      })
      sent++
      sentEvents.push(makeEvent(
        'notification_sent',
        'system',
        instance.current_step,
        stepLabel,
        { recipient: email },
      ))
      payload.logger.info(
        `[sendCurrentStepNotifications] Sent to ${email} for step "${stepLabel}"`,
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to send to ${email}: ${msg}`)
      payload.logger.error(`[sendCurrentStepNotifications] ${msg}`)
    }
  }

  // Append notification_sent events to the instance event log.
  // IMPORTANT: pass `req` so these run inside the caller's transaction — without it
  // they open a new transaction that deadlocks against the caller's row lock when
  // this is invoked from a hook that already updated the same instance (e.g.
  // workflowV2AfterChange blueprint sync).
  if (sentEvents.length > 0 && instance.id) {
    try {
      const current = await payload.findByID({
        collection: 'workflow-instances',
        id: instance.id as string,
        depth: 0,
        overrideAccess: true,
        req,
      })
      await payload.update({
        collection: 'workflow-instances',
        id: instance.id as string,
        data: {
          event_logs: [...(current.event_logs ?? []), ...sentEvents] as WorkflowInstance['event_logs'],
        } as Partial<WorkflowInstance>,
        overrideAccess: true,
        req: {
          ...req,
          context: { ...(req.context ?? {}), appendingEventLog: true, workflowNotificationSync: true },
        } as PayloadRequest,
      })
    } catch (err) {
      payload.logger.warn(`[sendCurrentStepNotifications] Could not persist event log: ${err}`)
    }
  }

  return { sent, errors }
}
