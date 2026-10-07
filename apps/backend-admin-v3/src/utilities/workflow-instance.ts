import { v4 as uuidv4 } from 'uuid'
import { resolveFieldBlocks } from '@/utilities/workflow-field-blocks'
import { Department, Operator, WorkflowInstance, WorkflowV2 } from '@/payload-types'
import { APIError, CollectionSlug, PayloadRequest } from 'payload'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowInstanceInitArgs {
  /**
   * The slug of the Workflow V2 blueprint to use.
   * This is resolved at call time (not stored in settings).
   */
  workflowV2Slug: string

  /**
   * The operator ID that owns this instance.
   * Defaults to the logged-in user's operator.
   */
  operatorId?: string

  /** The collection slug of the source document. */
  documentCollection: CollectionSlug

  /** The ID of the source document. */
  documentId: string

  /**
   * Optional: Override the department used for `requestor_department` steps.
   */
  overrideRequestorDepartment?: (
    req: PayloadRequest,
    sourceDoc: Record<string, unknown>,
  ) => Promise<Department>

  /**
   * Optional: Resolve the approver email for `employee` type steps.
   * Receives the step slug so different steps can return different approvers.
   */
  setEmployeeApprover?: (
    req: PayloadRequest,
    sourceDoc: Record<string, unknown>,
    stepSlug: string,
  ) => Promise<string | undefined>

  /**
   * Optional: Title for this instance (e.g. "Case #123 – CRM Workflow").
   * Defaults to "{documentCollection} #{documentId} – {workflowName}".
   */
  title?: string

  /** Optional: User to set as the Case Owner (handles customer-facing comms). */
  caseOwnerId?: string
}

// Convenience aliases derived from generated Payload types — no manual duplication
export type BlueprintStep = NonNullable<NonNullable<WorkflowV2['steps']>[number]>
type ApproverEntry = NonNullable<NonNullable<BlueprintStep['approvers']>[number]>

/** Approver identity/resolution fields — every entry in a step's `approvers[]` array has this shape. */
export type ApproverDef = Pick<
  ApproverEntry,
  | 'approver_type'
  | 'approver_email'
  | 'department'
  | 'document_department_field_path'
  | 'approver_form_field_path'
  | 'approver_workflow_field_name'
  | 'approver_store_department_field_path'
  | 'approver_custom_field_name'
  | 'approver_custom_field_step_slug'
>

/**
 * One entry in the unified `reviewer_tokens` json array on a review. No entry is
 * "the primary" — every approver in a step's `approvers[]` gets one of these, and
 * any of them can independently act. Capabilities/labels/response-fields are NOT
 * duplicated here — they live once on the review itself (`can_approve`, etc.),
 * shared by every entry.
 */
export interface ReviewerToken {
  email: string
  token: string
  approver_type: ApproverEntry['approver_type']
  response: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'skipped'
  reviewed_by?: string | null
  reviewed_at?: string | null
  // Resolution fields — needed to re-resolve dynamic approver types (workflow_field_email,
  // form_field_email, workflow_custom_field_department) at step-advancement time, since
  // each approver entry can have a different dynamic-field name to look up.
  approver_form_field_path?: string | null
  approver_workflow_field_name?: string | null
  approver_store_department_field_path?: string | null
  approver_custom_field_name?: string | null
  approver_custom_field_step_slug?: string | null
}

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
// Helper: resolve any single approver definition → email string
// Used for both the primary approver and every additional_approvers entry.
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveApproverEmail(
  approver: ApproverDef,
  stepSlug: string,
  req: PayloadRequest,
  sourceDoc: Record<string, unknown>,
  overrideRequestorDepartment?: WorkflowInstanceInitArgs['overrideRequestorDepartment'],
  setEmployeeApprover?: WorkflowInstanceInitArgs['setEmployeeApprover'],
): Promise<string> {
  const p = req.payload
  const u = req.user
  const logger = p.logger

  switch (approver.approver_type) {
    case 'email': {
      if (!approver.approver_email) {
        throw new APIError(`Step "${stepSlug}": No approver_email defined for email approver.`, 500)
      }
      return approver.approver_email
    }

    case 'department': {
      const dept = approver.department as Department
      if (!dept || !dept.manager_email) {
        throw new APIError(`Step "${stepSlug}": No department or manager_email defined.`, 500)
      }
      return dept.manager_email
    }

    case 'requestor_department': {
      let userDept = u?.department as Department

      if (!u || !userDept?.manager_email) {
        throw new APIError(
          `Step "${stepSlug}": User has no department or department manager assigned.`,
          400,
        )
      }

      if (overrideRequestorDepartment) {
        logger.warn(`[workflowInstanceInit] Overriding requestor department for step "${stepSlug}"`)
        userDept = await overrideRequestorDepartment(req, sourceDoc)
      }

      return userDept.manager_email || ''
    }

    case 'employee': {
      if (!setEmployeeApprover) {
        throw new APIError(
          `Step "${stepSlug}": setEmployeeApprover hook not provided for "employee" type.`,
          500,
        )
      }
      const email = await setEmployeeApprover(req, sourceDoc, stepSlug)
      if (!email) {
        throw new APIError(`Step "${stepSlug}": setEmployeeApprover returned no email.`, 400)
      }
      return email
    }

    case 'created_by': {
      // The requestor's own email — resolved further at notification-send time
      return u?.email || ''
    }

    case 'document_department_field': {
      const fieldPath = approver.document_department_field_path
      if (!fieldPath) {
        throw new APIError(
          `Step "${stepSlug}": document_department_field_path is not defined.`,
          500,
        )
      }

      const deptValue = getValueByPath(sourceDoc, fieldPath)
      const deptId =
        deptValue != null && typeof deptValue === 'object'
          ? (deptValue as Record<string, unknown>).id
          : deptValue

      if (!deptId) {
        throw new APIError(
          `Step "${stepSlug}": Document field "${fieldPath}" is empty or not a department relationship.`,
          400,
        )
      }

      const dept = await p.findByID({
        collection: 'departments',
        id: String(deptId),
        depth: 0,
        overrideAccess: true,
        req,
      })

      const managerEmail = dept?.manager_email
      if (!managerEmail) {
        throw new APIError(
          `Step "${stepSlug}": Department resolved from "${fieldPath}" has no manager_email.`,
          400,
        )
      }

      return managerEmail
    }

    case 'store_department_field': {
      const fieldPath = approver.approver_store_department_field_path
      if (!fieldPath) {
        throw new APIError(
          `Step "${stepSlug}": approver_store_department_field_path is not defined for store_department_field approver.`,
          500,
        )
      }

      let storeDeptValue = getValueByPath(sourceDoc, fieldPath)

      // Fallback: search submissionData array for form submissions
      if (!storeDeptValue) {
        const submissionData = sourceDoc.submissionData as
          | Array<{ field: string; value: unknown }>
          | undefined
        const match = submissionData?.find((item) => item.field === fieldPath)
        storeDeptValue = match?.value ?? undefined
      }

      const storeDeptId =
        storeDeptValue != null && typeof storeDeptValue === 'object'
          ? (storeDeptValue as Record<string, unknown>).id
          : storeDeptValue

      if (!storeDeptId) {
        // Not on the source document — it may be a workflow response field, filled
        // in during a step's review rather than present at submission time. Defer;
        // the before-change hook re-resolves this from field_responses once that
        // step has been answered.
        logger.info(
          `[resolveApproverEmail] Step "${stepSlug}": store_department_field "${fieldPath}" not found on source document — deferred, will be resolved at advancement.`,
        )
        return ''
      }

      const storeDept = await p.findByID({
        collection: 'store-departments',
        id: String(storeDeptId),
        depth: 1,
        overrideAccess: true,
        req,
      })

      const manager = storeDept?.manager
      const managerEmail =
        manager != null && typeof manager === 'object' ? (manager as { email?: string }).email : null

      if (!managerEmail) {
        throw new APIError(
          `Step "${stepSlug}": Store department resolved from "${fieldPath}" has no manager or the manager has no email.`,
          400,
        )
      }

      return managerEmail
    }

    case 'form_field_email': {
      const fieldPath = approver.approver_form_field_path
      if (!fieldPath) {
        throw new APIError(
          `Step "${stepSlug}": approver_form_field_path is not defined for form_field_email approver.`,
          500,
        )
      }

      // Try dot-notation on the source doc first (handles nested fields)
      let resolvedEmail = getValueByPath(sourceDoc, fieldPath)

      // Fall back: search submissionData array by field name (flat form fields)
      if (!resolvedEmail) {
        const submissionData = sourceDoc.submissionData as Array<{ field: string; value: unknown }> | undefined
        const match = submissionData?.find((item) => item.field === fieldPath)
        resolvedEmail = match?.value
      }

      if (!resolvedEmail || typeof resolvedEmail !== 'string') {
        throw new APIError(
          `Step "${stepSlug}": Could not resolve email from field path "${fieldPath}" on source document.`,
          400,
        )
      }

      return resolvedEmail
    }

    case 'workflow_field_email': {
      // Cannot resolve at init time — no prior responses exist yet.
      // The before-change hook re-resolves this when the previous step advances.
      logger.info(
        `[resolveApproverEmail] Step "${stepSlug}": workflow_field_email deferred — placeholder set, will be resolved at advancement.`,
      )
      return ''
    }

    case 'workflow_custom_field_department': {
      // Cannot resolve at init time — prior step's custom field response not yet available.
      // The before-change hook re-resolves by reading the classified option's related_department.
      logger.info(
        `[resolveApproverEmail] Step "${stepSlug}": workflow_custom_field_department deferred — will be resolved at advancement.`,
      )
      return ''
    }

    default:
      throw new APIError(
        `Step "${stepSlug}": Unknown approver_type "${approver.approver_type}".`,
        500,
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: create a workflow instance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new `workflow-instances` record for a given source document.
 *
 * This is the V2 equivalent of `workflowInit` but decoupled from Payload hooks.
 * Call it explicitly from the source document's `afterChange` hook.
 *
 * Multi-approver support:
 *   - Every entry in a step's `approvers[]` is resolved and gets its own unique
 *     `token` — there is no "primary" vs "additional" distinction. All entries
 *     are stored as `reviewer_tokens: [{email, token, approver_type, response, ...}]`
 *     on the review record, and any of them can independently act on the step.
 */
export async function createWorkflowInstance(
  req: PayloadRequest,
  args: WorkflowInstanceInitArgs,
): Promise<Record<string, unknown>> {
  const {
    workflowV2Slug,
    operatorId: operatorIdArg,
    documentCollection,
    documentId,
    overrideRequestorDepartment,
    setEmployeeApprover,
    title,
    caseOwnerId,
  } = args

  const p = req.payload
  const u = req.user
  const logger = p.logger

  logger.info(
    `[workflowInstanceInit] Creating instance for ${documentCollection}:${documentId} using blueprint "${workflowV2Slug}"`,
  )

  // ── Resolve operator ─────────────────────────────────────────────────────
  const targetOperatorId =
    operatorIdArg ||
    (u?.operator as Operator)?.id ||
    (typeof u?.operator === 'string' ? u.operator : undefined)

  if (!targetOperatorId) {
    throw new APIError('No operator resolved to create a workflow instance.', 400)
  }

  // ── Fetch source document ─────────────────────────────────────────────────
  const sourceDoc = await p.findByID({
    collection: documentCollection,
    id: documentId,
    depth: 2,
    overrideAccess: true,
    req,
  }) as unknown as Record<string, unknown>
  if (!sourceDoc) {
    throw new APIError(`Source document not found: ${documentCollection}:${documentId}`, 404)
  }

  // ── Fetch Workflow V2 blueprint ───────────────────────────────────────────
  const blueprints = await p.find({
    collection: 'workflow-v2',
    where: {
      slug: { equals: workflowV2Slug },
      and: [{ operator: { equals: targetOperatorId } }],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })

  if (blueprints.totalDocs === 0) {
    throw new APIError(`No workflow-v2 blueprint found with slug "${workflowV2Slug}" for this operator.`, 404)
  }

  const blueprint = blueprints.docs[0] as WorkflowV2

  // ── Build reviews array from steps ───────────────────────────────────────
  type ReviewEntry = NonNullable<WorkflowInstance['reviews']>[number]
  const reviews: ReviewEntry[] = []
  let totalTokenCount = 0

  type BlueprintStep = NonNullable<WorkflowV2['steps']>[number]
  for (const step of (blueprint.steps as BlueprintStep[]) || []) {
    try {
      // ── 1. Resolve every approver in this step's `approvers[]` — each gets
      //    its own token; no entry is privileged as "the primary". ───────────
      const approverDefs = step.approvers || []
      if (approverDefs.length === 0) {
        throw new Error(`Step "${step.slug}" has no approvers configured.`)
      }

      const reviewerTokens: ReviewerToken[] = []
      for (const approverDef of approverDefs) {
        const email = await resolveApproverEmail(
          approverDef as ApproverDef,
          step.slug,
          req,
          sourceDoc,
          overrideRequestorDepartment,
          setEmployeeApprover,
        )
        reviewerTokens.push({
          email,
          token: uuidv4(),
          approver_type: approverDef.approver_type,
          response: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          approver_form_field_path: approverDef.approver_form_field_path ?? null,
          approver_workflow_field_name: approverDef.approver_workflow_field_name ?? null,
          approver_store_department_field_path: approverDef.approver_store_department_field_path ?? null,
          approver_custom_field_name: approverDef.approver_custom_field_name ?? null,
          approver_custom_field_step_slug: approverDef.approver_custom_field_step_slug ?? null,
        })
        totalTokenCount++
      }

      // ── 2. Resolve response-field block snapshots (expand any
      //    global_field_ref blocks against the blueprint's global library). ──
      const globalCustomFields = blueprint.global_custom_fields || []
      
      // Cast arrays to resolve structural mismatch with FieldBlockConfig parameter
      const globals = globalCustomFields as unknown as { blockType: string }[]
      const beforeResponseFields = resolveFieldBlocks(
        step.before_response_fields as unknown as { blockType: string }[],
        globals,
      ) as unknown as ReviewEntry['before_response_fields']
      const afterResponseApprovedFields = resolveFieldBlocks(
        step.after_response_approved_fields as unknown as { blockType: string }[],
        globals,
      ) as unknown as ReviewEntry['after_response_approved_fields']
      const afterResponseRejectedFields = resolveFieldBlocks(
        step.after_response_rejected_fields as unknown as { blockType: string }[],
        globals,
      ) as unknown as ReviewEntry['after_response_rejected_fields']
      const afterResponseAcknowledgedFields = resolveFieldBlocks(
        step.after_response_acknowledged_fields as unknown as { blockType: string }[],
        globals,
      ) as unknown as ReviewEntry['after_response_acknowledged_fields']

      // ── 3. Build review record ───────────────────────────────────────────
      const review: ReviewEntry = {
        label: step.label,
        status_slug: step.slug,
        iteration: 1,
        response: 'pending',
        reviewer_tokens: reviewerTokens,
        // Step config snapshot — shared by every approver in reviewer_tokens
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
        // V2 features
        rejection_policy: step.rejection_policy ?? 'end',
        rejection_target_step: step.rejection_target_step ?? null,
        skip_condition: step.skip_condition ?? null,
        // Block-based response fields
        before_response_fields: beforeResponseFields,
        after_response_approved_fields: afterResponseApprovedFields,
        after_response_rejected_fields: afterResponseRejectedFields,
        after_response_acknowledged_fields: afterResponseAcknowledgedFields,
      }

      reviews.push(review)
    } catch (innerErr) {
      throw new APIError(
        `[workflowInstanceInit] Error processing step "${step.label as string}": ${innerErr instanceof Error ? innerErr.message : 'Unknown error'}`,
        500,
      )
    }
  }

  // ── Determine initial step ────────────────────────────────────────────────
  const firstStep = (blueprint.steps as Record<string, unknown>[])?.[0]
  const initialStepSlug = (firstStep?.slug as string) || 'draft'
  const initialStepLabel = (firstStep?.label as string) || ''

  // ── Create the instance ───────────────────────────────────────────────────
  const instanceTitle =
    title ||
    `${documentCollection} #${documentId} – ${(blueprint.name as string) || workflowV2Slug}`

  const instance = await p.create({
    collection: 'workflow-instances',
    data: {
      title: instanceTitle,
      operator: targetOperatorId,
      workflow_v2: blueprint.id as string,
      document_collection: documentCollection,
      document_id: documentId,
      status: 'in_review' as const,
      current_step: initialStepSlug,
      current_step_label: initialStepLabel,
      case_owner: caseOwnerId || undefined,
      reviews,
    },
    overrideAccess: true,
    req,
  })

  logger.info(
    `[workflowInstanceInit] Created instance ${instance.id} → step "${initialStepSlug}" | ${totalTokenCount} total approver tokens`,
  )

  return instance as unknown as Record<string, unknown>
}
