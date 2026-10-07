import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageCarousel: Block = {
  slug: 'carousel',
  interfaceName: 'BlockPageCarousel',
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
              fields: [
                ...getFields([
                  { type: 'image' },
                  { type: 'title' },
                  { type: 'description' },
                  { type: 'link' },
                ]),
              ],
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
