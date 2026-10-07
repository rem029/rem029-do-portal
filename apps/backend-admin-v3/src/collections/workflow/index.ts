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

const SLUG = 'workflow'

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
  {
    name: 'custom_email_text',
    type: 'textarea',
    label: 'Custom Email Text',
  },
]

const filterByOperator: FilterOptions = ({ data }) => {
  const operator = data?.operator
  if (operator) {
    return {
      operator: {
        equals: typeof operator === 'object' ? operator.id : operator,
      },
    }
  }
  return true
}

const WorkflowNotificationRecipientFields: Field[] = [
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
    ],
  },
  {
    name: 'email',
    type: 'email',
    admin: { condition: (_, siblingData) => siblingData?.type === 'email' },
  },
  {
    name: 'department',
    type: 'relationship',
    relationTo: 'departments',
    admin: { condition: (_, siblingData) => siblingData?.type === 'department' },
    filterOptions: filterByOperator,
  },
  {
    name: 'form_field_path',
    type: 'text',
    admin: {
      hidden: true,
    },
  },
  {
    name: 'form_field_label',
    type: 'text',
    admin: {
      hidden: true,
    },
  },
  {
    name: 'form_field_form_id',
    type: 'text',
    admin: {
      hidden: true,
    },
  },
  {
    name: 'form_field_form_title',
    type: 'text',
    admin: {
      hidden: true,
    },
  },
  {
    name: 'form_field_selector',
    type: 'ui',
    admin: {
      condition: (_, siblingData) => siblingData?.type === 'form_email',
      components: {
        Field: {
          path: './collections/workflow/components/form-email-field-select',
        },
      },
    },
  },
  ...WorkflowEmailSettingsFields,
]

const WorkflowActionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'can_acknowledge',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Acknowledge',
        admin: { width: '33%' },
      },
      {
        name: 'can_approve',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Approve',
        admin: { width: '33%' },
      },
      {
        name: 'can_reject',
        type: 'checkbox',
        defaultValue: true,
        label: 'Can Reject',
        admin: { width: '33%' },
      },
      {
        name: 'can_attach',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Attach',
        admin: { width: '33%' },
      },
      {
        name: 'can_generate_wordfile',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Generate Word File',
        admin: { width: '33%' },
      },
      {
        name: 'enable_comment',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Comment',
        admin: { width: '33%' },
      },
      {
        name: 'enable_signature',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Signature',
        admin: { width: '33%' },
      },

      {
        name: 'can_skip',
        type: 'checkbox',
        defaultValue: false,
        label: 'Can Skip',
        admin: { width: '33%' },
      },
    ],
  },
  {
    name: 'attachment_label',
    type: 'text',
    label: 'Attachment Label',
    admin: {
      condition: (_: any, siblingData: any) => siblingData?.can_attach,
    },
  },
  {
    name: 'acknowledge_label',
    type: 'text',
    defaultValue: 'Acknowledge',
    label: 'Acknowledge Label',
    admin: {
      condition: (_: any, siblingData: any) => siblingData?.can_acknowledge,
    },
  },
  {
    name: 'approve_label',
    type: 'text',
    defaultValue: 'Approve',
    label: 'Approve Label',
    admin: {
      condition: (_: any, siblingData: any) => siblingData?.can_approve,
    },
  },
  {
    name: 'reject_label',
    type: 'text',
    defaultValue: 'Reject',
    label: 'Reject Label',
    admin: {
      condition: (_: any, siblingData: any) => siblingData?.can_reject,
    },
  },
  {
    name: 'skip_label',
    type: 'text',
    defaultValue: 'Skip',
    label: 'Skip Label',
    admin: {
      condition: (_: any, siblingData: any) => siblingData?.can_skip,
    },
  },
]

export const Workflow: CollectionConfig = {
  slug: SLUG,
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    listSearchableFields: ['name'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'relationship',
      required: true,
      name: 'operator',
      label: 'Operator',
      relationTo: 'operators',
    },
    {
      type: 'row',
      fields: [
        {
          type: 'checkbox',
          name: 'notify_on_complete',
          label: 'Should Notify on Completion ',
          defaultValue: true,
        },
        {
          type: 'checkbox',
          name: 'notify_on_update',
          label: 'Should Notify on Update ',
          defaultValue: true,
        },
        {
          type: 'checkbox',
          name: 'notify_on_reject',
          label: 'Should Notify on Reject ',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'approval_notifications',
      type: 'array',
      label: 'On Approval Notifications',
      admin: {
        components: {
          RowLabel: { path: './collections/workflow/components/array-row-label' },
        },
        description: 'Notify these recipients when workflow status becomes completed.',
      },
      fields: [...WorkflowNotificationRecipientFields],
    },
    {
      name: 'rejection_notifications',
      type: 'array',
      label: 'On Rejection Notifications',
      admin: {
        components: {
          RowLabel: { path: './collections/workflow/components/array-row-label' },
        },
        description: 'Notify these recipients when workflow status becomes rejected.',
      },
      fields: [...WorkflowNotificationRecipientFields],
    },
    {
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/common/components/helper-text',
            clientProps: { description: 'Please SAVE to proceed' },
          },
        },
        condition: (data) => {
          return !data?.id
        },
      },
      name: 'description',
    },
    {
      name: 'global_custom_fields',
      type: 'array',
      label: 'Global Workflow Custom Fields',
      admin: {
        components: {
          RowLabel: { path: './collections/workflow/components/array-row-label' },
        },
        description:
          'Define fields that can be reused across any step in this workflow. Select them per step in the "Selected Global Fields" section.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Field Name (key)',
              required: true,
              admin: {
                description: 'e.g. days_approved — must be unique across the workflow',
              },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Display Label',
            },
            {
              name: 'type',
              type: 'select',
              label: 'Field Type',
              defaultValue: 'text',
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Select', value: 'select' },
              ],
            },
          ],
        },
        {
          name: 'options',
          type: 'array',
          label: 'Select Options',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'select',
            description: 'Options for the select field.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Label',
                  admin: { width: '50%' },
                },
                {
                  name: 'value',
                  type: 'text',
                  label: 'Value',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'required',
              type: 'checkbox',
              defaultValue: false,
              label: 'Required',
            },
            {
              name: 'default_value',
              type: 'text',
              label: 'Default Value',
            },
          ],
        },
        {
          name: 'conditions',
          type: 'array',
          label: 'Visibility Conditions',
          admin: {
            description: 'Define conditions that must be met for this field to be visible.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'field',
                  type: 'text',
                  label: 'Field (key)',
                  required: true,
                },
                {
                  name: 'operator',
                  type: 'select',
                  label: 'Operator',
                  defaultValue: 'equals',
                  options: [
                    { label: 'Equals', value: 'equals' },
                    { label: 'Not Equals', value: 'not_equals' },
                  ],
                },
                {
                  name: 'value',
                  type: 'text',
                  label: 'Value',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      admin: {
        components: {
          RowLabel: { path: './collections/workflow/components/array-row-label' },
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'eg. Approved, Approved by HR, Pending, Pending with HR, Rejected by HR',
          },
        },
        ...Slug(false, {
          watchPath: 'label',
          insideArray: true,
          watchPrefix: 'operator_slug',
        }),
        {
          name: 'approver_type',
          type: 'select',
          options: [
            { label: 'Specific Email', value: 'email' },
            { label: 'Department Manager', value: 'department' },
            { label: 'Requestor Department Manager', value: 'requestor_department' },
            { label: 'Requestor (Created By)', value: 'created_by' },
            { label: 'Employee', value: 'employee' },
          ],
        },
        {
          name: 'approver_email',
          type: 'email',
          admin: { condition: (_, siblingData) => siblingData?.approver_type === 'email' },
        },
        {
          name: 'department',
          type: 'relationship',
          relationTo: 'departments',
          admin: { condition: (_, siblingData) => siblingData?.approver_type === 'department' },
          filterOptions: filterByOperator,
        },
        {
          name: 'rejectionPolicy',
          type: 'select',
          defaultValue: 'start',
          admin: { readOnly: true, description: 'Rejection policy is not handled for now.' },
          options: [
            { label: 'Reset to Start', value: 'start' },
            { label: 'Go Back 1 Step', value: 'previous' },
          ],
        },
        {
          name: 'final_approval',
          type: 'checkbox',
          defaultValue: false,
          label: 'Final Approval Step',
          admin: {
            description: 'Users at this step can create/update forms after the monthly cutoff day',
          },
        },
        {
          name: 'auto_complete',
          type: 'checkbox',
          defaultValue: false,
          label: 'Auto Complete Step',
          admin: {
            description: 'Automatically move to the next step when this stage is reached.',
          },
        },
        {
          name: 'selected_global_fields',
          type: 'array',
          label: 'Selected Global Fields',
          admin: {
            components: {
              RowLabel: { path: './collections/workflow/components/array-row-label' },
            },
            description:
              'Select global fields to display in this step. Use the "Field Name (key)" defined in the Global Workflow Custom Fields section.',
          },
          fields: [
            {
              name: 'field_name',
              type: 'text',
              label: 'Global Field Name (key)',
              required: true,
            },
          ],
        },
        {
          name: 'custom_fields',
          type: 'array',
          label: 'Custom Step Fields',
          admin: {
            components: {
              RowLabel: { path: './collections/workflow/components/array-row-label' },
            },
            description:
              'Define extra fields to collect from the reviewer at this step. Values are saved per step and the latest value per field name is surfaced as additional info.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: 'Field Name (key)',
                  required: true,
                  admin: {
                    width: '33%',
                    description:
                      'e.g. days_approved — must be unique across steps to carry forward',
                  },
                },
                {
                  name: 'label',
                  type: 'text',
                  label: 'Display Label',
                  admin: { width: '33%' },
                },
                {
                  name: 'type',
                  type: 'select',
                  label: 'Field Type',
                  defaultValue: 'text',
                  options: [
                    { label: 'Text', value: 'text' },
                    { label: 'Number', value: 'number' },
                    { label: 'Select', value: 'select' },
                  ],
                  admin: { width: '34%' },
                },
              ],
            },
            {
              name: 'options',
              type: 'array',
              label: 'Select Options',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'select',
                description: 'Options for the select field.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      label: 'Label',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'value',
                      type: 'text',
                      label: 'Value',
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'required',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Required',
                  admin: { width: '50%' },
                },
                {
                  name: 'default_value',
                  type: 'text',
                  label: 'Default Value',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'conditions',
              type: 'array',
              label: 'Visibility Conditions',
              admin: {
                description: 'Define conditions that must be met for this field to be visible.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'field',
                      type: 'text',
                      label: 'Field (key)',
                      required: true,
                    },
                    {
                      name: 'operator',
                      type: 'select',
                      label: 'Operator',
                      defaultValue: 'equals',
                      options: [
                        { label: 'Equals', value: 'equals' },
                        { label: 'Not Equals', value: 'not_equals' },
                      ],
                    },
                    {
                      name: 'value',
                      type: 'text',
                      label: 'Value',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'skip_condition',
          type: 'group',
          label: 'Auto-Skip Condition',
          admin: {
            description:
              "If all conditions match (based on a prior step's custom field response), this step will be automatically skipped.",
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable Auto-Skip',
            },
            {
              name: 'field_name',
              type: 'text',
              label: 'Custom Field Name',
              admin: {
                condition: (_, siblingData) => !!siblingData?.enabled,
                description: 'The custom field name from a prior step to check against.',
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
              admin: {
                condition: (_, siblingData) => !!siblingData?.enabled,
              },
            },
            {
              name: 'value',
              type: 'text',
              label: 'Compare Value',
              admin: {
                condition: (_, siblingData) =>
                  !!siblingData?.enabled &&
                  siblingData?.operator !== 'is_empty' &&
                  siblingData?.operator !== 'is_not_empty',
                description: 'The value to compare the custom field response against.',
              },
            },
          ],
        },
        {
          name: 'on_reaching_notifications',
          type: 'array',
          label: 'On Reaching This Step Notifications',
          admin: {
            components: {
              RowLabel: { path: './collections/workflow/components/array-row-label' },
            },
            description: 'Notify these recipients when this step is reached.',
          },
          fields: [...WorkflowNotificationRecipientFields],
        },
        {
          name: 'on_approval_notifications',
          type: 'array',
          label: 'On Step Approval Notifications',
          admin: {
            components: {
              RowLabel: { path: './collections/workflow/components/array-row-label' },
            },
            description: 'Notify these recipients when this step is approved or acknowledged.',
          },
          fields: [...WorkflowNotificationRecipientFields],
        },
        {
          name: 'on_rejection_notifications',
          type: 'array',
          label: 'On Step Rejection Notifications',
          admin: {
            components: {
              RowLabel: { path: './collections/workflow/components/array-row-label' },
            },
            description: 'Notify these recipients when this step is rejected.',
          },
          fields: [...WorkflowNotificationRecipientFields],
        },
        ...WorkflowEmailSettingsFields,
        ...WorkflowActionFields,
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
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}
