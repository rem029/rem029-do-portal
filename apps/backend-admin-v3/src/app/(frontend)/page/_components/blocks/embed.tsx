import { BlockPageEmbed as BlockPageEmbedType } from '@/payload-types'
import { cn } from '@/utilities/cn'

interface BlockPageEmbedProps {
  block: BlockPageEmbedType
}

export const BlockPageEmbed = ({ block }: BlockPageEmbedProps) => {
  const { title, html, description } = block?.c || {}

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('my-4', block?.settings?.className)}>
        {title && <h3 className="text-xl font-bold mb-2">{title}</h3>}
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {description && (
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: description }} />
        )}
      </div>
    </>
  )
}
