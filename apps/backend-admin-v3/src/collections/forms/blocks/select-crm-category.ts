import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const SelectCrmCategoryBlock: Block & { label: string } = {
  slug: 'select-crm-category',
  interfaceName: 'SelectCrmCategoryBlock',
  labels: { plural: 'Select CRM Categories', singular: 'Select CRM Category' },
  label: 'Select CRM Category',
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
      relationTo: 'crm-categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => !siblingData?.add_all,
      },
    },
  ],
}

export default SelectCrmCategoryBlock
