import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'

// Two-step incident escalation: Security Manager review, then the manager of
// whichever store department the SUBMITTER chose on the incident form itself
// (form field "store_department" — see forms-printemps-incident-forms seed)
// is resolved as the second approver via `store_department_field`, which
// reads that field directly off the source document at instance-creation time.
export const seedCrmIncidentWorkflowBlueprint = async (payload: Payload): Promise<void> => {
  const printempsOperatorResult = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'printemps' } },
    limit: 1,
    overrideAccess: true,
  })
  const printempsOperator = printempsOperatorResult.docs[0] as Operator | undefined

  if (!printempsOperator) {
    payload.logger.warn(
      '[seedWorkflowV2] Operator "printemps" not found — skipping "crm-incident-workflow".',
    )
    return
  }

  const incidentSlug = 'crm-incident-workflow'
  const incidentOperatorSlug = 'printemps-crm-incident-workflow'

  const existingIncident = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: incidentSlug } },
    limit: 1,
    overrideAccess: true,
  })

  const incidentBlueprintData = {
    name: 'CRM Incident Workflow',
    slug: incidentSlug,
    operator_slug: incidentOperatorSlug,
    operator: printempsOperator.id,
    notify_on_complete: true,
    notify_on_update: true,
    notify_on_reject: true,
    approval_notifications: [],
    rejection_notifications: [],
    global_custom_fields: [],
    steps: [

      // ── Step 1: Security Manager Review ─────────────────────────────────
      {
        label: 'Security Manager Review',
        slug: `${incidentOperatorSlug}.security-manager-review`,
        approvers: [
          { approver_type: 'email', approver_email: 'security.manager@email.com' },
        ],
        final_approval: false, auto_complete: false, rejection_policy: 'end',
        can_acknowledge: false, can_approve: true, can_reject: true,
        can_skip: false, can_generate_wordfile: false,
        hide_history: false, hide_details: false, hide_description: false,
        hide_attachments: false, hide_email_actions: false,
        acknowledge_label: 'Acknowledge', approve_label: 'Approve',
        reject_label: 'Reject', skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'root_cause_security', label: 'Root Cause (Security)', required: true },
          { blockType: 'textarea', name: 'corrective_action_security', label: 'Corrective Action (Security)', required: true },
          { blockType: 'number', name: 'loss_time_in_days', label: 'Loss time in Days', required: false },
          { blockType: 'textarea', name: 'future_actions_required_to_prevent_recurrence', label: 'Future Actions Required to Prevent Recurrence', required: false },
          { blockType: 'file', name: 'evidence', label: 'Evidence', required: false },
        ],
        after_response_approved_fields: [],
        after_response_rejected_fields: [],
        after_response_acknowledged_fields: [],
        on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },

      // ── Step 2: Store Department Review — approver resolved from the
      // form submission's own "store_department" field, chosen by the submitter.
      {
        label: 'Store Department Review',
        slug: `${incidentOperatorSlug}.store-department-review`,
        approvers: [
          { approver_type: 'store_department_field', approver_store_department_field_path: 'store_department' },
        ],
        final_approval: false, auto_complete: false, rejection_policy: 'end',
        can_acknowledge: false, can_approve: true, can_reject: true,
        can_skip: false, can_generate_wordfile: false,
        hide_history: false, hide_details: false, hide_description: false,
        hide_attachments: false, hide_email_actions: false,
        acknowledge_label: 'Acknowledge', approve_label: 'Approve',
        reject_label: 'Reject', skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'root_cause_store_department', label: 'Root Cause (Store Department)', required: false },
          { blockType: 'textarea', name: 'corrective_action_store_department', label: 'Corrective Action (Store Department)', required: false },
        ],
        after_response_approved_fields: [],
        after_response_rejected_fields: [],
        after_response_acknowledged_fields: [],
        on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },

    ],
  } as RequiredDataFromCollectionSlug<'workflow-v2'>

  if (existingIncident.totalDocs > 0) {
    payload.logger.info(`[seedWorkflowV2] "${incidentSlug}" already exists — updating.`)
    await payload.update({
      collection: 'workflow-v2',
      id: existingIncident.docs[0]!.id,
      overrideAccess: true,
      data: incidentBlueprintData,
    })
  } else {
    await payload.create({
      collection: 'workflow-v2',
      overrideAccess: true,
      data: incidentBlueprintData,
    })
  }

  payload.logger.info(`[seedWorkflowV2] "${incidentSlug}" upserted successfully.`)
}
