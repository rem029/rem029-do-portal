import type { Block } from 'payload'
import getFields from '../fields'
import { BlockPageCarousel } from './carousel'
import { BlockPageImages } from './images'
import { BlockPageEmbed } from './embed'
import { BlockPageText } from './text'
import { BlockPageButtons } from './buttons'
import { BlockPageHeader } from './header'
import { BlockPageRichText } from './rich-text'

export const BlockPageSection: Block = {
  slug: 'section',
  interfaceName: 'BlockPageSection',
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
              blocks: [
                BlockPageCarousel,
                BlockPageImages,
                BlockPageEmbed,
                BlockPageText,
                BlockPageButtons,
                BlockPageHeader,
                BlockPageRichText,
              ],
            },
          ],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }])],
        },
      ],
    },
  ],
}
