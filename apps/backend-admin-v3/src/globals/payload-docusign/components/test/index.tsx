'use client'

import { useField, Button } from '@payloadcms/ui'
import React from 'react'
import { handleTestDocuSignConnection } from '../actions'

const DocuSignSettingsTest = () => {
  const { value: statusReaderUserId } = useField<string>({ path: 'status_reader_user_id' })

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const handleTestConnection = async () => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleTestDocuSignConnection(statusReaderUserId)

      if (!result.success) {
        throw new Error(result.message)
      }

      setStatus('success')
      setSuccess(result.response ? JSON.stringify(result.response, null, 2) : result.message)
    } catch (err) {
      setStatus('error')
      setError((err as Error)?.message || 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col gap-4 !w-full max-w-xl mb-4">
      <Button disabled={status === 'loading'} onClick={handleTestConnection}>
        Test Connection
      </Button>
      {status === 'loading' && (
        <p style={{ color: 'var(--theme-elevation-500)' }}>Testing DocuSign connection...</p>
      )}
      {status === 'success' && (
        <p style={{ fontWeight: 700, color: 'var(--theme-success-500)' }}>Connection Successful!</p>
      )}
      {status === 'success' && success && (
        <pre
          className="w-full whitespace-pre-wrap break-all max-h-72 overflow-auto p-2 rounded text-sm"
          style={{
            background: 'var(--theme-elevation-50)',
            color: 'var(--theme-elevation-800)',
            border: '1px solid var(--theme-elevation-150)',
          }}
        >
          {success}
        </pre>
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
          Connection failed: {error}
        </pre>
      )}
    </div>
  )
}

export default DocuSignSettingsTest
