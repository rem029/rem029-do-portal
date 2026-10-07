import type { Block } from 'payload'
import getFields from '../fields'

export const BlockButtons: Block = {
  slug: 'buttons',
  interfaceName: 'BlockButtons',
  labels: { plural: 'Buttons', singular: 'Button' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [...getFields([{ type: 'label' }, { type: 'link' }])],
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
