import { CollectionAfterChangeHook } from 'payload'
import { WorkflowV2, WorkflowInstance } from '@/payload-types'
import { RequestContext } from '@/context-types'
import { sendCurrentStepNotifications } from '@/utilities/workflow-notification'
import { resolveApproverEmail, ApproverDef, ReviewerToken } from '@/utilities/workflow-instance'
import { resolveFieldBlocks } from '@/utilities/workflow-field-blocks'
import { v4 as uuidv4 } from 'uuid'

/** Types that can be re-resolved here without a source document (blueprint-config only). */
const CONTEXT_FREE_APPROVER_TYPES = new Set(['email', 'department'])

/**
 * When a workflow-v2 blueprint is updated, sync the new step config into every
 * in_review instance that uses it.
 *
 * Rules:
 *  - Only `pending` reviews are updated — responded steps are left unchanged.
 *  - Capabilities/labels/response-field blocks are re-copied wholesale (they're
 *    step-level now, shared by every approver — no per-approver merge needed).
 *  - Reviewer tokens: if the step's `approvers[]` count is unchanged, existing
 *    tokens are kept in place and only `email`/`approver_type` are refreshed for
 *    context-free types (`email`, `department`); dynamic types (which need the
 *    source document or prior responses this hook doesn't have) keep their
 *    previously-resolved email. If the count changed (approvers added/removed),
 *    `reviewer_tokens` is rebuilt from scratch with fresh tokens — context-free
 *    types resolve immediately, dynamic types get a placeholder empty email
 *    (resolved at the next advancement, same as instance-creation behavior).
 *  - Steps removed from the blueprint are left as-is (don't break running instances).
 */
export const workflowV2AfterChange: CollectionAfterChangeHook<WorkflowV2> = async ({
  doc: blueprint,
  operation,
  req,
}) => {
  if (operation !== 'update') return blueprint

  const p = req.payload
  const logger = p.logger

  const instances = await p.find({
    collection: 'workflow-instances',
    where: {
      workflow_v2: { equals: blueprint.id },
      status: { equals: 'in_review' },
    },
    limit: 0,
    overrideAccess: true,
    req,
  })

  if (instances.totalDocs === 0) return blueprint

  logger.info(
    `[workflowV2AfterChange] Syncing ${instances.totalDocs} in_review instance(s) to updated blueprint "${blueprint.slug}"`,
  )

  const globalCustomFields = blueprint.global_custom_fields || []

  const stepMap = new Map<string, NonNullable<WorkflowV2['steps']>[number]>()
  for (const step of blueprint.steps || []) {
    stepMap.set(step.slug, step)
  }

  for (const instance of instances.docs) {
    const reviews = instance.reviews || []
    let modified = false

    const updatedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        if (review.response !== 'pending') return review

        const step = stepMap.get(review.status_slug)
        if (!step) return review

        const existingTokens: ReviewerToken[] = review.reviewer_tokens || []
        const approverDefs = step.approvers || []

        let reviewerTokens: ReviewerToken[]
        if (existingTokens.length === approverDefs.length && approverDefs.length > 0) {
          reviewerTokens = await Promise.all(
            approverDefs.map(async (approverDef, i) => {
              const existing = existingTokens[i]
              const resolutionFields = {
                approver_form_field_path: approverDef.approver_form_field_path ?? null,
                approver_workflow_field_name: approverDef.approver_workflow_field_name ?? null,
                approver_store_department_field_path:
                  approverDef.approver_store_department_field_path ?? null,
                approver_custom_field_name: approverDef.approver_custom_field_name ?? null,
                approver_custom_field_step_slug: approverDef.approver_custom_field_step_slug ?? null,
              }
              if (CONTEXT_FREE_APPROVER_TYPES.has(approverDef.approver_type || '')) {
                const email = await resolveApproverEmail(
                  approverDef as ApproverDef,
                  step.slug,
                  req,
                  {} as Record<string, unknown>,
                )
                return { ...existing, email, approver_type: approverDef.approver_type, ...resolutionFields }
              }
              return { ...existing, approver_type: approverDef.approver_type, ...resolutionFields }
            }),
          )
        } else {
          reviewerTokens = await Promise.all(
            approverDefs.map(async (approverDef): Promise<ReviewerToken> => {
              let email = ''
              if (CONTEXT_FREE_APPROVER_TYPES.has(approverDef.approver_type || '')) {
                email = await resolveApproverEmail(
                  approverDef as ApproverDef,
                  step.slug,
                  req,
                  {} as Record<string, unknown>,
                )
              }
              return {
                email,
                token: uuidv4(),
                approver_type: approverDef.approver_type,
                response: 'pending',
                reviewed_by: null,
                reviewed_at: null,
                approver_form_field_path: approverDef.approver_form_field_path ?? null,
                approver_workflow_field_name: approverDef.approver_workflow_field_name ?? null,
                approver_store_department_field_path:
                  approverDef.approver_store_department_field_path ?? null,
                approver_custom_field_name: approverDef.approver_custom_field_name ?? null,
                approver_custom_field_step_slug: approverDef.approver_custom_field_step_slug ?? null,
              }
            }),
          )
        }

        modified = true
        return {
          ...review,
          reviewer_tokens: reviewerTokens,
          label: step.label,
          can_acknowledge: step.can_acknowledge,
          can_approve: step.can_approve,
          can_reject: step.can_reject,
          can_skip: step.can_skip,
          can_generate_wordfile: step.can_generate_wordfile,
          auto_complete: step.auto_complete,
          acknowledge_label: step.acknowledge_label,
          approve_label: step.approve_label,
          reject_label: step.reject_label,
          skip_label: step.skip_label,
          hide_history: step.hide_history,
          hide_details: step.hide_details,
          hide_description: step.hide_description,
          hide_attachments: step.hide_attachments,
          hide_email_actions: step.hide_email_actions,
          custom_email_text: step.custom_email_text,
          rejection_policy: step.rejection_policy ?? 'end',
          rejection_target_step: step.rejection_target_step ?? null,
          skip_condition: step.skip_condition ?? null,
          // Cast arrays to resolve structural mismatch with FieldBlockConfig parameter
          before_response_fields: resolveFieldBlocks(
            step.before_response_fields as unknown as { blockType: string }[],
            globalCustomFields as unknown as { blockType: string }[]
          ),
          after_response_approved_fields: resolveFieldBlocks(
            step.after_response_approved_fields as unknown as { blockType: string }[],
            globalCustomFields as unknown as { blockType: string }[],
          ),
          after_response_rejected_fields: resolveFieldBlocks(
            step.after_response_rejected_fields as unknown as { blockType: string }[],
            globalCustomFields as unknown as { blockType: string }[],
          ),
          after_response_acknowledged_fields: resolveFieldBlocks(
            step.after_response_acknowledged_fields as unknown as { blockType: string }[],
            globalCustomFields as unknown as { blockType: string }[],
          ),
        }
      }),
    )

    if (!modified) continue

    try {
      const syncReq = {
        ...req,
        context: { ...(req.context as RequestContext), workflowBlueprintSync: true },
      }
      await p.update({
        collection: 'workflow-instances',
        id: instance.id as string,
        data: { reviews: updatedReviews },
        overrideAccess: true,
        req: syncReq,
      })
      logger.info(`[workflowV2AfterChange] Synced pending reviews on instance ${instance.id}`)

      try {
        const { sent, errors } = await sendCurrentStepNotifications({
          payload: p,
          req,
          instance: { ...instance, reviews: updatedReviews } as WorkflowInstance,
        })
        if (sent > 0) {
          logger.info(`[workflowV2AfterChange] Re-sent ${sent} notification(s) for instance ${instance.id}`)
        }
        for (const e of errors) {
          logger.error(`[workflowV2AfterChange] Notification error on instance ${instance.id}: ${e}`)
        }
      } catch (err) {
        logger.warn(
          `[workflowV2AfterChange] Could not send notifications for instance ${instance.id}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    } catch (err) {
      logger.error(
        `[workflowV2AfterChange] Failed to update instance ${instance.id}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return blueprint
}
