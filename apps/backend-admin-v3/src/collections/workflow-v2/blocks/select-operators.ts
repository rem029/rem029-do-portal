import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectOperatorsFieldBlock: Block = {
  slug: 'select-operators',
  interfaceName: 'WorkflowSelectOperatorsFieldBlock',
  labels: { singular: 'Select Operators', plural: 'Select Operators' },
  fields: [
    ...WorkflowFieldBaseFields,
    { name: 'add_all', type: 'checkbox', label: 'Add all items', defaultValue: true },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'operators',
      hasMany: true,
      admin: { condition: (_, s) => !s?.add_all },
    },
  ],
}

export default SelectOperatorsFieldBlock
