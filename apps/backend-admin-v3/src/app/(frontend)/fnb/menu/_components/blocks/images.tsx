import { BlockImages as BlockImagesType } from "@/payload-types";

interface BlockImagesProps {
  block: BlockImagesType;
}

import { cn } from '@/utilities/cn'

export const BlockImages = ({ block }: BlockImagesProps) => {
  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn(block?.settings?.className)}>Block Images</div>
    </>
  )
}
