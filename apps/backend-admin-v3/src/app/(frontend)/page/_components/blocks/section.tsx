import { BlockPageSection as BlockPageSectionType } from '@/payload-types'
import { RenderPageBlocks } from '@/app/(frontend)/page/_components/render-blocks'
import { cn } from '@/utilities/cn'

interface BlockPageSectionProps {
  block: BlockPageSectionType
}

export const BlockPageSection = ({ block }: BlockPageSectionProps) => {
  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('w-full', block?.settings?.className)}>
        <RenderPageBlocks blocks={block?.c?.blks} />
      </div>
    </>
  )
}
