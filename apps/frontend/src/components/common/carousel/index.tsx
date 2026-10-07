import React, { useCallback } from "react";
import { EmblaOptionsType, EmblaCarouselType } from "embla-carousel";
import { DotButton, useDotButton } from "./dots";
import { PrevButton, NextButton, usePrevNextButtons } from "./arrows";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import "./index.css";
import clsx from "clsx";
import { Media } from "../../../types/payload-types";

type PropType = {
  slides: { img: Media; linkURL?: string }[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Autoplay()]);

  const onNavButtonClick = useCallback((emblaApi: EmblaCarouselType) => {
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (!autoplay) return;

    const resetOrStop =
      autoplay.options.stopOnInteraction === false ? autoplay.reset : autoplay.stop;

    resetOrStop();
  }, []);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(
    emblaApi,
    onNavButtonClick,
  );

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi, onNavButtonClick);

  return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides?.map((slide, index) => (
            <div className="embla__slide bg-gray-700" key={index}>
              <img
                className="w-full h-auto object-contain aspect-video flex items-center justify-center"
                src={slide.img?.url || ""}
                alt={slide.img?.alt || "no-image"}
              />
            </div>
          ))}
        </div>
      </div>

      {slides && slides.length > 0 && (
        <div className="absolute bottom-0 w-full grid grid-cols-[auto_1fr] justify-between gap-4 p-1 hover:bg-opacity-10 bg-opacity-0 bg-gray-950 transition-all">
          <div className="flex flex-row gap-4 items-center ml-2">
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
              className={clsx(`text-menu-primary`, `text-sm`)}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
              className={clsx(`text-menu-primary`, `text-sm`)}
            />
          </div>

          <div className="flex flex-wrap justify-end items-center mr-2 gap-2 py-2">
            {scrollSnaps.map((_, index) => {
              const selected = index === selectedIndex;
              return (
                <DotButton
                  key={index}
                  onClick={() => onDotButtonClick(index)}
                  className={clsx(
                    "appearance-none touch-manipulation no-underline cursor-pointer p-0 m-0 w-2 h-2 flex items-center justify-center rounded-full transition-all duration-300 border",
                    selected ? `bg-menu-primary` : `border-menu-primary`,
                  )}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default EmblaCarousel;
