'use client'

import React from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'

/**
 * SignaturePreview – renders the saved base64 signature image.
 *
 * Resolves the correct sibling `signature_base64` field automatically based
 * on the component's `path` (the UI field path within the same group).
 *
 * e.g. "signature_group.preview" → reads "signature_group.signature_base64"
 */
export const SignaturePreview: React.FC<{ path: string }> = ({ path }) => {
  const base64Path = path.replace(/\.[^.]+$/, '.signature_base64')
  const { value: signature } = useField<string>({ path: base64Path })

  if (!signature) {
    return (
      <div className="mb-6">
        <FieldLabel label="Signature Preview" />
        <p
          style={{
            color: 'var(--theme-elevation-400)',
            fontStyle: 'italic',
            margin: 0,
            fontSize: '0.875rem',
          }}
        >
          No signature saved yet.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col gap-2">
      <FieldLabel label="Signature Preview" />
      <div
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          padding: '8px',
          width: 'fit-content',
        }}
      >
        <img
          src={signature}
          alt="Signature Preview"
          style={{ maxWidth: '100%', maxHeight: '80px', height: 'auto' }}
        />
      </div>
    </div>
  )
}
