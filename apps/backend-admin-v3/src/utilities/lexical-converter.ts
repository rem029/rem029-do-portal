/**
 * Simple Lexical to HTML converter for Payload CMS 3.x
 * Focused on the features used in the Doha Quest application suite:
 * Paragraphs, Lists (Ordered/Unordered), and basic text formatting.
 */

export const lexicalToHtml = (lexicalJson: any): string => {
  if (!lexicalJson || !lexicalJson.root || !lexicalJson.root.children) {
    return ''
  }

  // Nested <ol>/<ul> cycle through marker styles per depth, matching the
  // convention used by Word/Google Docs, instead of repeating the same marker.
  const orderedMarkers = ['decimal', 'lower-alpha', 'lower-roman']
  const unorderedMarkers = ['disc', 'circle', 'square']

  const renderNode = (node: any, listDepth = 0): string => {
    // Handling Text Nodes
    if (node.type === 'text') {
      let text = node.text || ''

      // Lexical uses bitmask for formatting:
      // 1 = Bold
      // 2 = Italic
      // 4 = Strikethrough
      // 8 = Underline
      // 16 = Code
      // 32 = Subscript
      // 64 = Superscript

      if (node.format & 1) text = `<strong>${text}</strong>`
      if (node.format & 2) text = `<em>${text}</em>`
      if (node.format & 8) text = `<u>${text}</u>`
      if (node.format & 4) text = `<strike>${text}</strike>`

      return text
    }

    // Handling Element Nodes
    if (node.children) {
      const isList = node.type === 'list'
      const childDepth = isList ? listDepth + 1 : listDepth
      const childrenHtml = node.children.map((child: any) => renderNode(child, childDepth)).join('')
      const alignStyle = node.format ? `text-align: ${node.format};` : ''
      const indentStyle = node.indent ? `margin-left: ${node.indent * 2}rem;` : ''
      const blockStyle = alignStyle || indentStyle ? ` style="${alignStyle}${indentStyle}"` : ''

      switch (node.type) {
        case 'paragraph':
          return `<p${blockStyle}>${childrenHtml}</p>`
        case 'list': {
          const tag = node.listType === 'number' ? 'ol' : 'ul'
          const markers = tag === 'ol' ? orderedMarkers : unorderedMarkers
          const markerType = markers[listDepth % markers.length]
          const listStyle = ` style="${alignStyle}${indentStyle}list-style-type: ${markerType};"`
          return `<${tag}${listStyle}>${childrenHtml}</${tag}>`
        }
        case 'listitem': {
          // A listitem whose only child is a nested list (no text of its own) is
          // just Lexical's wrapper for indenting — it shouldn't get its own marker.
          const isNestingWrapper = node.children.length === 1 && node.children[0].type === 'list'
          const markerStyle = isNestingWrapper ? 'list-style: none;' : ''
          const liStyle = alignStyle || indentStyle || markerStyle ? ` style="${alignStyle}${indentStyle}${markerStyle}"` : ''
          return `<li${liStyle}>${childrenHtml}</li>`
        }
        case 'heading':
          const level = node.tag || 'h1'
          return `<${level}${blockStyle}>${childrenHtml}</${level}>`
        case 'quote':
          return `<blockquote${blockStyle}>${childrenHtml}</blockquote>`
        case 'link':
          return `<a href="${node.fields?.url || ''}" target="_blank">${childrenHtml}</a>`
        default:
          return childrenHtml
      }
    }

    // Handling Line Breaks
    if (node.type === 'linebreak') {
      return '<br />'
    }

    return ''
  }

  return lexicalJson.root.children.map((child: any) => renderNode(child)).join('')
}
