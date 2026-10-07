import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const SelectOperatorsBlock: Block & { label: string } = {
  slug: 'select-operators',
  interfaceName: `SelectOperatorsBlock`,
  labels: { plural: 'Select Operators', singular: 'Select Operator' },
  label: 'Select Operator',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      name: 'add_all',
      type: 'checkbox',
      label: 'Add all items',
      defaultValue: true,
    },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'operators',
      hasMany: true,
      admin: {
        condition: (data, siblingData) => !siblingData?.add_all,
      },
    },
  ],
}

export default SelectOperatorsBlock
