'use client'
import { useField, Button } from '@payloadcms/ui'
import React from 'react'
import { handleTestH2aOasysConnection } from '../actions'

const H2aOasysSettingsTest = () => {
  const { value: clientId } = useField({ path: 'client_id' })
  const { value: secret } = useField({ path: 'secret' })
  const { value: baseUrl } = useField({ path: 'base_url' })
  const { setValue: setLastToken } = useField({ path: 'last_token_response' })
  const { setValue: setLastTokenUpdatedBy } = useField({
    path: 'last_token_response_updated_by',
  })

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const shouldDisable = !clientId || !secret || !baseUrl || status === 'loading'

  const handleTestConnection = async (e: React.MouseEvent<Element, MouseEvent>) => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleTestH2aOasysConnection({
        clientId: clientId as string,
        secret: secret as string,
        baseUrl: baseUrl as string,
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      const response = result.response

      setStatus('success')
      setSuccess(JSON.stringify(response, null, 4))
      setLastToken(response?.access_token)
      setLastTokenUpdatedBy(new Date().toISOString())
    } catch (error) {
      setStatus('error')
      setError((error as Error)?.message || 'unknown error')
      return
    }
  }

  return (
    <div className="flex flex-col gap-4 !w-full">
      <Button disabled={shouldDisable} onClick={handleTestConnection}>
        Test Connection
      </Button>
      {status === 'loading' && <p>Testing connection...</p>}
      {status === 'success' && <p className="font-bold">Connection Successfull!</p>}
      {status === 'success' && <p>Response:</p>}
      {status === 'success' && (
        <pre className="bg-transparent w-full whitespace-pre-wrap break-all max-h-72 overflow-auto p-2 rounded bg-gray-50 text-sm">
          {success}
        </pre>
      )}
      {status === 'error' && (
        <pre className="text-red-600 w-full whitespace-pre-wrap break-all max-h-72 overflow-auto p-2 rounded bg-red-50 text-sm">
          Connection failed: {error}
        </pre>
      )}
    </div>
  )
}

export default H2aOasysSettingsTest
