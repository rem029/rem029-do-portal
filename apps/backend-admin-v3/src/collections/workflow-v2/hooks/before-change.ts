import { User, WorkflowInstance } from '@/payload-types'
import { APIError, CollectionBeforeChangeHook, Config, PayloadRequest } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import { RequestContext } from '@/context-types'
import { WorkflowEventEntry, makeEvent } from '@/utilities/workflow-event-log'
import { ReviewerToken } from '@/utilities/workflow-instance'
import { resolveFieldBlocks } from '@/utilities/workflow-field-blocks'

type ReviewEntry = NonNullable<NonNullable<WorkflowInstance['reviews']>[number]>
type FieldResponse = { name: string; label?: string; value: unknown; blockType?: string }
type FieldBlockConfig = { blockType: string; name?: string; required?: boolean; options?: unknown[] }

// ─────────────────────────────────────────────────────────────────────────────
// Helper: read a nested value from an object using dot-notation
// ─────────────────────────────────────────────────────────────────────────────

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

// ─────────────────────────────────────────────────────────────────────────────
// Skip Condition Evaluator (V2)
//
// Extends V1 by supporting two condition sources:
//   - 'workflow_field'  → reads from accumulated field_responses of prior steps
//   - 'document_field'  → reads from the source document payload (fetched by the hook)
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateSkipConditionV2(
  stepReview: any,
  allReviews: any[],
  stepIndex: number,
  sourceDoc?: Record<string, any>,
): boolean {
  const condition = stepReview?.skip_condition
  if (!condition?.enabled || !condition?.field_name) return false

  let fieldValue = ''

  if (condition.source === 'document_field') {
    // Read directly from the linked source document
    if (!sourceDoc) return false
    const raw = getValueByPath(sourceDoc, condition.field_name)
    fieldValue = raw != null ? String(raw) : ''
  } else {
    // Default: 'workflow_field' — read from prior steps' field_responses
    const priorResponses: Record<string, string> = {}
    for (let i = 0; i < stepIndex; i++) {
      const responses: FieldResponse[] = allReviews[i]?.field_responses || []
      for (const r of responses) {
        if (r?.name) priorResponses[r.name] = String(r.value ?? '')
      }
    }
    fieldValue = priorResponses[condition.field_name] ?? ''
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// Re-resolve a single dynamic reviewer-token entry at step-advancement time.
// Context-free types (email, department, requestor_department, created_by,
// employee, document_department_field) were already resolved at
// instance-creation time and don't change here. The remaining types are
// re-resolved when still unresolved (empty email): workflow_field_email,
// form_field_email, workflow_custom_field_department, and store_department_field
// — the last of these resolves against the source document at init time when
// possible, but falls back here to a prior step's field_responses when the
// field is a workflow response field rather than a document field.
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveDynamicReviewerTokenEntry(
  token: ReviewerToken,
  currentIndex: number,
  reviews: ReviewEntry[],
  sourceDoc: Record<string, unknown> | undefined,
  data: Partial<WorkflowInstance>,
  req: PayloadRequest,
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void },
): Promise<ReviewerToken> {
  if (token.approver_type === 'workflow_field_email' && token.approver_workflow_field_name) {
    const allResponses: Record<string, string> = {}
    for (let i = 0; i <= currentIndex; i++) {
      const responses = ((reviews[i] as any).field_responses as FieldResponse[]) || []
      for (const r of responses) {
        if (r?.name) allResponses[r.name] = String(r.value ?? '')
      }
    }
    const resolvedEmail = allResponses[token.approver_workflow_field_name] || ''
    if (resolvedEmail) {
      logger.info(
        `[workflowInstanceUpdate] workflow_field_email resolved: "${resolvedEmail}" (field "${token.approver_workflow_field_name}")`,
      )
      return { ...token, email: resolvedEmail, token: uuidv4() }
    }
    logger.warn(
      `[workflowInstanceUpdate] workflow_field_email: field "${token.approver_workflow_field_name}" not found in prior responses — email left as-is`,
    )
    return token
  }

  if (token.approver_type === 'form_field_email' && token.approver_form_field_path && sourceDoc) {
    let resolvedEmail = getValueByPath(sourceDoc, token.approver_form_field_path) as
      | string
      | undefined
    if (!resolvedEmail) {
      const submissionData = sourceDoc.submissionData as
        | Array<{ field: string; value: unknown }>
        | undefined
      const match = submissionData?.find((item) => item.field === token.approver_form_field_path)
      resolvedEmail = match?.value != null ? String(match.value) : undefined
    }
    if (resolvedEmail) {
      logger.info(`[workflowInstanceUpdate] form_field_email re-resolved: "${resolvedEmail}"`)
      return { ...token, email: resolvedEmail, token: uuidv4() }
    }
    return token
  }

  if (
    token.approver_type === 'store_department_field' &&
    token.approver_store_department_field_path &&
    !token.email
  ) {
    const fieldName = token.approver_store_department_field_path

    let selectedValue: unknown
    for (let i = currentIndex; i >= 0; i--) {
      const responses = ((reviews[i] as any).field_responses as FieldResponse[]) || []
      const match = responses.find((resp) => resp.name === fieldName)
      if (match?.value != null) {
        selectedValue = match.value
        break
      }
    }

    if (selectedValue == null) {
      logger.warn(
        `[workflowInstanceUpdate] store_department_field: no response found for field "${fieldName}" in prior steps`,
      )
      return token
    }

    const rawId = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue
    const deptId =
      rawId != null && typeof rawId === 'object' ? (rawId as Record<string, unknown>).id : rawId

    if (!deptId) {
      logger.warn(
        `[workflowInstanceUpdate] store_department_field: field "${fieldName}" value is not a valid store-department relationship`,
      )
      return token
    }

    try {
      const dept = await req.payload.findByID({
        collection: 'store-departments',
        id: String(deptId),
        depth: 1,
        overrideAccess: true,
        req,
      })
      const mgr = (dept as any)?.manager
      const resolvedEmail =
        mgr != null && typeof mgr === 'object' ? ((mgr as { email?: string }).email ?? null) : null

      if (resolvedEmail) {
        logger.info(
          `[workflowInstanceUpdate] store_department_field resolved: "${resolvedEmail}" (field "${fieldName}")`,
        )
        return { ...token, email: resolvedEmail, token: uuidv4() }
      }
      logger.warn(
        `[workflowInstanceUpdate] store_department_field: department resolved from field "${fieldName}" has no manager or the manager has no email`,
      )
      return token
    } catch (err) {
      logger.error(`[workflowInstanceUpdate] store_department_field resolution failed: ${err}`)
      return token
    }
  }

  if (token.approver_type === 'workflow_custom_field_department' && token.approver_custom_field_name) {
    const fieldName = token.approver_custom_field_name
    const stepSlugFilter = token.approver_custom_field_step_slug

    let selectedValue: string | undefined
    for (let i = currentIndex; i >= 0; i--) {
      const r = reviews[i] as any
      if (stepSlugFilter && r.status_slug !== stepSlugFilter) continue
      const responses = (r.field_responses as FieldResponse[]) || []
      const match = responses.find((resp) => resp.name === fieldName)
      if (match?.value != null) {
        selectedValue = String(match.value)
        break
      }
    }

    if (!selectedValue) {
      logger.warn(
        `[workflowInstanceUpdate] workflow_custom_field_department: no response found for field "${fieldName}" in prior steps`,
      )
      return token
    }

    try {
      // Fetch the blueprint fresh and resolve blocks (expanding any global_field_ref)
      // to find the matched option's routing config.
      const blueprintId =
        typeof data.workflow_v2 === 'object' ? (data.workflow_v2 as any).id : data.workflow_v2
      const blueprint = await req.payload.findByID({
        collection: 'workflow-v2',
        id: String(blueprintId),
        depth: 1,
        overrideAccess: true,
        req,
      })

      const globalFields = ((blueprint as any).global_custom_fields || []) as FieldBlockConfig[]

      let matchedOpt: any
      for (const step of (blueprint as any).steps || []) {
        const resolvedBefore = resolveFieldBlocks(
          step.before_response_fields as FieldBlockConfig[],
          globalFields,
        )
        for (const block of resolvedBefore) {
          if (block.name === fieldName && block.blockType === 'select') {
            matchedOpt = (block.options as any[])?.find((o: any) => o.value === selectedValue)
            if (matchedOpt) break
          }
        }
        if (matchedOpt) break
      }

      const relatedType: string | undefined = matchedOpt?.related_type
      let resolvedEmail: string | null = null

      if (relatedType === 'store_department' || (!relatedType && matchedOpt?.related_department)) {
        const rawId = matchedOpt?.related_department
        const deptId = rawId != null && typeof rawId === 'object' ? rawId.id : rawId
        if (deptId) {
          const dept = await req.payload.findByID({
            collection: 'store-departments',
            id: String(deptId),
            depth: 1,
            overrideAccess: true,
            req,
          })
          const mgr = (dept as any)?.manager
          resolvedEmail =
            mgr != null && typeof mgr === 'object' ? ((mgr as { email?: string }).email ?? null) : null
        }
      } else if (relatedType === 'crm_category') {
        const rawId = matchedOpt?.related_crm_category
        const catId = rawId != null && typeof rawId === 'object' ? rawId.id : rawId
        if (catId) {
          const category = await req.payload.findByID({
            collection: 'crm-categories',
            id: String(catId),
            depth: 1,
            overrideAccess: true,
            req,
          })
          const dept = (category as any)?.managed_by_department
          resolvedEmail =
            dept != null && typeof dept === 'object' ? ((dept as { manager_email?: string }).manager_email ?? null) : null
        }
      } else if (relatedType === 'department') {
        const rawId = matchedOpt?.related_dept
        const deptId = rawId != null && typeof rawId === 'object' ? rawId.id : rawId
        if (deptId) {
          const dept = await req.payload.findByID({
            collection: 'departments',
            id: String(deptId),
            depth: 0,
            overrideAccess: true,
            req,
          })
          resolvedEmail = (dept as any)?.manager_email ?? null
        }
      } else if (relatedType === 'user') {
        const rawId = matchedOpt?.related_user
        const userId = rawId != null && typeof rawId === 'object' ? rawId.id : rawId
        if (userId) {
          const user = await req.payload.findByID({
            collection: 'users',
            id: String(userId),
            depth: 0,
            overrideAccess: true,
            req,
          })
          resolvedEmail = (user as any)?.email ?? null
        }
      } else if (relatedType === 'email') {
        resolvedEmail = matchedOpt?.related_email ?? null
      }

      if (resolvedEmail) {
        logger.info(
          `[workflowInstanceUpdate] workflow_custom_field_department resolved (${relatedType ?? 'store_department'}): "${resolvedEmail}"`,
        )
        return { ...token, email: resolvedEmail, token: uuidv4() }
      }
      logger.warn(
        `[workflowInstanceUpdate] workflow_custom_field_department: could not resolve email for option "${selectedValue}" (type: ${relatedType ?? 'none'}) in field "${fieldName}"`,
      )
      return token
    } catch (err) {
      logger.error(`[workflowInstanceUpdate] workflow_custom_field_department resolution failed: ${err}`)
      return token
    }
  }

  return token
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Instance Update Hook (V2)
//
// This is the beforeChange hook for the `workflow-instances` collection.
// It handles:
//   1. Required-field validation (generic, driven by before/after_response_*_fields
//      block config against the flat field_responses array)
//   2. Step advancement with V2 skip condition evaluation (payload-aware)
//   3. Multi-approver dynamic reviewer re-resolution for the next step
//   4. Loop-back rejection routing (rejection_policy: 'previous' | 'specific_step')
//   5. Iteration tracking for revisited steps (loops)
// ─────────────────────────────────────────────────────────────────────────────

export const workflowInstanceUpdate: CollectionBeforeChangeHook<WorkflowInstance> = async ({
  data,
  req,
  originalDoc,
}) => {
  const p = req.payload
  const u = req.user as User
  const logger = p.logger

  // Blueprint sync or event-log append — skip all step-advancement logic
  if ((req.context as RequestContext)?.workflowBlueprintSync) return data
  if ((req.context as RequestContext)?.appendingEventLog) return data

  const currentStepSlug = data.current_step || originalDoc?.current_step
  const currentStatus = data.status || originalDoc?.status

  logger.info(
    `[workflowInstanceUpdate] Processing instance ${originalDoc?.id}, step: ${currentStepSlug}, status: ${currentStatus}`,
  )

  // Only process active instances
  if (!currentStatus || currentStatus === 'completed' || currentStatus === 'rejected') {
    return data
  }

  // Resolve reviews array (from update or existing doc)
  const reviews: ReviewEntry[] = (data.reviews ||
    (originalDoc?.reviews ? [...originalDoc.reviews] : [])) as ReviewEntry[]
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return data

  // Find the review that was just actioned for the current step.
  // processWorkflowInstanceAction sets the response BEFORE calling payload.update, so by
  // the time this hook runs the review is already non-pending in data.reviews.
  // We match: correct step slug + non-pending response + was pending (or new) in originalDoc.
  const originalReviews: ReviewEntry[] = (originalDoc?.reviews ?? []) as ReviewEntry[]
  const currentIndex = reviews.findIndex((r, idx) => {
    if (r.status_slug !== currentStepSlug) return false
    if (r.response === 'pending') return false
    const originalResponse = originalReviews[idx]?.response
    return !originalResponse || originalResponse === 'pending'
  })

  if (currentIndex === -1) return data

  const currentReview = reviews[currentIndex] as any
  let isReviewModified = false

  // Existing event log entries — we append to this array
  const existingEvents = ((originalDoc?.event_logs ?? []) as WorkflowEventEntry[])
  const newEvents: WorkflowEventEntry[] = []
  const actorEmail = u?.email || 'system'

  // ── Fetch source document for payload-aware skip evaluation ─────────────
  let sourceDoc: Record<string, unknown> | undefined
  const documentCollection = data.document_collection || originalDoc?.document_collection
  const documentId = data.document_id || originalDoc?.document_id

  if (documentCollection && documentId) {
    try {
      sourceDoc = (await p.findByID({
        collection: documentCollection as keyof Config['collections'],
        id: documentId,
        depth: 2,
        overrideAccess: true,
        req,
      })) as unknown as Record<string, unknown>
    } catch {
      logger.warn(
        `[workflowInstanceUpdate] Could not fetch source doc ${documentCollection}:${documentId}`,
      )
    }
  }

  // ── Validate required fields + email format (generic, block-driven) ──────
  if (
    !currentReview.auto_complete &&
    ['approved', 'rejected', 'acknowledged'].includes(currentReview.response)
  ) {
    const fieldResponses: FieldResponse[] = currentReview.field_responses || []
    const hasValue = (name: string) => {
      const entry = fieldResponses.find((r) => r.name === name)
      return entry != null && entry.value !== '' && entry.value != null
    }
    const getValue = (name: string) => fieldResponses.find((r) => r.name === name)?.value

    const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validateBlock = (block: FieldBlockConfig) => {
      if (!block.name) return
      if (block.required && !hasValue(block.name)) {
        throw new APIError(`"${block.name}" is required.`, 400)
      }
      const value = getValue(block.name)
      if (
        block.blockType === 'email' &&
        typeof value === 'string' &&
        value !== '' &&
        !EMAIL_FORMAT_REGEX.test(value)
      ) {
        throw new APIError(`"${block.name}" must be a valid email address.`, 400)
      }
    }

    const beforeFields: FieldBlockConfig[] = currentReview.before_response_fields || []
    beforeFields.forEach(validateBlock)

    const afterFieldsKey =
      currentReview.response === 'approved'
        ? 'after_response_approved_fields'
        : currentReview.response === 'rejected'
          ? 'after_response_rejected_fields'
          : 'after_response_acknowledged_fields'
    const afterFields: FieldBlockConfig[] = currentReview[afterFieldsKey] || []
    afterFields.forEach(validateBlock)
  }

  // ── Handle advancing statuses ─────────────────────────────────────────────
  const advancingStatuses = ['approved', 'auto_completed', 'skipped', 'acknowledged']

  if (currentReview.response != null && advancingStatuses.includes(currentReview.response)) {
    // Stamp reviewed_at and reviewed_by
    if (!currentReview.reviewed_at) {
      currentReview.reviewed_at = new Date().toISOString()
      isReviewModified = true
    }
    if (!currentReview.reviewed_by && u?.email) {
      currentReview.reviewed_by = u.email
      isReviewModified = true
    }

    newEvents.push(makeEvent(
      'responded',
      actorEmail,
      currentReview.status_slug,
      currentReview.label,
      { response: currentReview.response },
    ))

    // Find next step — skip any steps whose skip condition now matches
    // We look past currentIndex for the next unattempted (pending) review
    // (For loops, new review entries are appended — see rejection handling below)
    let nextIndex = currentIndex + 1

    while (nextIndex < reviews.length) {
      const nextReview = reviews[nextIndex]
      // Only skip steps that are still pending
      if (nextReview.response !== 'pending') {
        nextIndex++
        continue
      }

      if (evaluateSkipConditionV2(nextReview, reviews, nextIndex, sourceDoc)) {
        reviews[nextIndex] = {
          ...nextReview,
          response: 'skipped',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'system',
        }
        isReviewModified = true
        newEvents.push(makeEvent('auto_skipped', 'system', nextReview.status_slug, nextReview.label))
        logger.info(
          `[workflowInstanceUpdate] Auto-skipped step "${nextReview.label}" (index ${nextIndex})`,
        )
        nextIndex++
      } else {
        break
      }
    }

    // ── Re-resolve dynamic reviewers for every approver on the next pending step ──
    if (nextIndex < reviews.length && reviews[nextIndex]?.response === 'pending') {
      const nextReview = reviews[nextIndex] as any
      const existingTokens = (nextReview.reviewer_tokens as ReviewerToken[]) || []
      const resolvedTokens = await Promise.all(
        existingTokens.map((t) =>
          resolveDynamicReviewerTokenEntry(t, currentIndex, reviews, sourceDoc, data, req, logger),
        ),
      )
      const tokensChanged = resolvedTokens.some((t, i) => t.email !== existingTokens[i]?.email)
      if (tokensChanged) {
        reviews[nextIndex] = { ...nextReview, reviewer_tokens: resolvedTokens }
        isReviewModified = true
      }
    }

    if (nextIndex < reviews.length && reviews[nextIndex]?.response === 'pending') {
      // Advance to next step
      const nextStep = reviews[nextIndex]
      data.current_step = nextStep.status_slug
      data.current_step_label = nextStep.label
      data.status = 'in_review'
      logger.info(`[workflowInstanceUpdate] Advanced to step "${nextStep.status_slug}"`)
    } else {
      // No more pending steps → complete the workflow
      data.status = 'completed'
      data.current_step = 'completed'
      data.current_step_label = 'Completed'
      newEvents.push(makeEvent('completed', 'system', 'completed', 'Completed'))
      logger.info(`[workflowInstanceUpdate] Workflow instance completed`)
    }
  } else if (currentReview.response === 'rejected') {
    // ── Rejection with routing policy ────────────────────────────────────
    if (!currentReview.reviewed_at) {
      currentReview.reviewed_at = new Date().toISOString()
      isReviewModified = true
    }
    if (!currentReview.reviewed_by && u?.email) {
      currentReview.reviewed_by = u.email
      isReviewModified = true
    }

    newEvents.push(makeEvent(
      'responded',
      actorEmail,
      currentReview.status_slug,
      currentReview.label,
      { response: 'rejected' },
    ))

    const rejectionPolicy = currentReview.rejection_policy || 'end'
    const rejectionTargetStep = currentReview.rejection_target_step

    if (rejectionPolicy === 'end') {
      // Terminal rejection — entire workflow is rejected
      data.status = 'rejected'
      data.current_step = 'rejected'
      data.current_step_label = 'Rejected'
      newEvents.push(makeEvent('rejected', actorEmail, 'rejected', 'Rejected'))
      logger.info(`[workflowInstanceUpdate] Workflow instance rejected (terminal)`)
    } else {
      // Loop back — create a new pending review entry for the target step
      let targetStepSlug: string | undefined

      if (rejectionPolicy === 'previous' && currentIndex > 0) {
        targetStepSlug = reviews[currentIndex - 1].status_slug ?? undefined
      } else if (rejectionPolicy === 'specific_step' && rejectionTargetStep) {
        targetStepSlug = rejectionTargetStep
      }

      if (targetStepSlug) {
        // Canonical (iteration 1) entries preserve the blueprint's original step order even
        // after earlier loop-backs have spliced extra pending clones into `reviews` — new
        // clones are always inserted, never reordering the iteration-1 entries themselves.
        const canonicalReviews = reviews.filter((r: any) => !r.iteration || r.iteration === 1)
        const canonicalTargetIdx = canonicalReviews.findIndex((r) => r.status_slug === targetStepSlug)
        const canonicalCurrentIdx = canonicalReviews.findIndex(
          (r) => r.status_slug === currentReview.status_slug,
        )

        if (canonicalTargetIdx === -1) {
          // Fallback to terminal rejection if target step not found
          logger.warn(
            `[workflowInstanceUpdate] Loop-back target step "${targetStepSlug}" not found, falling back to terminal rejection`,
          )
          data.status = 'rejected'
          data.current_step = 'rejected'
          data.current_step_label = 'Rejected'
        } else {
          // Re-walk every step from the loop-back target through the step that just
          // rejected (inclusive), in original blueprint order, so the engine encounters
          // them as pending again instead of jumping straight past already-resolved
          // entries to whatever came after the rejecting step the first time around.
          const stepsToReplay =
            canonicalCurrentIdx !== -1 && canonicalTargetIdx <= canonicalCurrentIdx
              ? canonicalReviews.slice(canonicalTargetIdx, canonicalCurrentIdx + 1)
              : [canonicalReviews[canonicalTargetIdx]]

          const nextIterationFor = (slug: string | null | undefined) =>
            Math.max(
              ...reviews
                .filter((r) => r.status_slug === slug)
                .map((r: any) => r.iteration || 1),
            ) + 1

          const loopReviews = stepsToReplay.map((stepConfig: any) => {
            const iteration = nextIterationFor(stepConfig.status_slug)
            // Exclude `id` so Payload auto-generates a fresh one for the new array row.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _omitId, ...stepConfigBase } = stepConfig
            // Fresh tokens for every approver — invalidates old email links on this loop iteration.
            const freshReviewerTokens: ReviewerToken[] = (
              (stepConfig.reviewer_tokens as ReviewerToken[]) || []
            ).map((t) => ({
              ...t,
              token: uuidv4(),
              response: 'pending' as const,
              reviewed_by: null,
              reviewed_at: null,
            }))
            return {
              ...stepConfigBase,
              reviewer_tokens: freshReviewerTokens,
              response: 'pending' as const,
              reviewed_at: null,
              reviewed_by: null,
              field_responses: null,
              iteration,
            } as ReviewEntry
          })

          // Insert immediately after the rejected step so that when the loop-back
          // steps are approved in order, nextIndex walks through them and then into
          // the remaining untouched steps. push() would append to the end, causing
          // the engine to see no pending steps after the loop-back and incorrectly
          // mark the workflow completed.
          reviews.splice(currentIndex + 1, 0, ...loopReviews)
          isReviewModified = true

          const firstLoopReview = loopReviews[0] as any
          data.current_step = targetStepSlug
          data.current_step_label = firstLoopReview.label
          data.status = 'in_review'
          newEvents.push(makeEvent(
            'loop_back',
            actorEmail,
            targetStepSlug,
            firstLoopReview.label,
            {
              from_step: currentReview.status_slug,
              iteration: firstLoopReview.iteration,
              replay_steps: loopReviews.map((r: any) => r.status_slug),
            },
          ))
          logger.info(
            `[workflowInstanceUpdate] Looped back to step "${targetStepSlug}", replaying ${loopReviews.length} step(s) (iteration ${firstLoopReview.iteration})`,
          )
        }
      } else {
        // No valid target → terminal rejection
        data.status = 'rejected'
        data.current_step = 'rejected'
        data.current_step_label = 'Rejected'
        logger.warn(
          `[workflowInstanceUpdate] Could not resolve loop-back target, falling back to terminal rejection`,
        )
      }
    }
  }

  if (isReviewModified) {
    data.reviews = reviews
  }

  if (newEvents.length > 0) {
    data.event_logs = [...existingEvents, ...newEvents] as WorkflowInstance['event_logs']
  }

  logger.info(
    `[workflowInstanceUpdate] Done. status=${data.status}, current_step=${data.current_step}`,
  )
  return data
}
