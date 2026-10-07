import type { Block } from 'payload'
import getFields from '../fields'

export const BlockRichText: Block = {
  slug: 'rich-text',
  interfaceName: 'BlockFormRichText',
  labels: { plural: 'Rich Texts', singular: 'Rich Text' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'richText',
              label: 'Content',
              localized: true,
            },
          ],
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
