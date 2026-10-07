'use client'

import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { useField } from '@payloadcms/ui'
import React, { useState } from 'react'

const LinkShortenerURL = () => {
  const { value } = useField({ path: 'slug' })
  const url = `${BACKEND_URL_WITH_BASE}/link/${value as string}`
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (value)
    return (
      <div className="flex flex-col gap-2 py-4">
        <span className="text-sm font-semibold opacity-50">URL Preview:</span>
        <div className="flex items-center gap-2">
          <a
            type="button"
            className="link text-primary font-medium"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '4px 0px', boxSizing: 'border-box' }}
          >
            {url}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-sm btn-outline btn-primary"
            style={{ marginLeft: '10px' }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    )

  return <></>
}

export default LinkShortenerURL
