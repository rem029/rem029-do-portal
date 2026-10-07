import type { Block } from 'payload'
import getFields from '../fields'
import { BlockCarousel } from './carousel'
import { BlockImages } from './images'
import { BlockEmbed } from './embed'
import { BlockText } from './text'
import { BlockButtons } from './button'
import { BlockHeader } from './header'
import { BlockFilter } from './filter'
import { BlockItems } from './items'

export const BlockSection: Block = {
  slug: 'section',
  interfaceName: 'BlockSection',
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
                BlockCarousel,
                BlockImages,
                BlockEmbed,
                BlockText,
                BlockButtons,
                BlockHeader,
                BlockFilter,
                BlockItems,
              ],
            },
          ],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [
            ...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }]),
          ],
        },
      ],
    },
  ],
}
