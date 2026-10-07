'use client'
import React, { useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

interface FrontendUrlPreviewProps {
  collectionSlug?: string
  pathPrefix?: string
  useSlug?: boolean
  label?: string
  /** When false, the collection slug is omitted from the generated path. Default: true. */
  includeCollectionSlug?: boolean
  slugPath?: string
}

const FrontendUrlPreview: React.FC<FrontendUrlPreviewProps> = ({
  collectionSlug: propCollectionSlug,
  pathPrefix = '/letters',
  useSlug = false,
  label = 'Letters Review URL',
  includeCollectionSlug = true,
  slugPath = 'slug',
}) => {
  const { id, collectionSlug: contextCollectionSlug } = useDocumentInfo()
  const { value: slugValue } = useField<string>({ path: slugPath })
  const [copied, setCopied] = useState(false)

  const finalCollectionSlug = propCollectionSlug || contextCollectionSlug

  if (!id || !finalCollectionSlug) {
    return null
  }

  const identifier = useSlug && slugValue ? slugValue : id
  const path = includeCollectionSlug
    ? `${pathPrefix}/${finalCollectionSlug}/${identifier}`.replace(/\/\/+/g, '/')
    : `${pathPrefix}/${identifier}`.replace(/\/\/+/g, '/')
  const finalUrl = `${BACKEND_URL_WITH_BASE}${path}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="field-type ui mb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--theme-elevation-400)] uppercase tracking-wider">
            {label}
          </span>
          <button
            onClick={copyToClipboard}
            type="button"
            className="text-[10px] font-semibold px-2 py-0.5 rounded transition-colors bg-[var(--theme-elevation-100)] text-[var(--theme-elevation-500)] hover:bg-[var(--theme-elevation-200)] border border-[var(--theme-elevation-150)]"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
        <div className="group relative">
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[var(--theme-success-500)] hover:text-[var(--theme-success-600)] underline underline-offset-4 break-all block py-1"
          >
            {finalUrl}
          </a>
          <p className="text-[11px] text-[var(--theme-elevation-400)]">
            Click to view the public page for this document.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FrontendUrlPreview
