'use client'

import { Button } from '@payloadcms/ui'
import React from 'react'
import { handleTestEnvelopeStatus, handleGetRecentEnvelopeId } from '../actions'
import { EnvelopeStatusResult } from '@/services/docusign/envelopes'

const inputStyle: React.CSSProperties = {
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  border: '1px solid var(--theme-elevation-150)',
}

const labelStyle: React.CSSProperties = { color: 'var(--theme-elevation-800)' }
const helperTextStyle: React.CSSProperties = { color: 'var(--theme-elevation-500)' }

const DocuSignTestEnvelopeStatus = () => {
  const [envelopeId, setEnvelopeId] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')
  const [response, setResponse] = React.useState<EnvelopeStatusResult | null>(null)

  React.useEffect(() => {
    handleGetRecentEnvelopeId().then((res) => {
      if (res?.envelopeId) {
        setEnvelopeId((prev) => (prev ? prev : res.envelopeId!))
      }
    })
  }, [])

  const handleTestStatus = async () => {
    setStatus('loading')
    setError('')
    setResponse(null)

    try {
      const result = await handleTestEnvelopeStatus(envelopeId)

      if (!result.success) {
        throw new Error(result.message)
      }

      setStatus('success')
      setResponse(result.response || null)
    } catch (err) {
      setStatus('error')
      setError((err as Error)?.message || 'Unknown error')
    }
  }

  const isButtonDisabled = status === 'loading' || !envelopeId.trim()

  return (
    <div className="flex flex-col gap-4 !w-full max-w-xl mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={labelStyle}>
          Envelope ID
        </label>
        <input
          type="text"
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
          className="rounded px-3 py-2 text-sm focus:outline-none font-mono"
          style={inputStyle}
        />
        <span className="text-xs" style={helperTextStyle}>
          DocuSign Envelope ID (GUID). Defaults to the most recently created envelope if available.
        </span>
      </div>

      <div>
        <Button disabled={isButtonDisabled} onClick={handleTestStatus}>
          Test Status Check
        </Button>
      </div>

      {status === 'loading' && (
        <p className="text-sm" style={helperTextStyle}>
          Retrieving envelope status from DocuSign...
        </p>
      )}

      {status === 'success' && response && (
        <div
          className="flex flex-col gap-2 p-3 rounded text-sm"
          style={{
            background: 'var(--theme-success-50)',
            border: '1px solid var(--theme-success-200)',
            color: 'var(--theme-success-800)',
          }}
        >
          <p className="font-bold" style={{ color: 'var(--theme-success-500)' }}>
            Envelope Status Retrieved Successfully!
          </p>
          <pre
            className="w-full whitespace-pre-wrap break-all max-h-72 overflow-auto p-2 rounded text-xs font-mono"
            style={{
              background: 'var(--theme-elevation-0)',
              color: 'var(--theme-elevation-800)',
              border: '1px solid var(--theme-success-150)',
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {status === 'error' && (
        <pre
          className="w-full whitespace-pre-wrap break-all max-h-72 overflow-auto p-2 rounded text-sm"
          style={{
            background: 'var(--theme-error-50)',
            color: 'var(--theme-error-600)',
            border: '1px solid var(--theme-error-200)',
          }}
        >
          Status check failed: {error}
        </pre>
      )}
    </div>
  )
}

export default DocuSignTestEnvelopeStatus
