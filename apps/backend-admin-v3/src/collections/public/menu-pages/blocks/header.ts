import type { Block } from 'payload'
import getFields from '../fields'

export const BlockHeader: Block = {
  slug: 'header',
  interfaceName: 'BlockHeader',
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
              {
                type: 'label',
                override: {
                  admin: {
                    description:
                      'Keep this blank if you dont need to overwrite existing restaurant name',
                  },
                },
              },
              {
                type: 'image',
                override: {
                  name: 'logo',
                  relationTo: 'menu-media',
                  admin: {
                    description:
                      'Keep this blank if you dont need to overwrite existing restaurant logo',
                  },
                },
              },
            ]),
            {
              type: 'checkbox',
              name: 'show_language',
              label: 'Show Language Switch',
              defaultValue: true,
            },
            {
              type: 'checkbox',
              name: 'show_notification',
              label: 'Show Notification Bell',
              defaultValue: false,
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
