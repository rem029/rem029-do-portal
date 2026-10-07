import type { Block } from 'payload'
import getFields from '../fields'

export const BlockText: Block = {
  slug: 'text',
  interfaceName: 'BlockFormText',
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
          fields: [...getFields([{ type: 'elementId' }, { type: 'className' }, { type: 'css' }])],
        },
      ],
    },
  ],
}
