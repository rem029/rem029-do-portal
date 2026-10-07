import { BlockPageImages as BlockPageImagesType, Media } from '@/payload-types'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import Link from 'next/link'

interface BlockPageImagesProps {
  block: BlockPageImagesType
}

export const BlockPageImages = ({ block }: BlockPageImagesProps) => {
  const { image, title, link } = block?.c || {}
  const imageData = image as Media

  if (!imageData?.url) return null

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('my-4', block?.settings?.className)}>
        {link ? (
          <Link href={link} className="relative w-full h-96 block">
            <Image
              src={imageData.url}
              alt={title || imageData.alt || 'Image'}
              fill
              className="object-cover rounded-lg"
            />
          </Link>
        ) : (
          <div className="relative w-full h-96">
            <Image
              src={imageData.url}
              alt={title || imageData.alt || 'Image'}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    </>
  )
}
