import { BlockCarousel as BlockCarouselType, MenuMedia } from '@/payload-types'
import EmblaCarousel from '@/common/components/embla-carousel'
import { cn } from '@/utilities/cn'

interface BlockCarouselProps {
  block: BlockCarouselType
}

export const BlockCarousel = ({ block }: BlockCarouselProps) => {
  // Auto-ignored when empty - a hero carousel with nothing configured (or an event's
  // "Carousel" field left blank, see compile-layout.ts) should take up no space at all,
  // not render an empty EmblaCarousel shell.
  if (!block?.c?.slides || block.c.slides.length === 0) return null

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('w-full py-1.5', block?.settings?.className)}>
        <div className="w-full rounded-2xl overflow-hidden shadow-sm aspect-video">
          <EmblaCarousel
            slides={
              block.c?.slides?.map((s) => ({
                img: s.image as MenuMedia,
                linkURL: '',
              })) || []
            }
            options={{ loop: true }}
            viewportClassName="rounded-2xl"
            imageClassName="object-cover"
          />
        </div>
      </div>
    </>
  )
}
