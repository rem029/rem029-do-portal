import type { Block } from 'payload'
import getFields from '../fields'

export const BlockCarousel: Block = {
  slug: 'carousel',
  interfaceName: 'BlockFormCarousel',
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
              fields: getFields([{ type: 'image' }]),
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
