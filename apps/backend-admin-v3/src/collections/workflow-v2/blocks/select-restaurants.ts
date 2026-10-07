import { Block } from 'payload'
import { WorkflowFieldBaseFields } from './shared-fields'

const SelectRestaurantsFieldBlock: Block = {
  slug: 'select-restaurants',
  interfaceName: 'WorkflowSelectRestaurantsFieldBlock',
  labels: { singular: 'Select Restaurants', plural: 'Select Restaurants' },
  fields: [
    ...WorkflowFieldBaseFields,
    { name: 'add_all', type: 'checkbox', label: 'Add all items', defaultValue: true },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'restaurants',
      hasMany: true,
      admin: { condition: (_, s) => !s?.add_all },
    },
  ],
}

export default SelectRestaurantsFieldBlock
