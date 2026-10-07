import type { Block } from 'payload'
import getFields from '../fields'

export const BlockEmbed: Block = {
  slug: 'embed',
  interfaceName: 'BlockEmbed',
  labels: { plural: 'Embeds', singular: 'Embed' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [...getFields([{ type: 'html' }])],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }])],
        },
      ],
    },
  ],
}
