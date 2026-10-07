import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageImages: Block = {
  slug: 'images',
  interfaceName: 'BlockPageImages',
  labels: { plural: 'Images', singular: 'Image' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            ...getFields([
              { type: 'image' },
              { type: 'title', override: { label: 'Alt Text' } },
              { type: 'link' },
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
