import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectCrmCategoryFieldBlock: Block = {
  slug: 'select-crm-category',
  interfaceName: 'WorkflowSelectCrmCategoryFieldBlock',
  labels: { singular: 'Select CRM Categories', plural: 'Select CRM Categories' },
  fields: [
    ...WorkflowFieldBaseFields,
    { name: 'add_all', type: 'checkbox', label: 'Add all items', defaultValue: false },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'crm-categories',
      hasMany: true,
      admin: { condition: (_, s) => !s?.add_all },
    },
  ],
}

export default SelectCrmCategoryFieldBlock
