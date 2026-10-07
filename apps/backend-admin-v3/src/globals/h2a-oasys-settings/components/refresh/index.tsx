'use client'
import { useField, Button } from '@payloadcms/ui'
import { Payload } from 'payload'
import React from 'react'
import {
  handleRefreshH2aOasysData,
  handleSyncH2ADepartment,
  handleSyncH2AUsers,
  handleSeedH2ADatabase,
} from '../actions'

const H2aOasysSettingsRefresh: React.FC = () => {
  const { value: clientId } = useField({ path: 'client_id' })
  const { value: secret } = useField({ path: 'secret' })
  const { value: baseUrl } = useField({ path: 'base_url' })

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const shouldDisable = !clientId || !secret || !baseUrl || status === 'loading'

  const handleOnClickRefresh = async (e: React.MouseEvent<Element, MouseEvent>) => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleRefreshH2aOasysData()

      if (result.success) {
        setStatus('success')
        setSuccess(result.message)
      } else {
        setStatus('error')
        setError(result.message)
      }
    } catch (error) {
      setStatus('error')
      setError((error as Error)?.message || 'unknown error')
      return
    }
  }

  const handleOnClickSyncDepartment = async (e: React.MouseEvent<Element, MouseEvent>) => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleSyncH2ADepartment()

      if (result.success) {
        setStatus('success')
        setSuccess(result.message)
      } else {
        setStatus('error')
        setError(result.message)
      }
    } catch (error) {
      setStatus('error')
      setError((error as Error)?.message || 'unknown error')
      return
    }
  }

  const handleOnClickSyncUsers = async (e: React.MouseEvent<Element, MouseEvent>) => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleSyncH2AUsers('create')

      if (result.success) {
        setStatus('success')
        setSuccess(result.message)
      } else {
        setStatus('error')
        setError(result.message)
      }
    } catch (error) {
      setStatus('error')
      setError((error as Error)?.message || 'unknown error')
      return
    }
  }

  const handleOnClicUpdateUsers = async (e: React.MouseEvent<Element, MouseEvent>) => {
    setStatus('loading')
    setError('')
    setSuccess('')

    try {
      const result = await handleSyncH2AUsers('update')

      if (result.success) {
        setStatus('success')
        setSuccess(result.message)
      } else {
        setStatus('error')
        setError(result.message)
      }
    } catch (error) {
      setStatus('error')
      setError((error as Error)?.message || 'unknown error')
      return
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <Button type="button" disabled={shouldDisable} onClick={handleOnClickRefresh}>
          Run Refresh Job
        </Button>

        <Button type="button" disabled={shouldDisable} onClick={handleOnClickSyncDepartment}>
          Sync Department
        </Button>

        <Button type="button" disabled={shouldDisable} onClick={handleOnClickSyncUsers}>
          Sync Users
        </Button>

        <Button type="button" disabled={shouldDisable} onClick={handleOnClicUpdateUsers}>
          Update Users
        </Button>
      </div>

      {status === 'loading' && <p>Refreshing/Syncing...</p>}
      {status === 'success' && <p className="font-bold">Operation Successfull!</p>}
      {status === 'success' && <p>Response:</p>}
      {status === 'success' && <pre className="w-full text-wrap overflow-x-auto">{success}</pre>}
      {status === 'error' && (
        <pre className="text-red-600 w-full text-wrap overflow-x-auto">
          Connection failed: {error}
        </pre>
      )}
    </div>
  )
}

export default H2aOasysSettingsRefresh
