import { BlockText as BlockTextType } from '@/payload-types'

interface BlockTextProps {
  block: BlockTextType
}

import { cn } from '@/utilities/cn'

export const BlockText = ({ block }: BlockTextProps) => {
  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn("text-menu-primary my-1", block?.settings?.className)}>{block?.c?.label || ''}</div>
    </>
  )
}
