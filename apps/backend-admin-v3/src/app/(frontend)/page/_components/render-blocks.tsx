'use client'

import { Fragment } from 'react'
import {
  BlockPageSection,
  SitePage,
  BlockPageButtons as BlockPageButtonsType,
  BlockPageCarousel as BlockPageCarouselType,
  BlockPageEmbed as BlockPageEmbedType,
  BlockPageImages as BlockPageImagesType,
  BlockPageText as BlockPageTextType,
  BlockPageRichText as BlockPageRichTextType,
} from '@/payload-types'
import { BlockPageButtons } from '@/app/(frontend)/page/_components/blocks/buttons'
import { BlockPageCarousel } from '@/app/(frontend)/page/_components/blocks/carousel'
import { BlockPageEmbed } from '@/app/(frontend)/page/_components/blocks/embed'
import { BlockPageHeader } from '@/app/(frontend)/page/_components/blocks/header'
import { BlockPageImages } from '@/app/(frontend)/page/_components/blocks/images'
import { BlockPageSection as BlockPageSectionComponent } from '@/app/(frontend)/page/_components/blocks/section'
import { BlockPageText } from '@/app/(frontend)/page/_components/blocks/text'
import { BlockPageRichText } from '@/app/(frontend)/page/_components/blocks/rich-text'

export interface RenderPageBlocksProps {
  blocks: SitePage['c']['blk'] | NonNullable<BlockPageSection['c']>['blks']
}

export const RenderPageBlocks = ({ blocks }: RenderPageBlocksProps) => {
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
            return <BlockPageSectionComponent key={id} block={block} />
          case 'text':
            return <BlockPageText key={id} block={block as BlockPageTextType} />
          case 'richText':
            return <BlockPageRichText key={id} block={block as BlockPageRichTextType} />
          case 'buttons':
            return <BlockPageButtons key={id} block={block as BlockPageButtonsType} />
          case 'carousel':
            return <BlockPageCarousel key={id} block={block as BlockPageCarouselType} />
          case 'embed':
            return <BlockPageEmbed key={id} block={block as BlockPageEmbedType} />
          case 'header':
            return <BlockPageHeader key={id} block={block} />
          case 'images':
            return <BlockPageImages key={id} block={block as BlockPageImagesType} />
          default:
            return <div key={id}>Block Default</div>
        }
      })}
    </Fragment>
  )
}
