import type { Block } from 'payload'
import getFields from '../fields'

export const BlockPageButtons: Block = {
  slug: 'buttons',
  interfaceName: 'BlockPageButtons',
  labels: { plural: 'Buttons', singular: 'Button' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            ...getFields([
              { type: 'label' },
              { type: 'link' },
              { type: 'variant' },
              { type: 'size' },
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
