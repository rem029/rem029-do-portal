import { BlockPageButtons as BlockPageButtonsType } from '@/payload-types'
import { cn } from '@/utilities/cn'
import Link from 'next/link'

interface BlockPageButtonsProps {
  block: BlockPageButtonsType
}

export const BlockPageButtons = ({ block }: BlockPageButtonsProps) => {
  const { label, link, size, variant } = block?.c || {}

  if (!label) return null

  const getSizeClass = (size?: string) => {
    switch (size) {
      case '2xl':
        return 'btn-lg px-8 text-xl'
      case 'xl':
        return 'btn-lg px-6'
      case 'lg':
        return 'btn-lg'
      case 'md':
        return 'btn-md'
      case 'sm':
        return 'btn-sm'
      case 'xs':
        return 'btn-xs'
      default:
        return 'btn-md'
    }
  }

  const getVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'btn-primary'
      case 'secondary':
        return 'btn-secondary'
      case 'accent':
        return 'btn-accent'
      case 'neutral':
        return 'btn-neutral'
      case 'ghost':
        return 'btn-ghost'
      case 'link':
        return 'btn-link'
      case 'outline':
        return 'btn-outline'
      default:
        return 'btn-primary'
    }
  }

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('my-4', block?.settings?.className)}>
        <Link
          href={link || '#'}
          className={cn('btn', getSizeClass(size || 'md'), getVariantClass(variant || 'primary'))}
        >
          {label}
        </Link>
      </div>
    </>
  )
}
