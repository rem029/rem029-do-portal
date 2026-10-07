import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import getFields from '../fields'

export const BlockPageRichText: Block = {
  slug: 'richText',
  interfaceName: 'BlockPageRichText',
  labels: { plural: 'Rich Text Blocks', singular: 'Rich Text Block' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'richText',
              name: 'richText',
              label: 'Rich Text',
              editor: lexicalEditor({}),
              required: true,
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
