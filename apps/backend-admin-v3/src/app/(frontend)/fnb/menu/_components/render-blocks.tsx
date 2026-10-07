'use client'

import { Fragment } from 'react'
import {
  BlockSection,
  MenuPage,
  BlockButtons as BlockButtonsType,
  BlockCarousel as BlockCarouselType,
  BlockEmbed as BlockEmbedType,
  BlockFilter as BlockFilterType,
  BlockImages as BlockImagesType,
  BlockItems as BlockItemsType,
  BlockText as BlockTextType,
} from '@/payload-types'
import { BlockButtons } from '@/app/(frontend)/fnb/menu/_components/blocks/buttons'
import { BlockCarousel } from '@/app/(frontend)/fnb/menu/_components/blocks/carousel'
import { BlockEmbed } from '@/app/(frontend)/fnb/menu/_components/blocks/embed'
import { BlockFilter } from '@/app/(frontend)/fnb/menu/_components/blocks/filter'
import { BlockHeader } from '@/app/(frontend)/fnb/menu/_components/blocks/header'
import { BlockImages } from '@/app/(frontend)/fnb/menu/_components/blocks/images'
import { BlockItems } from '@/app/(frontend)/fnb/menu/_components/blocks/items'
import { BlockSection as BlockSectionComponent } from '@/app/(frontend)/fnb/menu/_components/blocks/section'
import { BlockText } from '@/app/(frontend)/fnb/menu/_components/blocks/text'

export interface RenderBlocksProps {
  blocks: MenuPage['c']['blk'] | NonNullable<BlockSection['c']>['blks']
}

export const RenderBlocks = ({ blocks }: RenderBlocksProps) => {
  const getBlockKey = (block: any, idx: number) => {
    const contentHash = JSON.stringify(block)
    return `${block.blockType}-${block.id || idx}-${contentHash.length}`
  }

  return (
    <Fragment>
      {blocks?.map((block, idx) => {
        const id = getBlockKey(block, idx)

        switch (block.blockType) {
          case 'section':
            return <BlockSectionComponent key={id} block={block} />
          case 'text':
            return <BlockText key={id} block={block as BlockTextType} />
          case 'buttons':
            return <BlockButtons key={id} block={block as BlockButtonsType} />
          case 'carousel':
            return <BlockCarousel key={id} block={block as BlockCarouselType} />
          case 'embed':
            return <BlockEmbed key={id} block={block as BlockEmbedType} />
          case 'filter':
            return <BlockFilter key={id} block={block as BlockFilterType} />
          case 'header':
            return <BlockHeader key={id} block={block} />
          case 'images':
            return <BlockImages key={id} block={block as BlockImagesType} />
          case 'items':
            return <BlockItems key={id} block={block as BlockItemsType} />
          default:
            return <div key={id}>Block Default</div>
        }
      })}
    </Fragment>
  )
}
