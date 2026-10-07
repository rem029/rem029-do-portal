import clsx from "clsx";
import { BlockSection as BlockSectionType } from "../../../../types/payload-types";
import { RenderBlocks, RenderBlocksProps } from "../components/render-blocks";

interface BlockSectionProps extends Omit<RenderBlocksProps, "blocks"> {
  block: BlockSectionType;
}

export const BlockSection = ({ block }: BlockSectionProps) => {
  return (
    <div
      className={clsx(
        `bg-menu-background`,
        "w-full px-4 py-2",
        block.settings?.className || "",
      )}
    >
      {block.settings?.css && <style>{block.settings?.css || ""}</style>}
      <RenderBlocks blocks={block.c.blks} />
    </div>
  );
};
