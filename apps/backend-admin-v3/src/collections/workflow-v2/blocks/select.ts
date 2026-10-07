import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectFieldBlock: Block = {
  slug: 'select',
  interfaceName: 'WorkflowSelectFieldBlock',
  labels: { singular: 'Select Field', plural: 'Select Fields' },
  fields: [
    ...WorkflowFieldBaseFields,
    {
      name: 'options',
      type: 'array',
      label: 'Options',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Label', admin: { width: '50%' } },
            { name: 'value', type: 'text', label: 'Value', admin: { width: '50%' } },
          ],
        },
        {
          name: 'related_type',
          type: 'select',
          label: 'Route To (optional)',
          options: [
            { label: 'CRM Category', value: 'crm_category' },
            { label: 'Store Department', value: 'store_department' },
            { label: 'Department', value: 'department' },
            { label: 'User', value: 'user' },
            { label: 'Specific Email', value: 'email' },
          ],
          admin: {
            description: 'When this option is selected, route the next step reviewer to this target.',
          },
        },
        {
          name: 'related_department',
          type: 'relationship',
          relationTo: 'store-departments',
          label: 'Store Department',
          admin: { condition: (_, s) => s?.related_type === 'store_department', appearance: 'drawer' },
        },
        {
          name: 'related_crm_category',
          type: 'relationship',
          relationTo: 'crm-categories',
          label: 'CRM Category',
          admin: { condition: (_, s) => s?.related_type === 'crm_category', appearance: 'drawer' },
        },
        {
          name: 'related_dept',
          type: 'relationship',
          relationTo: 'departments',
          label: 'Department',
          admin: { condition: (_, s) => s?.related_type === 'department', appearance: 'drawer' },
        },
        {
          name: 'related_user',
          type: 'relationship',
          relationTo: 'users',
          label: 'User',
          admin: { condition: (_, s) => s?.related_type === 'user', appearance: 'drawer' },
        },
        {
          name: 'related_email',
          type: 'email',
          label: 'Email Address',
          admin: { condition: (_, s) => s?.related_type === 'email' },
        },
      ],
    },
  ],
}

export default SelectFieldBlock
