import { BlockEmbed as BlockEmbedType } from "@/payload-types";

interface BlockEmbedProps {
  block: BlockEmbedType;
}

import { cn } from '@/utilities/cn'

export const BlockEmbed = ({ block }: BlockEmbedProps) => {
  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn(block?.settings?.className)}>Block Embed</div>
    </>
  )
}
