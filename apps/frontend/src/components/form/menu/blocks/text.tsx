import { BlockText as BlockTextType } from "../../../../types/payload-types";

interface BlockTextProps {
  block: BlockTextType;
}

export const BlockText = ({ block }: BlockTextProps) => {
  return <div className="bg-menu-text">Block Text</div>;
};
