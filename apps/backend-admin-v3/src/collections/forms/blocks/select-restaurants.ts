import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { Block } from 'payload'

const SelectRestaurantsBlock: Block & { label: string } = {
  slug: 'select-restaurants',
  interfaceName: `SelectRestaurantsBlock`,
  labels: { plural: 'Select Restaurants', singular: 'Select Restaurant' },
  label: 'Select Restaurant',
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
      relationTo: 'restaurants',
      hasMany: true,
      admin: {
        condition: (data, siblingData) => !siblingData?.add_all,
      },
    },
  ],
}

export default SelectRestaurantsBlock
