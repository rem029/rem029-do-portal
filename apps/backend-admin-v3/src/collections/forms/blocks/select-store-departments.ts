import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const SelectStoreDepartmentsBlock: Block & { label: string } = {
  slug: 'select-store-departments',
  interfaceName: 'SelectStoreDepartmentsBlock',
  labels: { plural: 'Select Store Departments', singular: 'Select Store Department' },
  label: 'Select Store Department',
  fields: [
    ...DEFAULT_FORM_CHILD_FIELDS,
    {
      name: 'add_all',
      type: 'checkbox',
      label: 'Add all items',
      defaultValue: false,
    },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'store-departments',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => !siblingData?.add_all,
      },
    },
  ],
}

export default SelectStoreDepartmentsBlock
