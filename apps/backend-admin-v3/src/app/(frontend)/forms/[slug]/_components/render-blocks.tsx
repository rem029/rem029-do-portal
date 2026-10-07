import React from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { FormRenderer } from '../../_components/form-renderer'
import { BlockFormsSection, Form } from '@/payload-types'
import { lexicalToHtml } from '@/utilities/lexical-converter'

export interface RenderBlocksProps {
  blocks: Form['layout'] | NonNullable<BlockFormsSection['c']>['blks']
  form?: any
  user?: any
  initialData?: Array<{ field: string; value: string }>
  readOnly?: boolean
}

export const RenderBlocks = ({ blocks, form, user, initialData, readOnly }: RenderBlocksProps) => {
  if (!blocks || !blocks.length) return null

  return (
    <>
      {blocks.map((block, index) => {
        const { blockType } = block

        switch (blockType) {
          case 'section':
            return (
              <BlockSection
                key={index}
                block={block}
                form={form}
                user={user}
                initialData={initialData}
                readOnly={readOnly}
              />
            )
          case 'text':
            return <BlockText key={index} block={block} />
          case 'rich-text':
            return <BlockRichText key={index} block={block} />
          case 'carousel':
            return <BlockCarousel key={index} block={block} />
          case 'embed':
            return <BlockEmbed key={index} block={block} />
          case 'images':
            return <BlockImages key={index} block={block} />
          case 'form-fields':
            return <BlockFormFields key={index} block={block} form={form} user={user} />
          case 'buttons':
            return <BlockButtons key={index} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}

const BlockSection = ({ block, form, user, initialData, readOnly }: any) => {
  return (
    <div
      id={block.settings?.elementId}
      className={cn('w-full px-4 py-2', block.settings?.className || '')}
    >
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <RenderBlocks
        blocks={block?.c?.blks || []}
        form={form}
        user={user}
        initialData={initialData}
        readOnly={readOnly}
      />
    </div>
  )
}

const BlockText = ({ block }: { block: any }) => {
  return (
    <div id={block.settings?.elementId} className={cn('w-full', block.settings?.className || '')}>
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <div
        className={cn('text-sm text-base-content whitespace-pre-wrap', noah.className)}
        dangerouslySetInnerHTML={{ __html: block.c?.label || '' }}
      />
    </div>
  )
}

const BlockRichText = ({ block }: { block: any }) => {
  return (
    <div
      id={block.settings?.elementId}
      className={cn('w-full prose prose-primary max-w-none', block.settings?.className || '')}
    >
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <div
        className={noah.className}
        dangerouslySetInnerHTML={{
          __html: block.c?.content ? lexicalToHtml(block.c?.content) : '',
        }}
      />
    </div>
  )
}

const BlockCarousel = ({ block }: { block: any }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000 })])

  if (!block.c?.slides?.length) return null

  return (
    <div
      id={block.settings?.elementId}
      className={cn('w-full overflow-hidden', block.settings?.className || '')}
      ref={emblaRef}
    >
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <div className="flex">
        {block.c.slides.map((slide: any, index: number) => {
          const imgUrl =
            typeof slide.image === 'object'
              ? slide.image?.url || `/api/media/file/${slide.image?.filename}`
              : ''
          if (!imgUrl) return null
          return (
            <div className="flex-[0_0_100%] min-w-0" key={index}>
              <img src={imgUrl} alt={slide.image?.alt || ''} className="w-full object-cover" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const BlockEmbed = ({ block }: { block: any }) => {
  return (
    <div id={block.settings?.elementId} className={cn('w-full', block.settings?.className || '')}>
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <div dangerouslySetInnerHTML={{ __html: block.c?.html || '' }} />
    </div>
  )
}

const BlockImages = ({ block }: { block: any }) => {
  const imgUrl =
    typeof block.c?.image === 'object'
      ? block.c?.image?.url || `/api/media/file/${block.c?.image?.filename}`
      : ''
  if (!imgUrl) return null

  return (
    <div id={block.settings?.elementId} className={cn('w-full', block.settings?.className || '')}>
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <img src={imgUrl} alt={block.c?.image?.alt || ''} className="w-full object-cover" />
    </div>
  )
}

const BlockFormFields = ({ block, form, user }: { block: any; form: any; user: any }) => {
  return (
    <div id={block.settings?.elementId} className="w-full">
      <FormRenderer form={form} user={user} />
    </div>
  )
}

const BlockButtons = ({ block }: { block: any }) => {
  const { label, link, size, variant } = block?.c || {}

  if (!label) return null

  const getSizeClass = (size?: string) => {
    switch (size) {
      case '2xl':
        return 'btn-lg px-8 text-xl'
      case 'xl':
        return 'btn-lg px-6'
      case 'lg':
        return 'btn-lg'
      case 'md':
        return 'btn-md'
      case 'sm':
        return 'btn-sm'
      case 'xs':
        return 'btn-xs'
      default:
        return 'btn-md'
    }
  }

  const getVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'btn-primary'
      case 'secondary':
        return 'btn-secondary'
      case 'accent':
        return 'btn-accent'
      case 'neutral':
        return 'btn-neutral'
      case 'ghost':
        return 'btn-ghost'
      case 'link':
        return 'btn-link'
      case 'outline':
        return 'btn-outline'
      default:
        return 'btn-primary'
    }
  }

  return (
    <div id={block.settings?.elementId} className={cn('my-4', block?.settings?.className)}>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <Link
        href={link || '#'}
        className={cn('btn', getSizeClass(size || 'md'), getVariantClass(variant || 'primary'))}
      >
        {label}
      </Link>
    </div>
  )
}
