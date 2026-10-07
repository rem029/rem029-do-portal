import type { Block } from 'payload'
import getFields from '../fields'

export const BlockText: Block = {
  slug: 'text',
  interfaceName: 'BlockText',
  labels: { plural: 'Texts', singular: 'Text' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [...getFields([{ type: 'label' }])],
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
