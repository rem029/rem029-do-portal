'use client'

import React, { useCallback } from 'react'
import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { DotButton, useDotButton } from './dots'
import { PrevButton, NextButton, usePrevNextButtons } from './arrows'
import { cn } from '@/utilities/cn'
import './index.css'
import Image from 'next/image'

type PropType = {
  slides: {
    img: {
      url?: string | null
      alt?: string | null
    } | null
    linkURL?: string
  }[]
  options?: EmblaOptionsType
  className?: string
  viewportClassName?: string
  imageClassName?: string
}

export const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides, options, className, viewportClassName, imageClassName } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Autoplay()])

  const onNavButtonClick = useCallback((emblaApi: EmblaCarouselType) => {
    const autoplay = emblaApi?.plugins()?.autoplay
    if (!autoplay) return

    const resetOrStop =
      autoplay.options.stopOnInteraction === false ? autoplay.reset : autoplay.stop

    resetOrStop()
  }, [])

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi, onNavButtonClick)

  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi, onNavButtonClick)

  return (
    <section className={cn('embla', className)}>
      <div className={cn('embla__viewport rounded-lg', viewportClassName)} ref={emblaRef}>
        <div className="embla__container">
          {slides?.map((slide, index) => (
            <div className="embla__slide" key={index}>
              <div className="relative aspect-video w-full">
                <Image
                  className={cn('object-contain', imageClassName)}
                  src={slide.img?.url || ''}
                  alt={slide.img?.alt || 'no-image'}
                  fill
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides && slides.length > 0 && (
        <div className="absolute bottom-0 w-full grid grid-cols-[auto_1fr] justify-between gap-4 p-1 hover:bg-menu-primary/50 bg-menu-primary/0 transition-all rounded-b-lg">
          <div className="flex flex-row gap-4 items-center ml-2">
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
              className={cn('text-menu-primary-contrast text-sm')}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
              className={cn('text-menu-primary-contrast text-sm')}
            />
          </div>

          <div className="flex flex-wrap justify-end items-center mr-2 gap-2 py-2">
            {scrollSnaps.map((_, index) => {
              const selected = index === selectedIndex
              return (
                <DotButton
                  key={index}
                  onClick={() => onDotButtonClick(index)}
                  className={cn(
                    'appearance-none touch-manipulation no-underline cursor-pointer p-0 m-0 w-2 h-2 flex items-center justify-center rounded-full transition-all duration-300 border',
                    selected ? 'bg-menu-primary-contrast' : 'border-menu-primary-contrast',
                  )}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default EmblaCarousel
