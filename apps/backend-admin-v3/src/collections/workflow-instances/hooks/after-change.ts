import { CollectionAfterChangeHook, PayloadRequest } from 'payload'
import { Config, FormSubmission, WorkflowInstance, WorkflowV2 } from '@/payload-types'
import { resolveNotificationEmails } from '@/utilities/workflow-email'
import { generateEmailHtml } from '@/utilities/email-generator'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { RequestContext } from '@/context-types'
import { v4 as uuidv4 } from 'uuid'
import { WorkflowEventEntry, makeEvent } from '@/utilities/workflow-event-log'

const SUPPORTED_COLLECTIONS = ['form-submissions'] as const satisfies ReadonlyArray<
  keyof Config['collections']
>
type SupportedCollection = (typeof SUPPORTED_COLLECTIONS)[number]

function buildDocumentUrl(collection: SupportedCollection, documentId: string): string {
  const base = BACKEND_URL_WITH_BASE
  switch (collection) {
    case 'form-submissions':
      return `${base}/forms/submissions/${documentId}`
  }
}

function buildReviewUrl(
  collection: SupportedCollection,
  documentId: string,
  token: string,
): string {
  return `${buildDocumentUrl(collection, documentId)}?token=${token}`
}

type NotificationToken = { email: string; token: string }
type NotificationRecipient = NonNullable<WorkflowV2['approval_notifications']>[number]

/**
 * Resolves recipients, assigns each a unique view token (reusing existing ones),
 * sends the email with a per-recipient URL, and mutates `tokenStore` with any new entries.
 */
async function dispatchNotificationsWithViewTokens(args: {
  req: PayloadRequest
  recipients: NotificationRecipient[]
  sourceDoc: Record<string, unknown>
  subject: string
  htmlBody: string
  collection: SupportedCollection
  documentId: string
  tokenStore: NotificationToken[]
}): Promise<void> {
  const { req, recipients, sourceDoc, subject, htmlBody, collection, documentId, tokenStore } = args
  if (!recipients?.length) return

  const emails = await resolveNotificationEmails(req, recipients, sourceDoc)
  if (!emails.length) return

  const customText = recipients.find((r) => r.custom_email_text)?.custom_email_text
  const hideEmailActions = recipients.some((r) => (r as { hide_email_actions?: boolean | null }).hide_email_actions)

  for (const email of emails) {
    let entry = tokenStore.find((t) => t.email === email)
    if (!entry) {
      entry = { email, token: uuidv4() }
      tokenStore.push(entry)
    }

    const viewUrl = `${buildDocumentUrl(collection, documentId)}?token=${entry.token}`
    const viewLink = hideEmailActions ? '' : `<br/><br/><a href="${viewUrl}">View Submission</a>`
    const finalHtml = customText
      ? `<p>${customText}</p><hr/>${htmlBody}${viewLink}`
      : `${htmlBody}${viewLink}`

    try {
      await req.payload.sendEmail({ to: email, subject, html: finalHtml })
      req.payload.logger.info(`[workflowInstanceAfterChange] Sent "${subject}" to ${email}`)
    } catch (err) {
      req.payload.logger.error(
        `[workflowInstanceAfterChange] Failed to send "${subject}" to ${email}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}

/** Maps instance.status to the field+value to update on the source document. */
function buildStatusSyncData(
  collection: SupportedCollection,
  status: WorkflowInstance['status'],
): { workflow_status: FormSubmission['workflow_status'] } {
  switch (collection) {
    case 'form-submissions':
      return { workflow_status: status as FormSubmission['workflow_status'] }
  }
}

export const workflowInstanceAfterChange: CollectionAfterChangeHook<WorkflowInstance> = async ({
  doc: instance,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update' && operation !== 'create') return instance
  if ((req.context as RequestContext)?.workflowNotificationSync) return instance
  if ((req.context as RequestContext)?.appendingEventLog) return instance

  const p = req.payload
  const logger = p.logger

  if (!SUPPORTED_COLLECTIONS.includes(instance.document_collection as SupportedCollection)) {
    req.payload.logger.warn(
      `[workflowInstanceAfterChange] Unsupported collection "${instance.document_collection}" — skipping notifications`,
    )
    return instance
  }

  const collection = instance.document_collection as SupportedCollection
  // On create, previousDoc is null at runtime — default to empty object so comparisons work cleanly
  const prevInstance = previousDoc || ({} as WorkflowInstance)

  let blueprint: WorkflowV2
  try {
    const v2Id =
      typeof instance.workflow_v2 === 'object' ? instance.workflow_v2.id : instance.workflow_v2
    blueprint = await p.findByID({
      collection: 'workflow-v2',
      id: String(v2Id),
      depth: 1,
      overrideAccess: true,
      req,
    })
  } catch (err) {
    logger.error(`[workflowInstanceAfterChange] Failed to fetch blueprint: ${err}`)
    return instance
  }

  let sourceDoc: Record<string, unknown> = {}
  try {
    sourceDoc = (await p.findByID({
      collection,
      id: instance.document_id,
      depth: 1,
      overrideAccess: true,
      req,
    })) as unknown as Record<string, unknown>
  } catch (err) {
    logger.warn(`[workflowInstanceAfterChange] Could not fetch source document: ${err}`)
  }

  const formDoc = sourceDoc.form as { title?: string } | string | null | undefined
  const formTitle = (typeof formDoc === 'object' && formDoc?.title) ? formDoc.title : instance.title
  const subjectPrefix = `${formTitle} #${instance.document_id}`

  // Notification token store — mutated in place by dispatchNotificationsWithViewTokens
  const notificationTokens: NotificationToken[] =
    (
      instance as unknown as { notification_tokens?: NotificationToken[] | null }
    ).notification_tokens || []
  const originalTokenCount = notificationTokens.length

  // Event log entries collected during this hook run — persisted at the end
  const newEvents: WorkflowEventEntry[] = []
  const existingEvents = ((instance.event_logs ?? []) as unknown as WorkflowEventEntry[])

  const notifyArgs = {
    req,
    sourceDoc,
    collection,
    documentId: instance.document_id,
    tokenStore: notificationTokens,
  }

  // ── Terminal: completed ────────────────────────────────────────────────────
  if (instance.status === 'completed' && prevInstance.status !== 'completed') {
    if (blueprint.approval_notifications?.length) {
      await dispatchNotificationsWithViewTokens({
        ...notifyArgs,
        recipients: blueprint.approval_notifications,
        subject: `${subjectPrefix} - Approved`,
        htmlBody: `Your workflow has been fully approved/completed.`,
      })
    }
  }

  // ── Terminal: rejected ─────────────────────────────────────────────────────
  if (instance.status === 'rejected' && prevInstance.status !== 'rejected') {
    if (blueprint.rejection_notifications?.length) {
      await dispatchNotificationsWithViewTokens({
        ...notifyArgs,
        recipients: blueprint.rejection_notifications,
        subject: `${subjectPrefix} - Rejected`,
        htmlBody: `Your workflow has been terminally rejected.`,
      })
    }
  }

  // ── Step reached (includes initial step on create) ─────────────────────────
  const stepChanged = instance.current_step && instance.current_step !== prevInstance.current_step
  const isInitialStep = operation === 'create' && !!instance.current_step

  if (stepChanged || isInitialStep) {
    const currentStepConfig = blueprint.steps?.find((s) => s.slug === instance.current_step)

    // 1. on_reaching_notifications
    if (currentStepConfig?.on_reaching_notifications?.length) {
      await dispatchNotificationsWithViewTokens({
        ...notifyArgs,
        recipients: currentStepConfig.on_reaching_notifications,
        subject: `${subjectPrefix} - Reached this step`,
        htmlBody: `Reached step: <strong>${currentStepConfig.label}</strong>.`,
      })
    }

    // 2. Reviewer token emails — primary + all additional reviewers
    const currentReview = (instance.reviews || []).find(
      (r) => r.status_slug === instance.current_step && r.response === 'pending',
    )

    if (currentReview) {
      const stepLabel =
        currentReview.label || instance.current_step_label || instance.current_step || 'Review'

      type TokenEntry = { email: string; token: string }
      const reviewerRecipients: TokenEntry[] = (
        (currentReview.reviewer_tokens as
          | Array<{ email?: string | null; token?: string | null; response?: string | null }>
          | null
          | undefined) || []
      )
        .filter((entry) => entry.email && entry.token && entry.response === 'pending')
        .map((entry) => ({ email: entry.email as string, token: entry.token as string }))

      for (const { email, token } of reviewerRecipients) {
        const reviewUrl = buildReviewUrl(collection, instance.document_id, token)
        const emailHtml = generateEmailHtml({
          title: `${subjectPrefix} – ${stepLabel}`,
          message: `You have been assigned to review <strong>${instance.title}</strong> at step <strong>${stepLabel}</strong>.`,
          actionButtons: currentStepConfig?.hide_email_actions
            ? []
            : [{ label: 'Review Now', url: reviewUrl, color: '#059669' }],
        })
        try {
          await p.sendEmail({
            to: email,
            subject: `Action Required: ${subjectPrefix} – ${stepLabel}`,
            html: emailHtml,
          })
          newEvents.push(makeEvent(
            'notification_sent',
            'system',
            instance.current_step,
            stepLabel,
            { recipient: email },
          ))
          logger.info(
            `[workflowInstanceAfterChange] Sent reviewer token email to ${email} for step "${stepLabel}"`,
          )
        } catch (err) {
          logger.error(
            `[workflowInstanceAfterChange] Failed to send reviewer email to ${email}: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      }
    }
  }

  // ── Per-step approval/rejection notifications (update only) ───────────────
  if (operation === 'update') {
    const currentReviews = instance.reviews || []
    const prevReviews = prevInstance.reviews || []

    for (let i = 0; i < currentReviews.length; i++) {
      const currentRev = currentReviews[i]
      const prevRev = prevReviews[i]

      if (prevRev && currentRev.response !== prevRev.response && prevRev.response === 'pending') {
        const stepConfig = blueprint.steps?.find((s) => s.slug === currentRev.status_slug)
        if (!stepConfig) continue

        if (
          (currentRev.response === 'approved' || currentRev.response === 'acknowledged') &&
          stepConfig.on_approval_notifications?.length
        ) {
          await dispatchNotificationsWithViewTokens({
            ...notifyArgs,
            recipients: stepConfig.on_approval_notifications,
            subject: `${subjectPrefix} - Approved on this step`,
            htmlBody: `Step "<strong>${stepConfig.label}</strong>" approved by ${currentRev.reviewed_by || 'a reviewer'}.`,
          })
        } else if (
          currentRev.response === 'rejected' &&
          stepConfig.on_rejection_notifications?.length
        ) {
          await dispatchNotificationsWithViewTokens({
            ...notifyArgs,
            recipients: stepConfig.on_rejection_notifications,
            subject: `${subjectPrefix} - Rejected on this step`,
            htmlBody: `Step "<strong>${stepConfig.label}</strong>" rejected by ${currentRev.reviewed_by || 'a reviewer'}.`,
          })
        }
      }
    }
  }

  // ── Persist newly generated notification tokens + event log entries ──────
  const hasNewTokens = notificationTokens.length > originalTokenCount
  const hasNewEvents = newEvents.length > 0

  if (hasNewTokens || hasNewEvents) {
    try {
      const syncReq = {
        ...req,
        context: {
          ...(req.context as RequestContext),
          workflowNotificationSync: true,
          appendingEventLog: true,
        },
      }
      const updateData: Record<string, unknown> = {}
      if (hasNewTokens) updateData.notification_tokens = notificationTokens
      if (hasNewEvents) updateData.event_logs = [...existingEvents, ...newEvents]

      await p.update({
        collection: 'workflow-instances',
        id: instance.id,
        data: updateData as unknown as Partial<WorkflowInstance>,
        overrideAccess: true,
        req: syncReq,
      })
      if (hasNewTokens) {
        logger.info(
          `[workflowInstanceAfterChange] Saved ${notificationTokens.length - originalTokenCount} new notification token(s)`,
        )
      }
      if (hasNewEvents) {
        logger.info(
          `[workflowInstanceAfterChange] Saved ${newEvents.length} new event log entr${newEvents.length === 1 ? 'y' : 'ies'}`,
        )
      }
    } catch (err) {
      logger.warn(
        `[workflowInstanceAfterChange] Could not persist tokens/events: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  // ── Sync status back to source document ──────────────────────────────────
  // Keeps the source collection's own status field current so admin listings
  // and queries that filter by e.g. workflow_status remain accurate for V2 docs.
  const statusChanged = operation === 'create' || instance.status !== prevInstance.status
  if (statusChanged) {
    try {
      const syncReq = {
        ...req,
        context: { ...(req.context as RequestContext), workflowV2Sync: true },
      }
      await p.update({
        collection,
        id: instance.document_id,
        data: buildStatusSyncData(collection, instance.status),
        overrideAccess: true,
        req: syncReq,
      })
      logger.info(
        `[workflowInstanceAfterChange] Synced workflow_status="${instance.status}" → ${collection}:${instance.document_id}`,
      )
    } catch (err) {
      logger.warn(
        `[workflowInstanceAfterChange] Could not sync status to source document: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return instance
}
