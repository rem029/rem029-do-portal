import type { Block } from 'payload'
import getFields from '../fields'

export const BlockImages: Block = {
  slug: 'images',
  interfaceName: 'BlockFormImages',
  labels: { plural: 'Images', singular: 'Image' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [...getFields([{ type: 'image' }])],
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
