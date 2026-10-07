import { BlockPageText as BlockPageTextType } from '@/payload-types'
import { cn } from '@/utilities/cn'

interface BlockPageTextProps {
  block: BlockPageTextType
}

export const BlockPageText = ({ block }: BlockPageTextProps) => {
  const {
    title,
    description,
    html,
    element,
    title_size,
    title_variant,
    description_size,
    description_variant,
  } = (block?.c || {}) as any

  const getTitleSizeClass = (size?: string) => {
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
      default:
        return 'text-3xl'
    }
  }

  const getTitleVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'text-primary'
      case 'secondary':
        return 'text-secondary'
      case 'accent':
        return 'text-accent'
      case 'neutral':
        return 'text-neutral'
      case 'base-content':
      default:
        return 'text-base-content'
    }
  }

  const getDescriptionSizeClass = (size?: string) => {
    switch (size) {
      case 'lg':
        return 'text-lg'
      case 'md':
        return 'text-base'
      case 'sm':
        return 'text-sm'
      case 'xs':
        return 'text-xs'
      default:
        return 'text-base'
    }
  }

  const getDescriptionVariantClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'text-primary/80'
      case 'secondary':
        return 'text-secondary/80'
      case 'accent':
        return 'text-accent/80'
      case 'neutral':
        return 'text-neutral/80'
      case 'base-content':
      default:
        return 'text-base-content/80'
    }
  }

  const getElement = () => {
    const sizeClass = getTitleSizeClass(title_size)
    const variantClass = getTitleVariantClass(title_variant)
    const className = cn('font-bold', sizeClass, variantClass)

    switch (element) {
      case 'h1':
        return <h1 className={className}>{title}</h1>
      case 'h2':
        return <h2 className={className}>{title}</h2>
      case 'h3':
        return <h3 className={className}>{title}</h3>
      case 'h4':
        return <h4 className={className}>{title}</h4>
      case 'h5':
        return <h5 className={className}>{title}</h5>
      case 'h6':
        return <h6 className={className}>{title}</h6>
      case 'paragraph':
      default:
        return <p className={className}>{title}</p>
    }
  }

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('my-4', block?.settings?.className)}>
        {title && getElement()}
        {description && (
          <p
            className={cn(
              'mt-2',
              getDescriptionSizeClass(description_size),
              getDescriptionVariantClass(description_variant),
            )}
          >
            {description}
          </p>
        )}
        {html && <div className="mt-2" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </>
  )
}
