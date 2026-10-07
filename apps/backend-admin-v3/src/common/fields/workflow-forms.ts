import { accessCheck, Slugs } from '@/utilities/access'
import { Field } from 'payload'
import { User } from '@/payload-types'

/**
 * Workflow fields for collections that do NOT have an associated settings global
 * (e.g. form-submissions).
 *
 * Differences from WorkflowFields:
 * - The `comments`, `response`, and `signature` review sub-fields omit the
 *   time-based-cutoff access check because there is no `<slug>-settings` global
 *   to query. Those fields are still writable by super_users via the admin UI;
 *   normal workflow progression happens through the token-based service review
 *   page which uses `overrideAccess: true`.
 */
export const WorkflowFormsFields: (slug: Slugs) => Field[] = (slug) => [
  // Workflow Related Fields Below
  {
    name: 'workflow_reviews_ui',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Field: '@/common/components/workflow-admin',
      },
    },
  },
  {
    type: 'select',
    name: 'workflow_status',
    label: 'Workflow Status',
    defaultValue: 'draft',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'In Review', value: 'in_review' },
      { label: 'Completed', value: 'completed' },
      { label: 'Rejected', value: 'rejected' },
    ],
    admin: {
      position: 'sidebar',
      description: 'Current status.',
      condition: (data) => !!data?.workflow_status && data.workflow_status !== 'draft',
    },
    access: {
      update: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
      read: () => true,
      create: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
    },
  },
  {
    type: 'text',
    name: '_workflow_status',
    label: 'Workflow Status',
    defaultValue: 'draft',
    admin: {
      position: 'sidebar',
      description: 'Current Workflow status of the request.',
      condition: (_, __, { user }) => (user as User)?.super_user || false,
    },
    access: {
      update: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
      read: () => true,
      create: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
    },
  },
  {
    type: 'relationship',
    name: 'operator',
    label: 'Operator',
    relationTo: 'operators',
    admin: {
      position: 'sidebar',
      description: 'Operator assigned to this request.',
    },
    access: {
      update: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
      read: () => true,
      create: async ({ req }) =>
        (await accessCheck(slug, 'super_user', {
          fallbackAccess: false,
          reqOverride: req,
        })) as boolean,
    },
  },
  {
    type: 'array',
    name: 'workflow_reviews',
    label: 'Reviews',
    interfaceName: 'WorkflowReviews',
    labels: { plural: 'Reviews', singular: 'Review' },
    admin: {
      condition: (data) => data?._workflow_status && data?._workflow_status !== 'draft',
      hidden: true,
    },
    fields: [
      { type: 'text', name: 'label', label: 'Label', admin: { readOnly: true } },
      {
        type: 'textarea',
        name: 'comments',
        label: 'Comments',
        // No time-based access: reviews are handled via token-based service page with overrideAccess
      },
      { type: 'text', name: 'reviewer', label: 'Reviewer', admin: { readOnly: true } },
      {
        type: 'text',
        name: 'status_slug',
        label: 'Status Slug',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
        access: {
          read: () => true,
        },
      },
      {
        type: 'select',
        name: 'response',
        label: 'Response',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Skipped', value: 'skipped' },
          { label: 'Auto-Completed', value: 'auto_completed' },
          { label: 'Acknowledged', value: 'acknowledged' },
        ],
        // No time-based access: reviews are handled via token-based service page with overrideAccess
      },
      {
        type: 'text',
        name: 'reviewed_by',
        label: 'Reviewed By',
        admin: { readOnly: true },
      },
      {
        type: 'date',
        name: 'reviewed_at',
        label: 'Reviewed At',
        admin: { readOnly: true },
      },
      {
        type: 'textarea',
        name: 'signature',
        label: 'Signature',
        // No time-based access: reviews are handled via token-based service page with overrideAccess
      },
      {
        type: 'text',
        name: 'token',
        label: 'Token',
        admin: {
          condition: (_, __, { user }) => (user as User)?.super_user || false,
          readOnly: true,
        },
      },
      {
        type: 'text',
        name: 'approver_type',
        label: 'Approver Type',
        admin: {
          condition: (_, __, { user }) => (user as User)?.super_user || false,
          readOnly: true,
        },
      },
      {
        name: 'can_acknowledge',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Acknowledge',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'can_approve',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Approve',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'can_reject',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Reject',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'can_attach',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Attach',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'can_generate_wordfile',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Generate Word File',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'enable_comment',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Comment',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'enable_signature',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Signature',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'attachment_label',
        type: 'text',
        label: 'Attachment Label',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'attachments',
        type: 'upload',
        relationTo: 'internal-media',
        hasMany: true,
        label: 'Attachments',
        admin: {
          condition: (data, siblingData) => siblingData?.can_attach,
        },
      },
      {
        name: 'acknowledge_label',
        type: 'text',
        defaultValue: 'Acknowledge',
        label: 'Acknowledge Label',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'approve_label',
        type: 'text',
        defaultValue: 'Approve',
        label: 'Approve Label',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'reject_label',
        type: 'text',
        defaultValue: 'Reject',
        label: 'Reject Label',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'auto_complete',
        type: 'checkbox',
        defaultValue: false,
        label: 'Auto Complete',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'hide_history',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide History',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'hide_details',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Details',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'hide_description',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Description',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'hide_attachments',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Attachments',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'custom_email_text',
        type: 'text',
        label: 'Custom Email Text',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'hide_email_actions',
        type: 'checkbox',
        defaultValue: false,
        label: 'Hide Email Actions',
        admin: {
          readOnly: true,
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'additional_reviewer_tokens',
        type: 'json',
        label: 'Additional Reviewer Tokens',
        admin: {
          readOnly: true,
          description:
            'Tokens for additional email recipients that have approve/reject/acknowledge permissions.',
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'custom_fields_definition',
        type: 'json',
        label: 'Custom Fields Definition',
        admin: {
          readOnly: true,
          description:
            'Custom fields configured for this step (copied from workflow at init time).',
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'custom_field_responses',
        type: 'json',
        label: 'Custom Field Responses',
        admin: {
          readOnly: true,
          description: 'Reviewer-supplied values for the custom fields at this step.',
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
      {
        name: 'skip_condition',
        type: 'json',
        label: 'Skip Condition',
        admin: {
          readOnly: true,
          description: 'Auto-skip condition for this step (copied from workflow at init time).',
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
      },
    ],
  },
]
