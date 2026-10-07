import { Fragment } from "react/jsx-runtime";
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
} from "../../../../types/payload-types";
import { BlockButtons } from "../blocks/buttons";
import { BlockCarousel } from "../blocks/carousel";
import { BlockEmbed } from "../blocks/embed";
import { BlockFilter } from "../blocks/filter";
import { BlockHeader } from "../blocks/header";
import { BlockImages } from "../blocks/images";
import { BlockItems } from "../blocks/items";
import { BlockSection as BlockSectionComponent } from "../blocks/section";
import { BlockText } from "../blocks/text";

export interface RenderBlocksProps {
  blocks: MenuPage["c"]["blk"] | BlockSection["c"]["blks"];
}

export const RenderBlocks = ({ blocks }: RenderBlocksProps) => {
  // Create a more specific key that includes content hash
  const getBlockKey = (block: any, idx: number) => {
    const contentHash = JSON.stringify(block);
    return `${block.blockType}-${block.id || idx}-${contentHash.length}`;
  };

  return (
    <Fragment>
      {blocks?.map((block, idx) => {
        const id = getBlockKey(block, idx);

        switch (block.blockType) {
          case "section":
            return <BlockSectionComponent key={id} block={block} />;
          case "text":
            return <BlockText key={id} block={block as BlockTextType} />;
          case "buttons":
            return <BlockButtons key={id} block={block as BlockButtonsType} />;
          case "carousel":
            return <BlockCarousel key={id} block={block as BlockCarouselType} />;
          case "embed":
            return <BlockEmbed key={id} block={block as BlockEmbedType} />;
          case "filter":
            return <BlockFilter key={id} block={block as BlockFilterType} />;
          case "header":
            return <BlockHeader key={id} block={block} />;
          case "images":
            return <BlockImages key={id} block={block as BlockImagesType} />;
          case "items":
            return <BlockItems key={id} block={block as BlockItemsType} />;
          default:
            return <div key={id}>Block Default</div>;
        }
      })}
    </Fragment>
  );
};
