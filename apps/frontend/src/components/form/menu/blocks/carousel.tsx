import {
  BlockCarousel as BlockCarouselType,
  Media,
} from "../../../../types/payload-types";
import EmblaCarousel from "../../../common/carousel";

interface BlockCarouselProps {
  block: BlockCarouselType;
}

export const BlockCarousel = ({ block }: BlockCarouselProps) => {
  return (
    <EmblaCarousel
      slides={
        block.c?.slides?.map((s) => ({
          img: s.image as Media,
          linkURL: "",
        })) || []
      }
      options={{ loop: true }}
    />
  );
};
