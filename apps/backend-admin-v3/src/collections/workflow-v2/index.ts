import CreatedByField from '@/common/fields/created-by'
import { Slug } from '@/common/fields/slug'
import UpdatedByField from '@/common/fields/updated-by'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { accessCheckResolver, AccessAdmin, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { CollectionConfig, FilterOptions, Field } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { workflowV2AfterChange } from './hooks/after-change'
import { WorkflowFieldBlocksBase, WorkflowFieldBlocksWithRef } from './blocks'

const SLUG = 'workflow-v2'

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-field sets
// ─────────────────────────────────────────────────────────────────────────────

const filterByOperator: FilterOptions = ({ data }) => {
  const operator = data?.operator
  if (operator) {
    return { operator: { equals: typeof operator === 'object' ? operator.id : operator } }
  }
  return true
}

/** Email settings that can be toggled per step or globally */
const WorkflowEmailSettingsFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'hide_history',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide History',
        admin: { width: '20%' },
      },
      {
        name: 'hide_details',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Details',
        admin: { width: '20%' },
      },
      {
        name: 'hide_description',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Description',
        admin: { width: '20%' },
      },
      {
        name: 'hide_attachments',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Attachments',
        admin: { width: '20%' },
      },
      {
        name: 'hide_email_actions',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Email Actions',
        admin: { width: '20%' },
      },
    ],
  },
  { name: 'custom_email_text', type: 'textarea', label: 'Custom Email Text' },
]

/**
 * Action capability toggles per step. These are now shared by every entry in the
 * step's `approvers` array — there is no more per-approver capability config.
 * (enable_comment/enable_signature/can_attach/attachment_label removed — superseded
 * by before_response_fields / after_response_*_fields blocks.)
 */
const WorkflowActionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'can_acknowledge',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Acknowledge',
        admin: { width: '25%' },
      },
      {
        name: 'can_approve',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Approve',
        admin: { width: '25%' },
      },
      {
        name: 'can_reject',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Reject',
        admin: { width: '25%' },
      },
      {
        name: 'can_skip',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Skip',
        admin: { width: '25%' },
      },
      {
        name: 'can_generate_wordfile',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Generate Word File',
        admin: { width: '25%' },
      },
    ],
  },
  {
    name: 'acknowledge_label',
    type: 'text',
    defaultValue: 'Acknowledge',
    label: 'Acknowledge Label',
    admin: { condition: (_, s) => s?.can_acknowledge },
  },
  {
    name: 'approve_label',
    type: 'text',
    defaultValue: 'Approve',
    label: 'Approve Label',
    admin: { condition: (_, s) => s?.can_approve },
  },
  {
    name: 'reject_label',
    type: 'text',
    defaultValue: 'Reject',
    label: 'Reject Label',
    admin: { condition: (_, s) => s?.can_reject },
  },
  {
    name: 'skip_label',
    type: 'text',
    defaultValue: 'Skip',
    label: 'Skip Label',
    admin: { condition: (_, s) => s?.can_skip },
  },
]

/** Notification recipient definition (reused for on_reaching, on_approval, on_rejection notifications) */
const NotificationRecipientFields: Field[] = [
  {
    name: 'type',
    type: 'select',
    defaultValue: 'email',
    options: [
      { label: 'Specific Email', value: 'email' },
      { label: 'Form Email Field', value: 'form_email' },
      { label: 'Department Manager', value: 'department' },
      { label: 'Requestor Department Manager', value: 'requestor_department' },
      { label: 'Requestor (Created By)', value: 'created_by' },
      { label: 'Employee', value: 'employee' },
      { label: 'Document Field (email)', value: 'document_field' },
    ],
  },
  { name: 'email', type: 'email', admin: { condition: (_, s) => s?.type === 'email' } },
  {
    name: 'department',
    type: 'relationship',
    relationTo: 'departments',
    filterOptions: filterByOperator,
    admin: { condition: (_, s) => s?.type === 'department' },
  },
  {
    name: 'document_field_path',
    type: 'text',
    label: 'Document Field Path',
    admin: {
      condition: (_, s) => s?.type === 'document_field',
      description:
        'Dot-notation path to an email field in the linked document (e.g. "owner_email" or "contact.email").',
    },
  },
  ...WorkflowEmailSettingsFields,
]

// ─────────────────────────────────────────────────────────────────────────────
// Skip Condition — V2 extends V1 by also reading from the linked document payload
// ─────────────────────────────────────────────────────────────────────────────

const SkipConditionFields: Field[] = [
  {
    name: 'skip_condition',
    type: 'group',
    label: 'Auto-Skip Condition',
    admin: {
      description: 'If all conditions match, this step will be automatically skipped when reached.',
    },
    fields: [
      { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Enable Auto-Skip' },
      {
        name: 'source',
        type: 'select',
        label: 'Condition Source',
        defaultValue: 'workflow_field',
        options: [
          { label: 'Workflow Custom Field (prior step response)', value: 'workflow_field' },
          { label: 'Document Payload Field', value: 'document_field' },
        ],
        admin: { condition: (_, s) => !!s?.enabled },
      },
      {
        name: 'field_name',
        type: 'text',
        label: 'Field Name / Path',
        admin: {
          condition: (_, s) => !!s?.enabled,
          description:
            'For "Workflow Custom Field": the key of the custom field from a prior step. For "Document Payload Field": dot-notation path on the linked document (e.g. "is_vip" or "category.slug").',
        },
      },
      {
        name: 'operator',
        type: 'select',
        label: 'Operator',
        defaultValue: 'equals',
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'not_equals' },
          { label: 'Greater Than', value: 'greater_than' },
          { label: 'Less Than', value: 'less_than' },
          { label: 'Is Empty', value: 'is_empty' },
          { label: 'Is Not Empty', value: 'is_not_empty' },
        ],
        admin: { condition: (_, s) => !!s?.enabled },
      },
      {
        name: 'value',
        type: 'text',
        label: 'Compare Value',
        admin: {
          condition: (_, s) =>
            !!s?.enabled && s?.operator !== 'is_empty' && s?.operator !== 'is_not_empty',
        },
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Rejection Routing — V2 allows looping back to a prior step
// ─────────────────────────────────────────────────────────────────────────────

const RejectionRoutingFields: Field[] = [
  {
    name: 'rejection_policy',
    type: 'select',
    label: 'On Rejection: Route To',
    defaultValue: 'end',
    options: [
      { label: 'End Workflow (Rejected)', value: 'end' },
      { label: 'Go Back 1 Step', value: 'previous' },
      { label: 'Go to Specific Step', value: 'specific_step' },
    ],
    admin: {
      description:
        'Defines what happens when this step is rejected. "Go to Specific Step" allows loops (e.g. Customer Unsatisfied → back to Investigate).',
    },
  },
  {
    name: 'rejection_target_step',
    type: 'text',
    label: 'Target Step Slug (on rejection)',
    admin: {
      condition: (_, s) => s?.rejection_policy === 'specific_step',
      description:
        'The slug of the step to route to when this step is rejected. Must match a step slug defined in this workflow.',
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Approver resolution fields — who can act on a step. Every entry in a step's
// `approvers` array shares this shape (identity/resolution only — capabilities
// and response fields are step-level now, shared by all approvers).
// ─────────────────────────────────────────────────────────────────────────────

const APPROVER_TYPE_OPTIONS = [
  { label: 'Specific Email', value: 'email' },
  { label: 'Department Manager (static)', value: 'department' },
  { label: "Requestor's Department Manager", value: 'requestor_department' },
  { label: 'Requestor (Created By)', value: 'created_by' },
  { label: 'Employee (custom hook)', value: 'employee' },
  { label: 'Document Department Field (dynamic routing)', value: 'document_department_field' },
  { label: 'Form Field Email (reads email from source document field)', value: 'form_field_email' },
  {
    label: "Workflow Field Email (reads email from current step's custom field response)",
    value: 'workflow_field_email',
  },
  {
    label: 'Store Department Manager (reads manager from store-department relationship)',
    value: 'store_department_field',
  },
  {
    label: "Custom Field Department (routes via a prior step's classified option)",
    value: 'workflow_custom_field_department',
  },
]

const ApproverResolutionFields: Field[] = [
  {
    name: 'approver_type',
    type: 'select',
    label: 'Approver Type',
    options: APPROVER_TYPE_OPTIONS,
    admin: {
      description:
        '"Document Department Field" reads the linked document payload to dynamically resolve the department and its manager.',
    },
  },
  {
    name: 'approver_email',
    type: 'email',
    admin: { condition: (_, s) => s?.approver_type === 'email' },
  },
  {
    name: 'department',
    type: 'relationship',
    relationTo: 'departments',
    filterOptions: filterByOperator,
    admin: { condition: (_, s) => s?.approver_type === 'department' },
  },
  {
    name: 'document_department_field_path',
    type: 'text',
    label: 'Document Department Field Path',
    admin: {
      condition: (_, s) => s?.approver_type === 'document_department_field',
      description:
        'Dot-notation path on the linked document that holds a Department relationship (e.g. "assigned_department"). The engine will fetch that department\'s manager_email at runtime.',
    },
  },
  {
    name: 'approver_form_field_path',
    type: 'text',
    label: 'Form Field Path (email)',
    admin: {
      condition: (_, s) => s?.approver_type === 'form_field_email',
      description:
        'Dot-notation path on the source document whose value is the reviewer\'s email address (e.g. "manager_email").',
    },
  },
  {
    name: 'approver_workflow_field_name',
    type: 'text',
    label: 'Workflow Field Name (email)',
    admin: {
      condition: (_, s) => s?.approver_type === 'workflow_field_email',
      description:
        "Name of the custom field (from this step or a prior step) whose value is the next reviewer's email address.",
    },
  },
  {
    name: 'approver_store_department_field_path',
    type: 'text',
    label: 'Store Department Field Path',
    admin: {
      condition: (_, s) => s?.approver_type === 'store_department_field',
      description:
        'Dot-notation path on the source document that holds a Store Department relationship (e.g. "department"). The engine fetches that department\'s manager email at runtime.',
    },
  },
  {
    name: 'approver_custom_field_name',
    type: 'text',
    label: 'Custom Field Name',
    admin: {
      condition: (_, s) => s?.approver_type === 'workflow_custom_field_department',
      description:
        'Name of the select custom field (from a prior step) whose selected option has a related_department mapped.',
    },
  },
  {
    name: 'approver_custom_field_step_slug',
    type: 'text',
    label: 'Source Step Slug (optional)',
    admin: {
      condition: (_, s) => s?.approver_type === 'workflow_custom_field_department',
      description:
        'Slug of the step whose custom field response to read. Leave empty to search all prior steps (most recent wins).',
    },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Response field blocks — before-response fields are always shown to the
// reviewer while deciding; after-response fields are shown only once the
// matching response is chosen, and are conditioned on the matching capability.
// ─────────────────────────────────────────────────────────────────────────────

const ResponseFieldsBlock = (
  name: string,
  label: string,
  condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean,
): Field => ({
  name,
  type: 'blocks',
  label,
  blocks: WorkflowFieldBlocksWithRef,
  admin: {
    condition,
    description: 'Fields shown to the reviewer. Can reference a Global Custom Field via the "Global Field Reference" block.',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Workflow V2 Collection
// ─────────────────────────────────────────────────────────────────────────────

export const WorkflowV2: CollectionConfig = {
  slug: SLUG,
  labels: { singular: 'Workflow V2', plural: 'Workflows V2' },
  disableDuplicate: false,
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    listSearchableFields: ['name', 'slug'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'operator',
      type: 'relationship',
      relationTo: 'operators',
      required: true,
      label: 'Operator',
    },
    // ── Completion/rejection global notifications ─────────────────────────
    {
      type: 'row',
      fields: [
        {
          type: 'checkbox',
          name: 'notify_on_complete',
          label: 'Notify on Completion',
          defaultValue: true,
        },
        {
          type: 'checkbox',
          name: 'notify_on_update',
          label: 'Notify on Update',
          defaultValue: true,
        },
        {
          type: 'checkbox',
          name: 'notify_on_reject',
          label: 'Notify on Reject',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'approval_notifications',
      type: 'array',
      label: 'On Workflow Completion Notifications',
      admin: {
        components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
        description: 'Notify these recipients when the entire workflow reaches "completed".',
      },
      fields: [...NotificationRecipientFields],
    },
    {
      name: 'rejection_notifications',
      type: 'array',
      label: 'On Workflow Rejection Notifications',
      admin: {
        components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
        description: 'Notify these recipients when the entire workflow is rejected.',
      },
      fields: [...NotificationRecipientFields],
    },
    // ── Save hint ─────────────────────────────────────────────────────────
    {
      name: 'save_hint',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/common/components/helper-text',
            clientProps: { description: 'Please SAVE first before adding steps.' },
          },
        },
        condition: (data) => !data?.id,
      },
    },
    // ── Global custom fields (shared across steps, referenced via a
    //    "Global Field Reference" block inside a step's response fields) ────
    {
      name: 'global_custom_fields',
      type: 'blocks',
      label: 'Global Workflow Custom Fields',
      blocks: WorkflowFieldBlocksBase,
      admin: {
        description:
          'Fields reusable across multiple steps. Reference one from a step\'s response fields via the "Global Field Reference" block.',
      },
    },
    // ── Steps ─────────────────────────────────────────────────────────────
    {
      name: 'steps',
      type: 'array',
      admin: {
        components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Human-readable step name, e.g. "Department Manager Approval"' },
        },
        ...Slug(false, { watchPath: 'label', insideArray: true, watchPrefix: 'operator_slug' }),
        // ── Approvers (everyone here shares the capabilities/fields below) ──
        {
          name: 'approvers',
          type: 'array',
          label: 'Approvers',
          minRows: 1,
          admin: {
            components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
            description:
              'Everyone in this list can independently act on this step via their own token/link, sharing the same capabilities and before/after-response fields defined below for this step.',
          },
          fields: ApproverResolutionFields,
        },
        // ── Misc step flags ───────────────────────────────────────────────
        {
          name: 'final_approval',
          type: 'checkbox',
          defaultValue: false,
          label: 'Final Approval Step',
          admin: {
            description: 'Users at this step can create/update forms after the monthly cutoff day.',
          },
        },
        {
          name: 'auto_complete',
          type: 'checkbox',
          defaultValue: false,
          label: 'Auto Complete Step',
          admin: {
            description:
              'Automatically complete this step when reached (no human action required).',
          },
        },
        // ── Skip condition (V2: reads document payload OR prior step fields) ─
        ...SkipConditionFields,
        // ── Rejection routing (V2: supports loops) ─────────────────────────
        ...RejectionRoutingFields,
        // ── Notifications per step ─────────────────────────────────────────
        {
          name: 'on_reaching_notifications',
          type: 'array',
          label: 'On Reaching This Step',
          admin: {
            components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
          },
          fields: [...NotificationRecipientFields],
        },
        {
          name: 'on_approval_notifications',
          type: 'array',
          label: 'On Step Approved/Acknowledged',
          admin: {
            components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
          },
          fields: [...NotificationRecipientFields],
        },
        {
          name: 'on_rejection_notifications',
          type: 'array',
          label: 'On Step Rejected',
          admin: {
            components: { RowLabel: { path: './collections/workflow/components/array-row-label' } },
          },
          fields: [...NotificationRecipientFields],
        },
        ...WorkflowEmailSettingsFields,
        ...WorkflowActionFields,
        // ── Response fields (shared by every approver in this step) ────────
        ResponseFieldsBlock('before_response_fields', 'Before Response Fields'),
        ResponseFieldsBlock(
          'after_response_approved_fields',
          'After Response: Approved',
          (_, s) => !!s?.can_approve,
        ),
        ResponseFieldsBlock(
          'after_response_rejected_fields',
          'After Response: Rejected',
          (_, s) => !!s?.can_reject,
        ),
        ResponseFieldsBlock(
          'after_response_acknowledged_fields',
          'After Response: Acknowledged (Confirm)',
          (_, s) => !!s?.can_acknowledge,
        ),
      ],
    },
    CreatedByField,
    UpdatedByField,
    ...Slug(true, { watchPath: 'name', insideArray: false }),
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    beforeValidate: [setOperatorSlugCollection('slug')],
    afterChange: [workflowV2AfterChange, auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}
