import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageText: Block = {
  slug: 'text',
  interfaceName: 'BlockPageText',
  labels: { plural: 'Text Blocks', singular: 'Text Block' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            ...getFields([
              { type: 'title' },
              { type: 'title_size' },
              { type: 'title_variant' },
              { type: 'element' },
              { type: 'description' },
              { type: 'description_size' },
              { type: 'description_variant' },
              { type: 'html' },
            ]),
          ],
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
