import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectStoreDepartmentsFieldBlock: Block = {
  slug: 'select-store-departments',
  interfaceName: 'WorkflowSelectStoreDepartmentsFieldBlock',
  labels: { singular: 'Select Store Departments', plural: 'Select Store Departments' },
  fields: [
    ...WorkflowFieldBaseFields,
    { name: 'add_all', type: 'checkbox', label: 'Add all items', defaultValue: false },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'store-departments',
      hasMany: true,
      admin: { condition: (_, s) => !s?.add_all },
    },
  ],
}

export default SelectStoreDepartmentsFieldBlock
