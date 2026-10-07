import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectDepartmentsFieldBlock: Block = {
  slug: 'select-departments',
  interfaceName: 'WorkflowSelectDepartmentsFieldBlock',
  labels: { singular: 'Select Departments', plural: 'Select Departments' },
  fields: [
    ...WorkflowFieldBaseFields,
    { name: 'add_all', type: 'checkbox', label: 'Add all items', defaultValue: true },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: { condition: (_, s) => !s?.add_all },
    },
  ],
}

export default SelectDepartmentsFieldBlock
