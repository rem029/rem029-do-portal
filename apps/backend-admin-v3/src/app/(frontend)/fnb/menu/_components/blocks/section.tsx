import { cn } from '@/utilities/cn'
import { BlockSection as BlockSectionType } from '@/payload-types'
import { RenderBlocks, RenderBlocksProps } from '../render-blocks'

interface BlockSectionProps extends Omit<RenderBlocksProps, 'blocks'> {
  block: BlockSectionType
}

export const BlockSection = ({ block }: BlockSectionProps) => {
  return (
    <div
      className={cn(
        `bg-menu-background`,
        'w-full px-4 py-2 border-box',
        block.settings?.className || '',
      )}
    >
      {block.settings?.css && <style>{block.settings?.css || ''}</style>}
      <RenderBlocks blocks={block?.c?.blks || []} />
    </div>
  )
}
