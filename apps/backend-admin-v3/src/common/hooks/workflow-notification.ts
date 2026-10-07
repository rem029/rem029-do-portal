import { User, Workflow } from '@/payload-types'
import { CollectionAfterChangeHook, PayloadRequest } from 'payload'
import { collectFormEmailFields, resolveSubmissionEmailFieldValues } from '@/utilities/form-email-fields'
import { RequestContext } from '@/context-types'

export interface EmailSettings {
  hideHistory?: boolean
  hideDetails?: boolean
  hideDescription?: boolean
  hideAttachments?: boolean
  hideEmailActions?: boolean
  customText?: string
}

export interface Recipient {
  email: string
  settings: EmailSettings
  token?: string
  canApprove?: boolean
  canReject?: boolean
  canAcknowledge?: boolean
  reason?: 'on_reaching' | 'on_approval' | 'on_rejection' | 'on_complete' | 'on_workflow_approval' | 'on_workflow_rejection'
}

export interface WorkflowNotificationArgs<T> {
  onInReview?: (
    req: PayloadRequest,
    reviewerEmail: string,
    createdByEmail: string,
    doc: T,
    docId: string | number,
    additionalRecipients?: Recipient[],
    response?: string,
    comments?: string,
    approver_type?: NonNullable<Workflow['steps']>[number]['approver_type'],
    emailSettings?: EmailSettings,
    attachments?: { filename: string; url: string }[],
    latestCustomFieldValues?: Array<{ name: string; label: string; value: string }>,
    previousStepSlug?: string,
  ) => Promise<void>
  onCompleted?: (
    req: PayloadRequest,
    createdByEmail: string,
    doc: T,
    docId: string | number,
    additionalRecipients?: Recipient[],
    response?: string,
    comments?: string,
    emailSettings?: EmailSettings,
    attachments?: { filename: string; url: string }[],
    latestCustomFieldValues?: Array<{ name: string; label: string; value: string }>,
    previousStepSlug?: string,
  ) => Promise<void>
  onRejected?: (
    req: PayloadRequest,
    createdByEmail: string,
    doc: T,
    docId: string | number,
    additionalRecipients?: Recipient[],
    response?: string,
    comments?: string,
    emailSettings?: EmailSettings,
    attachments?: { filename: string; url: string }[],
    latestCustomFieldValues?: Array<{ name: string; label: string; value: string }>,
    previousStepSlug?: string,
  ) => Promise<void>
  onAutoComplete?: (
    req: PayloadRequest,
    stepLabel: string,
    stepSlug: string,
    createdByEmail: string,
    doc: T,
    docId: string | number,
    additionalRecipients?: Recipient[],
    emailSettings?: EmailSettings,
    attachments?: { filename: string; url: string }[],
    latestCustomFieldValues?: Array<{ name: string; label: string; value: string }>,
  ) => Promise<void>
  getWorkflowSlug?: (req: PayloadRequest, doc: T) => Promise<string | undefined>
}

export const workflowNotification =
  <T = any>(args?: WorkflowNotificationArgs<T>): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req, data }) => {
    // Skip V1 notifications when called from a V2 status sync — V2 handles its own notifications
    if ((req.context as RequestContext)?.workflowV2Sync) return doc

    const p = req.payload
    const logger = p.logger
    const { onCompleted, onInReview, onRejected, onAutoComplete, getWorkflowSlug } = args || {}

    const currentStatus = doc.workflow_status
    const previousStatus = previousDoc?.workflow_status
    const currentStepSlug = doc._workflow_status
    const previousStepSlug = previousDoc?._workflow_status

    const docId = data?.id || doc?.id || ''
    logger.info(`workflowNotification hook start ${data?.id}`)
    // Ensure created_by is populated on the doc for callbacks that need full user info
    if (doc.created_by && typeof doc.created_by === 'string') {
      try {
        const creator = await p.findByID({
          collection: 'users',
          id: doc.created_by,
          depth: 0,
          req,
        })
        if (creator) {
          ;(doc as any).created_by = creator
        }
      } catch (e) {
        // ignore
      }
    }

    let createdByEmail = 'NA'
    if (doc.created_by) {
      if (typeof doc.created_by === 'object' && (doc.created_by as User).email) {
        createdByEmail = (doc.created_by as User).email
      }
    }

    // Resolve Workflow Configuration
    let workflowDoc: Workflow | undefined = undefined
    const operatorId = typeof doc.operator === 'object' ? doc.operator?.id : doc.operator

    try {
      let workflowSlug: string | undefined = undefined

      if (getWorkflowSlug) {
        workflowSlug = await getWorkflowSlug(req, doc as T)
      }

      if (workflowSlug && operatorId) {
        const workflowResult = await p.find({
          collection: 'workflow',
          where: {
            and: [{ slug: { equals: workflowSlug } }, { operator: { equals: operatorId } }],
          },
          limit: 1,
          req,
          overrideAccess: true,
        })

        if (workflowResult.docs.length > 0) {
          workflowDoc = workflowResult.docs[0]
        }
      }
    } catch (error) {
      logger.error(`Error resolving workflow configuration: ${error}`)
    }

    const notifyOnComplete = workflowDoc?.notify_on_complete ?? true
    const notifyOnUpdate = workflowDoc?.notify_on_update ?? true
    const notifyOnReject = workflowDoc?.notify_on_reject ?? true

    if (workflowDoc) {
      logger.info(`[workflow-notification] workflow found ${workflowDoc?.operator_slug || 'NA'}`)
      logger.info(`[workflow-notification] workflow notify_on_complete ${notifyOnComplete}`)
      logger.info(`[workflow-notification] workflow notify_on_reject ${notifyOnReject}`)
      logger.info(`[workflow-notification] workflow notify_on_update ${notifyOnUpdate}`)
    }

    const resolveAdditionalRecipients = async (entries?: any[], reason?: Recipient['reason']): Promise<Recipient[]> => {
      if (!entries || entries.length === 0) return []
      const resolvedRecipients: Recipient[] = []
      const formCache: Record<string, any> = {}

      for (const entry of entries) {
        const { type, email, department } = entry as any
        const rSettings: EmailSettings = {
          hideHistory: !!(entry as any).hide_history,
          hideDetails: !!(entry as any).hide_details,
          hideDescription: !!(entry as any).hide_description,
          hideAttachments: !!(entry as any).hide_attachments,
          hideEmailActions: !!(entry as any).hide_email_actions,
          customText: (entry as any).custom_email_text || '',
        }

        logger.info(
          `[workflow-notification] Resolved settings for ${email || type}: ${JSON.stringify(rSettings)}`,
        )

        switch (type) {
          case 'email':
            if (email) resolvedRecipients.push({ email, settings: rSettings, reason })
            break
          case 'form_email':
            if ((doc as any)?.form && Array.isArray((doc as any)?.submissionData)) {
              const configuredFieldPath = (entry as any).form_field_path
              const configuredFormId = (entry as any).form_field_form_id

              if (!configuredFieldPath) break

              const formId = typeof (doc as any).form === 'object' ? (doc as any).form.id : (doc as any).form
              if (!formId) break

              // Only resolve recipients for the form this recipient was configured for
              if (configuredFormId && String(configuredFormId) !== String(formId)) break

              try {
                if (!formCache[formId]) {
                  formCache[formId] = await p.findByID({
                    collection: 'forms',
                    id: formId,
                    depth: 0,
                    overrideAccess: true,
                    req,
                  })
                }
                const form = formCache[formId]

                const selectableFields = collectFormEmailFields(((form as any)?.fields as any[]) || [])
                const matchedField = selectableFields.find((field) => field.path === configuredFieldPath)

                if (!matchedField) break

                const emails = resolveSubmissionEmailFieldValues(
                  ((doc as any).submissionData as Array<{ field?: string; value?: string }>) || [],
                  matchedField.path,
                )

                emails.forEach((resolvedEmail) => {
                  resolvedRecipients.push({ email: resolvedEmail, settings: rSettings, reason })
                })
              } catch (loadError) {
                logger.error(
                  `[workflow-notification] Failed resolving form email recipient ${configuredFieldPath}: ${loadError instanceof Error ? loadError.message : String(loadError)}`
                )
              }
            }
            break
          case 'department':
            if (department) {
              const deptId = typeof department === 'object' ? department.id : department
              const dept = await p.findByID({
                collection: 'departments',
                id: deptId,
                depth: 0,
              })
              if (dept?.manager_email)
                resolvedRecipients.push({ email: dept.manager_email, settings: rSettings })
            }
            break
          case 'requestor_department':
            const creator = doc.created_by as User | undefined
            if (creator?.department) {
              const deptId =
                typeof creator.department === 'object' ? creator.department.id : creator.department
              const dept = await p.findByID({
                collection: 'departments',
                id: deptId,
                depth: 0,
              })
              if (dept?.manager_email)
                resolvedRecipients.push({ email: dept.manager_email, settings: rSettings })
            }
            break
          case 'created_by':
            if (createdByEmail && createdByEmail !== 'NA') {
              resolvedRecipients.push({ email: createdByEmail, settings: rSettings })
            }
            break
          case 'employee':
            const employee = (doc as any).employee
            if (employee) {
              if (typeof employee === 'object' && employee.email) {
                resolvedRecipients.push({ email: employee.email, settings: rSettings })
              } else {
                const user = await p.findByID({
                  collection: 'users',
                  id: employee,
                  depth: 0,
                })
                if (user?.email) resolvedRecipients.push({ email: user.email, settings: rSettings })
              }
            }
            break
          default:
            if (typeof entry === 'string') {
              resolvedRecipients.push({ email: entry, settings: rSettings })
            } else if ((entry as any).email) {
              resolvedRecipients.push({ email: (entry as any).email, settings: rSettings })
            }
        }
      }

      const map = new Map<string, Recipient>()
      resolvedRecipients.forEach((r) => map.set(r.email, r))
      return Array.from(map.values())
    }

    const resolveStepDetails = async (slug: string, workflowDoc?: Workflow) => {
      let onReaching: Recipient[] = []
      let onApproval: Recipient[] = []
      let onRejection: Recipient[] = []
      let approverType: NonNullable<Workflow['steps']>[number]['approver_type'] | undefined =
        undefined
      let settings = {
        hideHistory: false,
        hideDetails: false,
        hideDescription: false,
        hideAttachments: false,
        hideEmailActions: false,
        customText: '',
      }

      if (workflowDoc) {
        const step = workflowDoc.steps?.find((s: any) => s.slug === slug)
        if (step) {
          onReaching = await resolveAdditionalRecipients((step as any).on_reaching_notifications, 'on_reaching')
          onApproval = await resolveAdditionalRecipients((step as any).on_approval_notifications, 'on_approval')
          onRejection = await resolveAdditionalRecipients((step as any).on_rejection_notifications, 'on_rejection')

          approverType = (step as any)?.approver_type
          settings = {
            hideHistory: (step as any)?.hide_history || false,
            hideDetails: (step as any)?.hide_details || false,
            hideDescription: (step as any)?.hide_description || false,
            hideAttachments: (step as any)?.hide_attachments || false,
            hideEmailActions: (step as any)?.hide_email_actions || false,
            customText: (step as any)?.custom_email_text || '',
          }
        }
      }
      return {
        onReaching,
        onApproval,
        onRejection,
        settings,
        approverType,
      }
    }

    const resolveTerminalRecipients = async (
      status: 'completed' | 'rejected',
      workflowDoc?: Workflow,
    ): Promise<Recipient[]> => {
      if (!workflowDoc) return []
      const configKey = status === 'completed' ? 'approval_notifications' : 'rejection_notifications'
      const configuredRecipients = (workflowDoc as any)?.[configKey] as any[] | undefined
      return resolveAdditionalRecipients(configuredRecipients, status === 'completed' ? 'on_workflow_approval' : 'on_workflow_rejection')
    }

    const mergeRecipients = (...groups: Array<Recipient[] | undefined>): Recipient[] => {
      const map = new Map<string, Recipient>()
      for (const group of groups) {
        for (const recipient of group || []) {
          if (!recipient?.email) continue
          map.set(recipient.email, recipient)
        }
      }
      return Array.from(map.values())
    }

    // Resolve Step Details for BOTH current and previous steps to handle transitions
    const currentStepDetails = currentStepSlug
      ? await resolveStepDetails(currentStepSlug, workflowDoc)
      : null
    const previousStepDetails = previousStepSlug
      ? await resolveStepDetails(previousStepSlug, workflowDoc)
      : null

    const approvalRecipients = await resolveTerminalRecipients('completed', workflowDoc)
    const rejectionRecipients = await resolveTerminalRecipients('rejected', workflowDoc)

    // Aggregate all attachments (shared across all notifications)
    const allAttachments: { filename: string; url: string }[] = []
    const serverURL = req.payload.config.serverURL

    const resolveAttachment = async (att: any) => {
      if (typeof att === 'object' && att !== null && att.url) {
        return {
          filename: att.filename,
          url: att.url.startsWith('http') ? att.url : `${serverURL}${att.url}`,
        }
      }
      if (typeof att === 'string' || typeof att === 'number') {
        logger.info(`[workflow-notification].resolving found only ID: ${att}}`)
        try {
          const media = await req.payload.findByID({
            collection: 'internal-media',
            id: att,
            depth: 0,
            req,
            overrideAccess: true,
          })
          if (media && media.url) {
            logger.info(`[workflow-notification].resolving found media URL: ${media.url}}`)
            return {
              filename: media.filename,
              url: media.url.startsWith('http') ? media.url : `${serverURL}${media.url}`,
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return null
    }

    // 1. Primary document attachments
    if (doc.attachments) {
      const docAttachments = Array.isArray(doc.attachments) ? doc.attachments : [doc.attachments]
      for (const att of docAttachments) {
        logger.info(
          `[workflow-notification].resolving primary docAttachments: ${JSON.stringify(att, null, 4)}`,
        )
        const resolved = await resolveAttachment(att)
        if (resolved) allAttachments.push(resolved)
      }
    }

    // 2. Review step attachments
    if (doc.workflow_reviews && Array.isArray(doc.workflow_reviews)) {
      for (const review of doc.workflow_reviews) {
        if (review.attachments && Array.isArray(review.attachments)) {
          for (const att of review.attachments) {
            logger.info(
              `[workflow-notification].resolving step docAttachments: ${JSON.stringify(att, null, 4)}`,
            )
            const resolved = await resolveAttachment(att)
            if (resolved) allAttachments.push(resolved)
          }
        }
      }
    }

    // Aggregate latest custom field values from all completed review steps
    const latestCustomFieldMap: Record<string, { label: string; value: string }> = {}
    if (doc.workflow_reviews && Array.isArray(doc.workflow_reviews)) {
      for (const review of doc.workflow_reviews as any[]) {
        const cfr: any[] = review?.custom_field_responses || []
        for (const r of cfr) {
          if (r?.name && r.value !== '' && r.value != null) {
            latestCustomFieldMap[r.name] = { label: r.label ?? r.name, value: String(r.value) }
          }
        }
      }
    }
    const latestCustomFieldValues = Object.entries(latestCustomFieldMap).map(
      ([name, { label, value }]) => ({ name, label, value }),
    )

    // 0. Notify Auto-completed steps
    if (onAutoComplete && doc.workflow_reviews) {
      for (const review of doc.workflow_reviews as any[]) {
        const prevReview = previousDoc?.workflow_reviews?.find(
          (r: any) => r.status_slug === review.status_slug,
        )
        const wasCompletedNow =
          review.response === 'auto_completed' && (!prevReview || prevReview.response === 'pending')

        if (wasCompletedNow && notifyOnUpdate) {
          logger.info(`[workflowNotification] Notifying auto-complete for step: ${review.label}`)
          // Resolve recipients SPECIFIC to this auto-completed step
          const { onApproval: stepRecipients, settings: stepSettings } = await resolveStepDetails(
            review.status_slug,
            workflowDoc,
          )
          try {
            await onAutoComplete(
              req,
              review.label,
              review.status_slug,
              createdByEmail,
              doc as T,
              docId,
              stepRecipients,
              stepSettings,
              allAttachments,
              latestCustomFieldValues,
            )
          } catch (error) {
            logger.error(`Error sending auto-complete notification: ${error}`)
          }
        }
      }
    }

    // 1. Notify Reviewer if in_review and step changed
    if (currentStatus === 'in_review' && notifyOnUpdate) {
      logger.info('[workflowNotification] Notifying current reviewer')
      // If step changed OR simplified condition we moved freshly into in_review
      // OR if manually triggered via context
      const isManualTrigger =
        req.context?.triggerNotification === true &&
        req.context?.triggerStepSlug === currentStepSlug

      if (
        currentStepSlug &&
        (currentStepSlug !== previousStepSlug ||
          currentStatus !== previousStatus ||
          isManualTrigger)
      ) {
        // Find the reviewer for this step
        const currentReviewer = doc.workflow_reviews?.find(
          (r: any) => r.status_slug === currentStepSlug,
        )
        const reviewerEmail = currentReviewer?.reviewer

        if (reviewerEmail) {
          try {
            if (onInReview) {
              logger.info('[workflowNotification] Calling onInReview callback')

              // Get response and comments from the previous step if available
              const previousReviewer = doc.workflow_reviews?.find(
                (r: any) => r.status_slug === previousStepSlug,
              )

              const isPrevApproved =
                previousReviewer?.response === 'approved' ||
                previousReviewer?.response === 'acknowledged'

              await onInReview(
                req,
                reviewerEmail,
                createdByEmail,
                doc as T,
                docId,
                mergeRecipients(
                  currentStepDetails?.onReaching,
                  isPrevApproved ? previousStepDetails?.onApproval : [],
                ),
                previousReviewer?.response,
                previousReviewer?.comments,
                currentStepDetails?.approverType,
                currentStepDetails?.settings,
                allAttachments,
                latestCustomFieldValues,
                previousStepSlug,
              )
            }
          } catch (error) {
            logger.error(`Error sending email notification to reviewer: ${error}`)
          }
        }
      }
    }

    // 2. Notify Requestor if completed or rejected
    if (currentStatus === 'completed' || currentStatus === 'rejected') {
      logger.info('[workflowNotification] Notifying requestor')

      if (createdByEmail) {
        try {
          const isApproved = currentStatus === 'completed'

          // Get response and comments from the final step
          const finalReviewer = doc.workflow_reviews?.find(
            (r: any) => r.status_slug === previousStepSlug,
          )
          if (onCompleted && isApproved && notifyOnComplete) {
            logger.info(
              `[workflowNotification] Calling onCompleted callback, is aproved? ${isApproved}, notifyOnComplete? ${notifyOnComplete}`,
            )
            await onCompleted(
              req,
              createdByEmail,
              doc as T,
              docId,
              mergeRecipients(previousStepDetails?.onApproval, approvalRecipients),
              finalReviewer?.response,
              finalReviewer?.comments,
              previousStepDetails?.settings,
              allAttachments,
              latestCustomFieldValues,
              previousStepSlug,
            )
          } else {
            logger.warn(
              `[workflowNotification] Skipping onComplete CallBack check ${workflowDoc?.operator_slug}`,
            )
          }

          if (onRejected && !isApproved && notifyOnReject) {
            logger.info(
              `[workflowNotification] Calling onRejected callback, notifyOnReject? ${notifyOnReject}`,
            )
            await onRejected(
              req,
              createdByEmail,
              doc as T,
              docId,
              mergeRecipients(previousStepDetails?.onRejection, rejectionRecipients),
              finalReviewer?.response,
              finalReviewer?.comments,
              previousStepDetails?.settings,
              allAttachments,
              latestCustomFieldValues,
              previousStepSlug,
            )
          } else {
            logger.warn(
              `[workflowNotification] Skipping onRejected CallBack check ${workflowDoc?.operator_slug}`,
            )
          }
        } catch (error) {
          logger.error(`Error sending email notification to requestor: ${error}`)
        }
      }
    }

    logger.info(`workflowNotification hook end ${data?.id}`)
    return doc
  }
