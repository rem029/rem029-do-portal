import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { workflowInstanceUpdate } from '@/collections/workflow-v2/hooks/before-change'
import { workflowInstanceAfterChange } from './hooks/after-change'
import { User } from '@/payload-types'
import { accessCheckResolver, AccessAdmin, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { CollectionConfig } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const SLUG = 'workflow-instances'

/**
 * Workflow Instances — Execution Collection (V2)
 *
 * Each record represents a single running execution of a Workflow V2 blueprint
 * tied to a specific source document (any collection).
 *
 * Key design decisions:
 *  - The source document is referenced polymorphically via `document_collection` + `document_id`.
 *  - Once an instance is active (status !== 'pending'), the source document is considered
 *    locked. The locking is enforced via the `workflow-lock` utility which is called from
 *    the source collection's `access.update` resolver.
 *  - All approval history lives here (in `reviews`), keeping the source document clean.
 *  - The `case_owner` field tracks who is responsible for customer-facing communication,
 *    separate from the per-step approver.
 */
export const WorkflowInstances: CollectionConfig = {
  slug: SLUG,
  labels: { singular: 'Instance', plural: 'Instances' },
  disableDuplicate: true,
  admin: {
    useAsTitle: 'title',
    group: 'Workflow V2',
    defaultColumns: [
      'title',
      'document_collection',
      'status',
      'current_step_label',
      'workflow_v2',
      'operator',
      'createdAt',
    ],
    listSearchableFields: ['title', 'document_collection', 'document_id'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    components: {
      edit: {
        SaveButton: '@/collections/workflow-instances/components/workflow-instance-actions',
      },
    },
  },
  fields: [
    // ── Human-readable title (auto-generated or set by the triggering hook) ─
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        description: 'Auto-generated label, e.g. "Case #123 – CRM Workflow"',
        position: 'sidebar',
      },
    },
    // ── Operator / multi-tenancy ──────────────────────────────────────────
    {
      name: 'operator',
      type: 'relationship',
      relationTo: 'operators',
      required: true,
      label: 'Operator',
      admin: { position: 'sidebar' },
      access: {
        update: async ({ req }) => {
          const user = req.user as User
          return user?.super_user || false
        },
      },
    },
    // ── Blueprint reference ───────────────────────────────────────────────
    {
      name: 'workflow_v2',
      type: 'relationship',
      relationTo: 'workflow-v2',
      required: true,
      label: 'Workflow Blueprint',
      admin: {
        description: 'The Workflow V2 blueprint used to drive this instance.',
        position: 'sidebar',
        appearance: 'drawer',
      },
      access: {
        update: async ({ req }) => {
          const user = req.user as User
          return user?.super_user || false
        },
      },
    },
    // ── Source document link ──────────────────────────────────────────────
    {
      name: 'document_collection',
      type: 'text',
      required: true,
      label: 'Source Collection',
      admin: {
        description:
          'The Payload collection slug of the linked document (e.g. "cases", "form-submissions").',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'document_id',
      type: 'text',
      required: true,
      label: 'Source Document ID',
      admin: {
        description: 'The ID of the linked document in the source collection.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    // ── Overall status ────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Completed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Overall workflow status.',
      },
      access: {
        update: async ({ req }) => {
          const user = req.user as User
          return user?.super_user || false
        },
      },
    },
    // ── Internal step tracking ────────────────────────────────────────────
    {
      name: 'current_step',
      type: 'text',
      label: 'Current Step Slug',
      admin: {
        position: 'sidebar',
        description: 'Slug of the currently active workflow step.',
        condition: (_, __, { user }) => (user as User)?.super_user || false,
      },
      access: {
        update: async ({ req }) => {
          const user = req.user as User
          return user?.super_user || false
        },
      },
    },
    {
      name: 'current_step_label',
      type: 'text',
      label: 'Current Step',
      admin: {
        position: 'sidebar',
        description: 'Human-readable label of the currently active step.',
        condition: (_, __, { user }) => (user as User)?.super_user || false,
      },
      access: {
        update: async ({ req }) => {
          const user = req.user as User
          return user?.super_user || false
        },
      },
    },
    // ── Case Owner (responsible party for customer-facing comms) ─────────
    {
      name: 'case_owner',
      type: 'relationship',
      relationTo: 'users',
      label: 'Case Owner',
      admin: {
        position: 'sidebar',
        description:
          'The user responsible for this case (handles customer communication). Separate from the step approver.',
      },
    },
    // ── Review history (core of the instance) ────────────────────────────
    {
      name: 'reviews',
      type: 'array',
      label: 'Review History',
      admin: {
        description: 'Full audit trail of all step reviews for this workflow instance.',
        readOnly: true,
        components: {
          RowLabel: { path: './collections/workflow-instances/components/review-row-label' },
        },
      },
      fields: [
        { name: 'label', type: 'text', label: 'Step Label', admin: { readOnly: true } },
        { name: 'status_slug', type: 'text', label: 'Step Slug', admin: { readOnly: true } },
        {
          name: 'iteration',
          type: 'number',
          label: 'Iteration',
          defaultValue: 1,
          admin: { readOnly: true, description: 'Increments if this step is revisited (loop).' },
        },
        {
          name: 'response',
          type: 'select',
          label: 'Response',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Acknowledged', value: 'acknowledged' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Skipped', value: 'skipped' },
            { label: 'Auto-Completed', value: 'auto_completed' },
          ],
          defaultValue: 'pending',
        },
        { name: 'reviewer', type: 'text', label: 'Reviewer Email', admin: { readOnly: true } },
        { name: 'reviewed_by', type: 'text', label: 'Reviewed By', admin: { readOnly: true } },
        { name: 'reviewed_at', type: 'date', label: 'Reviewed At', admin: { readOnly: true } },
        { name: 'comments', type: 'textarea', label: 'Comments' },
        { name: 'signature', type: 'textarea', label: 'Signature' },
        {
          name: 'attachments',
          type: 'upload',
          relationTo: 'internal-media',
          hasMany: true,
          label: 'Attachments',
        },
        // Step capability flags (copied from blueprint at instance creation)
        {
          name: 'approver_type',
          type: 'text',
          label: 'Approver Type',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_acknowledge',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_approve',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_reject',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_attach',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_skip',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'can_generate_wordfile',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'enable_comment',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'enable_signature',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'auto_complete',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'token',
          type: 'text',
          label: 'Email Token',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        // Step labels
        {
          name: 'acknowledge_label',
          type: 'text',
          defaultValue: 'Acknowledge',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'approve_label',
          type: 'text',
          defaultValue: 'Approve',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'reject_label',
          type: 'text',
          defaultValue: 'Reject',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'skip_label',
          type: 'text',
          defaultValue: 'Skip',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'attachment_label',
          type: 'text',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        // Email display settings
        {
          name: 'hide_history',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'hide_details',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'hide_description',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'hide_attachments',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'hide_email_actions',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'custom_email_text',
          type: 'text',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        // Skip & rejection routing config (snapshotted from blueprint)
        {
          name: 'skip_condition',
          type: 'json',
          label: 'Skip Condition',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'rejection_policy',
          type: 'text',
          label: 'Rejection Policy',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'rejection_target_step',
          type: 'text',
          label: 'Rejection Target Step',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        // Custom field definitions and responses
        {
          name: 'custom_fields_definition',
          type: 'json',
          label: 'Custom Fields Definition',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'custom_field_responses',
          type: 'json',
          label: 'Custom Field Responses',
          admin: {
            readOnly: true,
            description: 'Reviewer-supplied values for custom fields at this step.',
          },
        },
        // ── New block-based field system (see workflow-v2 blueprint) ─────────
        {
          name: 'before_response_fields',
          type: 'json',
          label: 'Before-Response Fields (Config Snapshot)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
            description: 'Resolved block config snapshotted from the blueprint at instance creation.',
          },
        },
        {
          name: 'after_response_approved_fields',
          type: 'json',
          label: 'After-Response Fields: Approved (Config Snapshot)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'after_response_rejected_fields',
          type: 'json',
          label: 'After-Response Fields: Rejected (Config Snapshot)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'after_response_acknowledged_fields',
          type: 'json',
          label: 'After-Response Fields: Acknowledged (Config Snapshot)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'field_responses',
          type: 'json',
          label: 'Field Responses',
          admin: {
            readOnly: true,
            description:
              'Flat array of { name, label, value, blockType } — everything the reviewer submitted, before-phase and after-phase combined (no phase tag; merged by name, later entries win).',
          },
        },
        // Additional reviewer tokens for email-based approvals
        {
          name: 'additional_reviewer_tokens',
          type: 'json',
          label: 'Additional Reviewer Tokens',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        // Unified approver tokens — replaces the old primary/additional split.
        // One entry per resolved `approvers[]` entry from the blueprint step; no
        // entry is "the primary", every entry is an independent peer with its own
        // token. See workflow-instance.ts for the resolution logic.
        {
          name: 'reviewer_tokens',
          type: 'json',
          label: 'Reviewer Tokens',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
            description:
              'Array of { email, token, approver_type, response, reviewed_by, reviewed_at } — one per approver, each independently actionable.',
          },
        },
        // Dynamic reviewer resolution fields (snapshotted from blueprint)
        {
          name: 'approver_form_field_path',
          type: 'text',
          label: 'Form Field Path (email)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'approver_workflow_field_name',
          type: 'text',
          label: 'Workflow Field Name (email)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'approver_custom_field_name',
          type: 'text',
          label: 'Custom Field Name (dept)',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'approver_custom_field_step_slug',
          type: 'text',
          label: 'Custom Field Source Step',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
      ],
    },
    // ── Notification view tokens (top-level, one entry per notified email) ──
    {
      name: 'notification_tokens',
      type: 'json',
      label: 'Notification View Tokens',
      admin: {
        readOnly: true,
        condition: (_, __, { user }) => (user as User)?.super_user || false,
      },
    },
    // ── Event Logs (append-only audit timeline) ───────────────────────────
    {
      name: 'event_logs',
      type: 'array',
      label: 'Event Logs',
      admin: {
        readOnly: true,
        components: {
          RowLabel: {
            path: './collections/workflow-instances/components/event-log-row-label',
          },
        },
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Responded', value: 'responded' },
            { label: 'Auto-skipped', value: 'auto_skipped' },
            { label: 'Loop Back', value: 'loop_back' },
            { label: 'Completed', value: 'completed' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Notification Sent', value: 'notification_sent' },
            { label: 'Reassigned', value: 'reassigned' },
            { label: 'Blueprint Synced', value: 'blueprint_synced' },
          ],
          admin: { readOnly: true },
        },
        {
          name: 'timestamp',
          type: 'date',
          label: 'Timestamp',
          admin: { readOnly: true, date: { displayFormat: 'dd MMM yyyy, HH:mm' } },
        },
        {
          name: 'actor',
          type: 'text',
          label: 'Actor',
          admin: { readOnly: true, description: 'Email address or "system"' },
        },
        {
          name: 'step_label',
          type: 'text',
          label: 'Step',
          admin: { readOnly: true },
        },
        {
          name: 'step_slug',
          type: 'text',
          label: 'Step Slug',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
        {
          name: 'details',
          type: 'json',
          label: 'Details',
          admin: {
            readOnly: true,
            condition: (_, __, { user }) => (user as User)?.super_user || false,
          },
        },
      ],
    },
    // ── Metadata ─────────────────────────────────────────────────────────
    CreatedByField,
    UpdatedByField,
    {
      name: 'operator_slug',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (_, __, { user }) => (user as User)?.super_user || false,
      },
    },
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
    delete: accessCheckResolver(SLUG, 'delete', { fallbackAccess: false }),
  },
  hooks: {
    beforeChange: [workflowInstanceUpdate, setUserCreatedOrUpdatedByCollection],
    beforeValidate: [setOperatorSlugCollection('operator_slug')],
    afterChange: [workflowInstanceAfterChange, auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}
