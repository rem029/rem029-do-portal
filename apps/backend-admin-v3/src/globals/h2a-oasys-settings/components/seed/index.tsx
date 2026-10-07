'use client'
import { useField, Button } from '@payloadcms/ui'
import React from 'react'
import { handleSeedH2ADatabase } from '../actions'

const H2aOasysSettingsSeed: React.FC = () => {
  const { value: clientId } = useField({ path: 'client_id' })
  const { value: secret } = useField({ path: 'secret' })
  const { value: baseUrl } = useField({ path: 'base_url' })

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const shouldDisable = !clientId || !secret || !baseUrl || status === 'loading'

  const handleOnClickSeed = async () => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleSeedH2ADatabase()

      if (result.success) {
        setStatus('success')
        setSuccess(result.message)
      } else {
        setStatus('error')
        setError(result.message)
      }
    } catch (err) {
      setStatus('error')
      setError((err as Error)?.message || 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" disabled={shouldDisable} onClick={handleOnClickSeed}>
        Seed H2A Database
      </Button>

      {status === 'loading' && <p>Seeding H2A Database via API...</p>}
      {status === 'success' && <p className="font-bold">Seed Successful!</p>}
      {status === 'success' && <pre className="w-full text-wrap overflow-x-auto">{success}</pre>}
      {status === 'error' && (
        <pre className="text-red-600 w-full text-wrap overflow-x-auto">Seed failed: {error}</pre>
      )}
    </div>
  )
}

export default H2aOasysSettingsSeed
