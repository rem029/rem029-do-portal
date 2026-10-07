'use client'

import React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { EmblaOptionsType } from 'embla-carousel'
import { cn } from '@/utilities/cn'
import './index.css'

import { DotButton, useDotButton } from './dots'
import { PrevButton, NextButton, usePrevNextButtons } from './arrows'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'

export interface CarouselFiltersProps {
  children: React.ReactNode
  options?: EmblaOptionsType
  className?: string
  showButtons?: boolean
  showDots?: boolean
  slideSize?: string
  slideSpacing?: string
}

export const CarouselFilters: React.FC<CarouselFiltersProps> = ({
  children,
  options,
  className,
  showButtons = true,
  showDots = true,
  slideSize = '33.33%',
  slideSpacing = '0.5rem',
}) => {
  const { selectedLanguage } = useMenuNav()

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'keepSnaps',
    dragFree: true,
    direction: selectedLanguage === 'ar' ? 'rtl' : 'ltr',
    ...options,
  })

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi)

  return (
    <div
      className="embla flex flex-col w-full gap-2 filter-carousel"
      style={
        {
          '--slide-size': slideSize ?? '33.33%',
          '--slide-spacing': slideSpacing ?? '0.5rem',
        } as React.CSSProperties
      }
    >
      <div className="flex flex-row items-center w-full gap-1">
        {showButtons && (
          <PrevButton
            onClick={onPrevButtonClick}
            disabled={prevBtnDisabled}
            className={cn(
              'flex items-center justify-center p-1 rounded-full transition-all duration-300',
              'text-menu-primary disabled:opacity-0',
            )}
          />
        )}

        <div className={cn('embla__viewport flex-1', className)} ref={emblaRef}>

          <div className="embla__container">
            {React.Children.map(children, (child) => {
              if (!child) return null
              return <div className="embla__slide">{child}</div>
            })}
          </div>

        </div>

        {showButtons && (
          <NextButton
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            className={cn(
              'flex items-center justify-center p-1 rounded-full transition-all duration-300',
              'text-menu-primary disabled:opacity-0',
            )}
          />
        )}
      </div>

      {showDots && scrollSnaps.length > 1 && (
        <div className="flex flex-row justify-center items-center gap-1.5">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={cn(
                'w-1 h-1 rounded-full transition-all duration-300',
                index === selectedIndex ? 'bg-menu-primary/50 w-2' : 'bg-menu-primary/20',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CarouselFilters
