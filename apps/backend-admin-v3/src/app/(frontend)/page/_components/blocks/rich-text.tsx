import { BlockPageRichText as BlockPageRichTextType } from '@/payload-types'
import { lexicalToHtml } from '@/utilities/lexical-converter'

interface BlockPageRichTextProps {
  block: BlockPageRichTextType
}

export const BlockPageRichText = ({ block }: BlockPageRichTextProps) => {
  const { c, settings } = block
  const { richText } = c || {}

  const htmlContent = richText ? lexicalToHtml(richText) : ''

  return (
     <>
       {settings?.css && <style>{settings.css}</style>}
       <div className={settings?.className || ''}>
         <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
       </div>
     </>
  )
}
