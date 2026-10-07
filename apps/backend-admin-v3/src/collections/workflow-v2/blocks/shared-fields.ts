import { Field } from 'payload'

export const WorkflowFieldBaseFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        label: 'Field Name (key)',
        admin: { width: '50%', description: 'e.g. rejection_reason' },
      },
      { name: 'label', type: 'text', label: 'Display Label', admin: { width: '50%' } },
    ],
  },
  { name: 'required', type: 'checkbox', defaultValue: false, label: 'Required' },
]
