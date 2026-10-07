import { BlockPageCarousel as BlockPageCarouselType, Media } from '@/payload-types'
import { cn } from '@/utilities/cn'
import Image from 'next/image'

interface BlockPageCarouselProps {
  block: BlockPageCarouselType
}

export const BlockPageCarousel = ({ block }: BlockPageCarouselProps) => {
  const slides = block?.c?.slides || []

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('carousel w-full rounded-lg my-4', block?.settings?.className)}>
        {slides.map((slide, idx) => {
          const imageData = slide.image as Media
          return (
            <div key={idx} id={`slide${idx}`} className="carousel-item relative w-full">
              {imageData?.url && (
                <div className="relative w-full h-96">
                  <Image
                    src={imageData.url}
                    alt={slide.title || imageData.alt || `Slide ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {(slide.title || slide.description) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  {slide.title && <h3 className="text-xl font-bold">{slide.title}</h3>}
                  {slide.description && <p className="text-sm mt-1">{slide.description}</p>}
                </div>
              )}
              <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                <a
                  href={`#slide${idx === 0 ? slides.length - 1 : idx - 1}`}
                  className="btn btn-circle"
                >
                  ❮
                </a>
                <a
                  href={`#slide${idx === slides.length - 1 ? 0 : idx + 1}`}
                  className="btn btn-circle"
                >
                  ❯
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
