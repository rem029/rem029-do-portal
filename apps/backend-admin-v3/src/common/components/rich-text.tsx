import React from 'react'

export const serializeLexical = (node: any): React.ReactNode => {
  if (!node) return null

  if (node.type === 'text') {
    let text = node.text
    if (node.format & 1) text = <strong key={Math.random()}>{text}</strong>
    if (node.format & 2) text = <em key={Math.random()}>{text}</em>
    if (node.format & 4) text = <u key={Math.random()}>{text}</u>
    if (node.format & 8) text = <code key={Math.random()}>{text}</code>
    return text
  }

  if (!node.children) return null

  const children = node.children.map((child: any) => serializeLexical(child))

  switch (node.type) {
    case 'h1':
      return (
        <h1 key={Math.random()} className="text-4xl font-bold mb-4">
          {children}
        </h1>
      )
    case 'h2':
      return (
        <h2 key={Math.random()} className="text-3xl font-bold mb-3">
          {children}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={Math.random()} className="text-2xl font-bold mb-2">
          {children}
        </h3>
      )
    case 'paragraph':
      return (
        <p key={Math.random()} className="mb-4">
          {children}
        </p>
      )
    case 'list':
      if (node.listType === 'bullet') {
        return (
          <ul key={Math.random()} className="list-disc ml-6 mb-4">
            {children}
          </ul>
        )
      } else {
        return (
          <ol key={Math.random()} className="list-decimal ml-6 mb-4">
            {children}
          </ol>
        )
      }
    case 'listitem':
      return <li key={Math.random()}>{children}</li>
    case 'link':
      return (
        <a key={Math.random()} href={node.fields?.url} className="text-primary underline">
          {children}
        </a>
      )
    default:
      return <div key={Math.random()}>{children}</div>
  }
}

export const RichText: React.FC<{ content: any }> = ({ content }) => {
  if (!content) return null

  if (typeof content === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  if (content.root) {
    return <div className="rich-text">{serializeLexical(content.root)}</div>
  }

  return null
}
