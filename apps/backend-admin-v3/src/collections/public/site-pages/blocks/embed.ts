import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageEmbed: Block = {
  slug: 'embed',
  interfaceName: 'BlockPageEmbed',
  labels: { plural: 'Embeds', singular: 'Embed' },
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
              { type: 'html' },
              {
                type: 'description',
                override: {
                  label: 'Embed Code',
                  admin: { description: 'Paste iframe or embed code here.' },
                },
              },
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
