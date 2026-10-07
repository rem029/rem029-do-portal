import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'

// Demo blueprint: exercises before/after-response fields (including the
// acknowledged-phase, never populated by any other seeded blueprint) and a
// global_field_ref reused across steps/response-types. See
// .temp/Purchase-Approval-Workflow-V2-Design.md for the full rationale.
export const seedPurchaseApprovalBlueprint = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const purchaseSlug = 'purchase-approval'
  const purchaseOperatorSlug = 'doha-oasis-purchase-approval'

  const existingPurchase = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: purchaseSlug } },
    limit: 1,
    overrideAccess: true,
  })

  const purchaseBlueprintData = {
    name: 'Purchase Approval',
    slug: purchaseSlug,
    operator_slug: purchaseOperatorSlug,
    operator: operator.id,
    notify_on_complete: true,
    notify_on_update: true,
    notify_on_reject: true,
    approval_notifications: [
      {
        type: 'document_field',
        document_field_path: 'requester_email',
        hide_history: false,
        hide_details: false,
        hide_description: false,
        hide_attachments: false,
        hide_email_actions: false,
      },
    ],
    rejection_notifications: [
      {
        type: 'document_field',
        document_field_path: 'requester_email',
        hide_history: false,
        hide_details: false,
        hide_description: false,
        hide_attachments: false,
        hide_email_actions: false,
      },
    ],
    global_custom_fields: [
      { blockType: 'text', name: 'po_number', label: 'Purchase Order Number', required: false },
      { blockType: 'textarea', name: 'rejection_reason', label: 'Reason for Rejection', required: true },
    ],
    steps: [

      // ── Step 1: Finance Review ──────────────────────────────────────────
      {
        label: 'Finance Review',
        slug: `${purchaseOperatorSlug}.finance-review`,
        approvers: [
          { approver_type: 'email', approver_email: 'finance-team@purchasing.com' },
        ],
        final_approval: false, auto_complete: false, rejection_policy: 'end',
        can_acknowledge: false, can_approve: true, can_reject: true,
        can_skip: false, can_generate_wordfile: false,
        hide_history: false, hide_details: false, hide_description: false,
        hide_attachments: false, hide_email_actions: false,
        acknowledge_label: 'Acknowledge', approve_label: 'Approve & Assign PO',
        reject_label: 'Reject', skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          { blockType: 'number', name: 'estimated_cost_confirm', label: 'Confirmed Estimated Cost', required: true },
        ],
        after_response_approved_fields: [
          { blockType: 'global_field_ref', global_field_name: 'po_number' },
        ],
        after_response_rejected_fields: [
          { blockType: 'global_field_ref', global_field_name: 'rejection_reason' },
        ],
        after_response_acknowledged_fields: [],
        on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },

      // ── Step 2: Procurement Fulfillment ─────────────────────────────────
      {
        label: 'Procurement Fulfillment',
        slug: `${purchaseOperatorSlug}.procurement-fulfillment`,
        approvers: [
          { approver_type: 'email', approver_email: 'procurement-team@purchasing.com' },
        ],
        final_approval: false, auto_complete: false, rejection_policy: 'end',
        can_acknowledge: false, can_approve: true, can_reject: true,
        can_skip: false, can_generate_wordfile: false,
        hide_history: false, hide_details: false, hide_description: false,
        hide_attachments: false, hide_email_actions: false,
        acknowledge_label: 'Acknowledge', approve_label: 'Confirm Order',
        reject_label: 'Reject Order', skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          { blockType: 'text', name: 'payment_terms', label: 'Payment Terms', required: true },
        ],
        after_response_approved_fields: [
          { blockType: 'date', name: 'expected_delivery_date', label: 'Expected Delivery Date', required: true },
          { blockType: 'email', name: 'vendor_contact_email', label: 'Vendor Contact Email', required: false },
        ],
        after_response_rejected_fields: [
          { blockType: 'global_field_ref', global_field_name: 'rejection_reason' },
        ],
        after_response_acknowledged_fields: [],
        on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },

      // ── Step 3: Finance Closure ──────────────────────────────────────────
      {
        label: 'Finance Closure',
        slug: `${purchaseOperatorSlug}.finance-closure`,
        approvers: [
          { approver_type: 'email', approver_email: 'finance-team@purchasing.com' },
        ],
        final_approval: true, auto_complete: false, rejection_policy: 'end',
        can_acknowledge: true, can_approve: false, can_reject: false,
        can_skip: false, can_generate_wordfile: false,
        hide_history: false, hide_details: false, hide_description: false,
        hide_attachments: false, hide_email_actions: false,
        acknowledge_label: 'Close Purchase', approve_label: 'Approve',
        reject_label: 'Reject', skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'closure_notes', label: 'Closure Notes', required: false },
        ],
        after_response_approved_fields: [],
        after_response_rejected_fields: [],
        after_response_acknowledged_fields: [
          { blockType: 'global_field_ref', global_field_name: 'po_number' },
          { blockType: 'text', name: 'closure_reference_number', label: 'Closure Reference Number', required: true },
        ],
        on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },

    ],
  } as RequiredDataFromCollectionSlug<'workflow-v2'>

  if (existingPurchase.totalDocs > 0) {
    payload.logger.info(`[seedWorkflowV2] "${purchaseSlug}" already exists — updating.`)
    await payload.update({
      collection: 'workflow-v2',
      id: existingPurchase.docs[0]!.id,
      overrideAccess: true,
      data: purchaseBlueprintData,
    })
  } else {
    await payload.create({
      collection: 'workflow-v2',
      overrideAccess: true,
      data: purchaseBlueprintData,
    })
  }

  payload.logger.info(`[seedWorkflowV2] "${purchaseSlug}" upserted successfully.`)
}
