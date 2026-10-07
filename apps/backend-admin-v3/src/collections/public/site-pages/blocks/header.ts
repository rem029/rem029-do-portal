import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageHeader: Block = {
  slug: 'header',
  interfaceName: 'BlockPageHeader',
  labels: { plural: 'Headers', singular: 'Header' },
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
              { type: 'description' },
              { type: 'image' },
              { type: 'size' },
            ]),
          ],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [
            ...getFields([
              { type: 'is_sticky' },
              { type: 'top_pos' },
              { type: 'className' },
              { type: 'css' },
            ]),
          ],
        },
      ],
    },
  ],
}
