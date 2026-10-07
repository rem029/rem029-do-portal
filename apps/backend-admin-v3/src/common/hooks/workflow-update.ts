import { User } from '@/payload-types'
import { APIError, CollectionBeforeChangeHook } from 'payload'
import { RequestContext } from '@/context-types'

/**
 * Evaluates a step's skip_condition against the accumulated custom_field_responses
 * from all completed prior steps. Returns true if the step should be auto-skipped.
 *
 * This function is also used by processWorkflowAction in the letter/form action files.
 */
export function evaluateSkipCondition(
  stepReview: any,
  allReviews: any[],
  stepIndex: number,
): boolean {
  const condition = stepReview?.skip_condition
  if (!condition?.enabled || !condition?.field_name) return false

  // Collect all custom_field_responses from previous steps
  const priorResponses: Record<string, string> = {}
  for (let i = 0; i < stepIndex; i++) {
    const responses: any[] = allReviews[i]?.custom_field_responses || []
    for (const r of responses) {
      if (r?.name) priorResponses[r.name] = String(r.value ?? '')
    }
  }

  const fieldValue = priorResponses[condition.field_name] ?? ''
  const compareValue = String(condition.value ?? '')

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue
    case 'not_equals':
      return fieldValue !== compareValue
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue)
    case 'less_than':
      return Number(fieldValue) < Number(compareValue)
    case 'is_empty':
      return fieldValue === ''
    case 'is_not_empty':
      return fieldValue !== ''
    default:
      return false
  }
}

export const workflowUpdate: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  collection,
}) => {
  if ((req.context as RequestContext)?.form?.useWorkflowV2) return data

  const p = req.payload
  const u = req.user as User
  const logger = p.logger

  // Resolve the current status (from update or existing doc)
  const currentStatus = data._workflow_status || originalDoc?._workflow_status
  logger.info(`workflowUpdate hook init ${data?.id}`)
  // Only proceed if workflow is active and not in a terminal state
  if (
    currentStatus &&
    currentStatus !== 'draft' &&
    currentStatus !== 'completed' &&
    currentStatus !== 'rejected'
  ) {
    // Resolve reviews array (from update or existing doc)
    const reviews =
      data.workflow_reviews ||
      (originalDoc?.workflow_reviews ? [...originalDoc.workflow_reviews] : [])

    if (!reviews || !Array.isArray(reviews)) return data

    // Find the active review step
    const currentIndex = reviews.findIndex((r) => r.status_slug === currentStatus)

    if (currentIndex === -1) return data

    const currentReview = reviews[currentIndex]
    let isReviewModified = false

    // Persist approver_type if missing (re-fetch from workflow if possible)
    if (!currentReview.approver_type) {
      try {
        let workflowSlug: string | null = null

        if (collection.slug === 'form-submissions') {
          const formId =
            typeof originalDoc?.form === 'object' ? originalDoc.form?.id : originalDoc?.form
          if (formId) {
            const form = await p.findByID({
              collection: 'forms',
              id: formId,
              depth: 0,
              req,
            })
            workflowSlug = (form as any)?.workflow_slug || null
          }
        } else {
          const settingsSlug = `${collection.slug}-settings`
          const settings = await p.findGlobal({
            slug: settingsSlug as any,
            overrideAccess: true,
            req,
          })
          workflowSlug = settings?.workflow_slug || null
        }

        if (workflowSlug) {
          const operatorId =
            data.operator ||
            (typeof originalDoc?.operator === 'object'
              ? originalDoc?.operator?.id
              : originalDoc?.operator)

          const workflows = await p.find({
            collection: 'workflow',
            where: {
              slug: { equals: workflowSlug },
              operator: {
                equals: operatorId,
              },
            },
            overrideAccess: true,
            limit: 1,
            req,
          })
          if (workflows.totalDocs > 0) {
            const workflow = workflows.docs[0]
            const step = workflow.steps?.find((s: any) => s.slug === currentReview.status_slug)
            if (step) {
              currentReview.approver_type = (step as any).approver_type
              currentReview.can_acknowledge = (step as any).can_acknowledge
              currentReview.can_approve = (step as any).can_approve
              currentReview.can_reject = (step as any).can_reject
              currentReview.enable_comment = (step as any).enable_comment
              currentReview.enable_signature = (step as any).enable_signature
              currentReview.attachment_label = (step as any).attachment_label
              currentReview.acknowledge_label = (step as any).acknowledge_label
              currentReview.approve_label = (step as any).approve_label
              currentReview.reject_label = (step as any).reject_label
              currentReview.auto_complete = (step as any).auto_complete
              currentReview.hide_history = (step as any).hide_history
              currentReview.hide_details = (step as any).hide_details
              currentReview.hide_description = (step as any).hide_description
              currentReview.custom_email_text = (step as any).custom_email_text
              currentReview.custom_fields_definition = [
                ...((workflow as any).global_custom_fields || [])
                  .filter((gf: any) =>
                    ((step as any).selected_global_fields || []).some(
                      (sgf: any) => sgf.field_name === gf.name,
                    ),
                  )
                  .map((gf: any) => ({ ...gf })),
                ...((step as any).custom_fields || []),
              ]
              isReviewModified = true
            }
          }
        }
      } catch (e) {
        logger.error(`[workflowUpdate] Failed to fetch approver_type: ${e}`)
      }
    }

    if (currentReview.response === 'approved' || currentReview.response === 'rejected') {
      if (!currentReview.comments) {
        throw new APIError('Comments are required.', 400)
      }
      if (currentReview.enable_signature && !currentReview.signature && !currentReview.auto_complete) {
        throw new APIError('Signature is required.', 400)
      }
    }

    // Check action based on response
    const advancingStatuses = ['approved', 'auto_completed', 'skipped', 'acknowledged']
    if (advancingStatuses.includes(currentReview.response)) {
      // 1. Mark Reviewed By/At if missing
      if (!currentReview.reviewed_at) {
        currentReview.reviewed_at = new Date().toISOString()
        isReviewModified = true
      }
      if (!currentReview.reviewed_by && u?.email) {
        currentReview.reviewed_by = u.email
        isReviewModified = true
      }

      // 2. Advance Workflow Status — auto-skip steps whose skip_condition matches
      let nextIndex = currentIndex + 1

      while (nextIndex < reviews.length) {
        const nextReview = reviews[nextIndex]
        if (evaluateSkipCondition(nextReview, reviews, nextIndex)) {
          // Mark this step as auto-skipped
          reviews[nextIndex] = {
            ...nextReview,
            response: 'skipped',
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'system',
          }
          isReviewModified = true
          logger.info(
            `[workflowUpdate] Auto-skipped step "${nextReview.label}" (index ${nextIndex}) due to skip_condition`,
          )
          nextIndex++
        } else {
          break
        }
      }

      if (nextIndex < reviews.length) {
        // Move to next non-skipped step
        data._workflow_status = reviews[nextIndex].status_slug
        data.workflow_status = 'in_review'
        logger.info(`[updateWorkflow] Advanced to: ${reviews[nextIndex].status_slug}`)
      } else {
        // No more steps, complete
        data._workflow_status = 'completed'
        data.workflow_status = 'completed'
        logger.info(`[updateWorkflow] Completed`)
      }
    } else if (currentReview.response === 'rejected') {
      // 1. Mark Reviewed By/At if missing
      if (!currentReview.reviewed_at) {
        currentReview.reviewed_at = new Date().toISOString()
        isReviewModified = true
      }
      if (!currentReview.reviewed_by && u?.email) {
        currentReview.reviewed_by = u.email
        isReviewModified = true
      }

      // 2. Reject Logic (Return to creator / End workflow)
      data._workflow_status = 'rejected'
      data.workflow_status = 'rejected'
      logger.info(`[updateWorkflow] Rejected`)
    }

    // Ensure modified reviews are saved back to data
    if (isReviewModified) {
      data.workflow_reviews = reviews
    }
  }

  logger.info(`workflowUpdate hook end ${data?.id}`)
  return data
}
