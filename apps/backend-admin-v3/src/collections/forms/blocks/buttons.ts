import type { Block } from 'payload'
import getFields from '../fields'

export const BlockFormButtons: Block = {
  slug: 'buttons',
  interfaceName: 'BlockFormButtons',
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
          fields: [...getFields([{ type: 'elementId' }, { type: 'className' }, { type: 'css' }])],
        },
      ],
    },
  ],
}
