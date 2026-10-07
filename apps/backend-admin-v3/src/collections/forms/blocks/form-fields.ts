import type { Block } from 'payload'

import getFields from '../fields'

export const BlockFormFields: Block = {
  slug: 'form-fields',
  interfaceName: 'BlockFormFormFields',
  labels: { plural: 'Form Fields', singular: 'Form Fields' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'elementId' }, { type: 'className' }, { type: 'css' }])],
        },
      ],
    },
  ],
}
