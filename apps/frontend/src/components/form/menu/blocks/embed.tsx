import { BlockEmbed as BlockEmbedType } from "../../../../types/payload-types";

interface BlockEmbedProps {
  block: BlockEmbedType;
}

export const BlockEmbed = ({ block }: BlockEmbedProps) => {
  return <div className="bg-gray-500">Block Embed</div>;
};
