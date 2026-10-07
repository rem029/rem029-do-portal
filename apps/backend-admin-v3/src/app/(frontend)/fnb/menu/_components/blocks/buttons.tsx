import { BlockButtons as BlockButtonsType } from "@/payload-types";

interface BlockButtonsProps {
  block: BlockButtonsType;
}

import { cn } from '@/utilities/cn'

export const BlockButtons = ({ block }: BlockButtonsProps) => {
  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn(block?.settings?.className)}>Block Buttons</div>
    </>
  )
}
