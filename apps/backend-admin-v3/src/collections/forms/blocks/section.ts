import type { Block } from 'payload'
import getFields from '../fields'
import { BlockCarousel } from './carousel'
import { BlockImages } from './images'
import { BlockEmbed } from './embed'
import { BlockText } from './text'
import { BlockFormFields } from './form-fields'
import { BlockRichText } from './rich-text'
import { BlockFormButtons } from './buttons'

export const BlockSection: Block = {
  slug: 'section',
  interfaceName: 'BlockFormsSection',
  labels: { plural: 'Sections', singular: 'Section' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'blocks',
              name: 'blks',
              label: 'Blocks',
              labels: { singular: 'Block', plural: 'Blocks' },
              blocks: [BlockFormFields, BlockCarousel, BlockImages, BlockEmbed, BlockText, BlockRichText, BlockFormButtons],
            },
          ],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'elementId' }, { type: 'className' }, { type: 'css' }, { type: 'js' }])],
        },
      ],
    },
  ],
}
