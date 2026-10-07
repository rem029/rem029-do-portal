import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'

export const seedCrmCaseManagementBlueprint = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const crmSlug = 'crm-case-management'
  const crmOperatorSlug = 'doha-oasis-crm-case-management'

  const existingCrm = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: crmSlug } },
    limit: 1,
    overrideAccess: true,
  })

  // Fetch CRM category IDs for routing options
  const crmCategoryResult = await payload.find({
    collection: 'crm-categories',
    limit: 50,
    overrideAccess: true,
  })
  const categoryBySlug: Record<string, string> = Object.fromEntries(
    crmCategoryResult.docs.map((d) => [d.slug, d.id]),
  )

  const crmCategoryOptions = [
    { label: 'F&B Service or Product', value: 'fnb-service', related_type: 'crm_category', related_crm_category: categoryBySlug['fnb-service'] },
    { label: 'Food Hygiene / Contamination', value: 'food-hygiene', related_type: 'crm_category', related_crm_category: categoryBySlug['food-hygiene'] },
    { label: 'Department Store', value: 'department-store', related_type: 'crm_category', related_crm_category: categoryBySlug['department-store'] },
    { label: 'Health, Safety & Security', value: 'health-safety-security', related_type: 'crm_category', related_crm_category: categoryBySlug['health-safety-security'] },
    { label: 'Delivery / Logistics', value: 'delivery-logistics', related_type: 'crm_category', related_crm_category: categoryBySlug['delivery-logistics'] },
    { label: 'Payment / Refund / Billing', value: 'payment-refund-billing', related_type: 'crm_category', related_crm_category: categoryBySlug['payment-refund-billing'] },
    { label: 'Product Quality (Non-Food)', value: 'product-quality', related_type: 'crm_category', related_crm_category: categoryBySlug['product-quality'] },
    { label: 'Facilities / Maintenance', value: 'facilities-maintenance', related_type: 'crm_category', related_crm_category: categoryBySlug['facilities-maintenance'] },
    { label: 'Digital / App / Website', value: 'digital-app-website', related_type: 'crm_category', related_crm_category: categoryBySlug['digital-app-website'] },
    { label: 'Staff Conduct', value: 'staff-conduct', related_type: 'crm_category', related_crm_category: categoryBySlug['staff-conduct'] },
    { label: 'Loyalty / Membership', value: 'loyalty-membership', related_type: 'crm_category', related_crm_category: categoryBySlug['loyalty-membership'] },
    { label: 'Media / PR / Social', value: 'media-pr-social', related_type: 'crm_category', related_crm_category: categoryBySlug['media-pr-social'] },
  ]

  const crmBlueprintData = {
      name: 'CRM Case Management',
      slug: crmSlug,
      operator_slug: crmOperatorSlug,
      operator: operator.id,
      notify_on_complete: true,
      notify_on_update: true,
      notify_on_reject: true,
      approval_notifications: [
        {
          type: 'document_field',
          document_field_path: 'customer_email',
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
          document_field_path: 'customer_email',
          hide_history: false,
          hide_details: false,
          hide_description: false,
          hide_attachments: false,
          hide_email_actions: false,
        },
      ],
      global_custom_fields: [],
      steps: [

        // ── Step 1: Register Case ────────────────────────────────────────────
        {
          label: 'Register Case',
          slug: `${crmOperatorSlug}.register-case`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'end',
          can_acknowledge: false, can_approve: true, can_reject: true,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Confirm & Proceed',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'file', name: 'attachments', label: 'Attachments', required: false },
            { blockType: 'select', name: 'is_vip', label: 'VIP Customer?', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
        },

        // ── Step 2: VIP Manager Review (skipped for non-VIP) ────────────────
        {
          label: 'VIP Manager Review',
          slug: `${crmOperatorSlug}.vip-review`,
          approvers: [
            { approver_type: 'email', approver_email: 'vip-manager@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'end',
          can_acknowledge: false, can_approve: true, can_reject: true,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Approve',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'not_equals', value: 'yes' },
        },

        // ── Step 3: Classify and Prioritize (non-VIP — skipped for VIP) ─────
        {
          label: 'Classify and Prioritize',
          slug: `${crmOperatorSlug}.classify-prioritize`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'previous',
          can_acknowledge: false, can_approve: true, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Classified — Proceed',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'select', name: 'case_category', label: 'Case Category', required: true, options: crmCategoryOptions },
            { blockType: 'select', name: 'severity', label: 'Severity', required: true, options: [{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'equals', value: 'yes' },
        },

        // ── Step 4: Classify and Prioritize VIP (skipped for non-VIP) ───────
        {
          label: 'Classify and Prioritize (VIP)',
          slug: `${crmOperatorSlug}.classify-prioritize-vip`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'previous',
          can_acknowledge: false, can_approve: true, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Classified — Proceed',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'select', name: 'case_category', label: 'Case Category', required: true, options: crmCategoryOptions },
            { blockType: 'select', name: 'severity', label: 'Severity', required: true, options: [{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'not_equals', value: 'yes' },
        },

        // ── Step 5: Acknowledge Customer (non-VIP — skipped for VIP) ────────
        {
          label: 'Acknowledge Customer',
          slug: `${crmOperatorSlug}.acknowledge-customer`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
            { approver_type: 'email', approver_email: 'crm-manager@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'previous',
          can_acknowledge: true, can_approve: false, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Customer Acknowledged', approve_label: 'Approve',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'equals', value: 'yes' },
        },

        // ── Step 6: Acknowledge Customer VIP (skipped for non-VIP) ──────────
        {
          label: 'Acknowledge Customer (VIP)',
          slug: `${crmOperatorSlug}.acknowledge-customer-vip`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
            { approver_type: 'email', approver_email: 'crm-manager@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'previous',
          can_acknowledge: true, can_approve: false, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Customer Acknowledged (VIP)', approve_label: 'Approve',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'not_equals', value: 'yes' },
        },

        // ── Step 7: Department Investigation (combined investigate + approve) ─
        // Reviewer resolved from case_category classification (any prior step)
        {
          label: 'Department Investigation',
          slug: `${crmOperatorSlug}.department-investigation`,
          approvers: [
            { approver_type: 'workflow_custom_field_department', approver_custom_field_name: 'case_category' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'end',
          can_acknowledge: false, can_approve: true, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Resolved',
          reject_label: 'Escalate', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'signature', name: 'signature', label: 'Signature', required: false },
            { blockType: 'file', name: 'attachments', label: 'Attachments', required: false },
            { blockType: 'select', name: 'refund_needed', label: 'Refund Needed?', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
        },

        // ── Step 8: Confirm Resolution with Customer (non-VIP — skipped for VIP)
        {
          label: 'Confirm Resolution with Customer',
          slug: `${crmOperatorSlug}.confirm-resolution`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: false, auto_complete: false,
          rejection_policy: 'specific_step',
          rejection_target_step: `${crmOperatorSlug}.department-investigation`,
          can_acknowledge: false, can_approve: true, can_reject: true,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Customer Satisfied — Close',
          reject_label: 'Customer Not Satisfied — Reopen', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'select', name: 'customer_satisfied', label: 'Customer Satisfied?', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'equals', value: 'yes' },
        },

        // ── Step 9: Confirm Resolution with Customer VIP (skipped for non-VIP)
        {
          label: 'Confirm Resolution with Customer (VIP)',
          slug: `${crmOperatorSlug}.confirm-resolution-vip`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: false, auto_complete: false,
          rejection_policy: 'specific_step',
          rejection_target_step: `${crmOperatorSlug}.department-investigation`,
          can_acknowledge: false, can_approve: true, can_reject: true,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge',
          approve_label: 'Customer Satisfied — Close',
          reject_label: 'Customer Not Satisfied — Reopen', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
            { blockType: 'select', name: 'customer_satisfied', label: 'Customer Satisfied?', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: true, source: 'workflow_field', field_name: 'is_vip', operator: 'not_equals', value: 'yes' },
        },

        // ── Step 10: Close Case ──────────────────────────────────────────────
        {
          label: 'Close Case',
          slug: `${crmOperatorSlug}.close-case`,
          approvers: [
            { approver_type: 'email', approver_email: 'cs-team@crm.com' },
          ],
          final_approval: true, auto_complete: false, rejection_policy: 'end',
          can_acknowledge: false, can_approve: true, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: false,
          acknowledge_label: 'Acknowledge', approve_label: 'Close Case',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
        },

        // ── Step 11: Report and Review ───────────────────────────────────────
        {
          label: 'Report and Review',
          slug: `${crmOperatorSlug}.report-review`,
          approvers: [
            { approver_type: 'email', approver_email: 'crm-manager@crm.com' },
          ],
          final_approval: false, auto_complete: false, rejection_policy: 'end',
          can_acknowledge: true, can_approve: false, can_reject: false,
          can_skip: false, can_generate_wordfile: false,
          hide_history: false, hide_details: false, hide_description: false,
          hide_attachments: false, hide_email_actions: true,
          acknowledge_label: 'Report Filed', approve_label: 'Approve',
          reject_label: 'Reject', skip_label: 'Skip',
          before_response_fields: [
            { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
          ],
          after_response_approved_fields: [],
          after_response_rejected_fields: [],
          after_response_acknowledged_fields: [],
          on_reaching_notifications: [], on_approval_notifications: [], on_rejection_notifications: [],
          skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
        },

      ],
  } as RequiredDataFromCollectionSlug<'workflow-v2'>

  if (existingCrm.totalDocs > 0) {
    payload.logger.info(`[seedWorkflowV2] "${crmSlug}" already exists — updating.`)
    await payload.update({
      collection: 'workflow-v2',
      id: existingCrm.docs[0]!.id,
      overrideAccess: true,
      data: crmBlueprintData,
    })
  } else {
    await payload.create({
      collection: 'workflow-v2',
      overrideAccess: true,
      data: crmBlueprintData,
    })
  }

  payload.logger.info(`[seedWorkflowV2] "${crmSlug}" upserted successfully.`)
}
