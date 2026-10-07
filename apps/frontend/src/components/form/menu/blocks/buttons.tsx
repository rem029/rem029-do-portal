import { BlockButtons as BlockButtonsType } from "../../../../types/payload-types";

interface BlockButtonsProps {
  block: BlockButtonsType;
}

export const BlockButtons = ({ block }: BlockButtonsProps) => {
  return <div className="bg-gray-300">Block Buttons</div>;
};
