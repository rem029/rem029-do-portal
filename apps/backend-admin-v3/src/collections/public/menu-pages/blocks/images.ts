import type { Block } from 'payload'
import getFields from '../fields'

export const BlockImages: Block = {
  slug: 'images',
  interfaceName: 'BlockImages',
  labels: { plural: 'Images', singular: 'Image' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            ...getFields([{ type: 'image', override: { relationTo: 'menu-media' } }]),
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
