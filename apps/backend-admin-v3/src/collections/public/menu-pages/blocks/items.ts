import type { Block } from 'payload'
import getFields from '../fields'

export const BlockItems: Block = {
  slug: 'items',
  interfaceName: 'BlockItems',
  labels: { plural: 'Items', singular: 'Item' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [...getFields([{ type: 'title' }, { type: 'description' }])],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }])],
        },
      ],
    },
  ],
}
