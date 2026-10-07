import type { Block } from 'payload'
import getFields from '../fields'

export const BlockCarousel: Block = {
  slug: 'carousel',
  interfaceName: 'BlockCarousel',
  labels: { plural: 'Carousels', singular: 'Carousel' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'array',
              name: 'slides',
              label: 'Slides',
              fields: getFields([{ type: 'image', override: { relationTo: 'menu-media' } }]),
            },
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
