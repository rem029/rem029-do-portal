import { BlockPageHeader as BlockPageHeaderType, Media } from '@/payload-types'
import { cn } from '@/utilities/cn'
import Image from 'next/image'

interface BlockPageHeaderProps {
  block: BlockPageHeaderType
}

export const BlockPageHeader = ({ block }: BlockPageHeaderProps) => {
  const { title, description, image, size } = block?.c || {}
  const { is_sticky, top_pos } = block?.settings || {}

  const getSizeClass = () => {
    switch (size) {
      case '2xl':
        return 'text-5xl'
      case 'xl':
        return 'text-4xl'
      case 'lg':
        return 'text-3xl'
      case 'md':
        return 'text-2xl'
      case 'sm':
        return 'text-xl'
      case 'xs':
        return 'text-lg'
      case '2xs':
        return 'text-base'
      default:
        return 'text-3xl'
    }
  }

  const imageData = image as Media

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <header
        className={cn('w-full py-8', is_sticky ? 'sticky' : '', block?.settings?.className)}
        style={is_sticky ? { top: `${top_pos || 0}px` } : {}}
      >
        <div className="flex flex-col gap-4">
          {imageData?.url && (
            <div className="relative w-full h-64">
              <Image
                src={imageData.url}
                alt={imageData.alt || title || 'Header image'}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          {title && <h1 className={cn('font-bold', getSizeClass())}>{title}</h1>}
          {description && <p className="text-base-content/80">{description}</p>}
        </div>
      </header>
    </>
  )
}
