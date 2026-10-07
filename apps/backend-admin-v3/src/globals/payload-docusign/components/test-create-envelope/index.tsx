'use client'

import { useAuth, Button } from '@payloadcms/ui'
import React from 'react'
import { User } from '@/payload-types'
import { handleTestCreateEnvelope, handleListDocuSignUsers } from '../actions'

const inputStyle: React.CSSProperties = {
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  border: '1px solid var(--theme-elevation-150)',
}

const labelStyle: React.CSSProperties = { color: 'var(--theme-elevation-800)' }
const helperTextStyle: React.CSSProperties = { color: 'var(--theme-elevation-500)' }

const DocuSignTestCreateEnvelope = () => {
  const { user } = useAuth<User>()

  const [senderEmail, setSenderEmail] = React.useState('')
  const [recipientEmail, setRecipientEmail] = React.useState('')
  const [initialized, setInitialized] = React.useState(false)
  const [docuSignUsers, setDocuSignUsers] = React.useState<{ email: string; userName?: string }[]>(
    [],
  )

  React.useEffect(() => {
    // Suggestions only - the sender must be a real DocuSign user (impersonated via
    // JWT), but recipients can be any email, so this list is never used to restrict
    // input, only to autocomplete the Sender Email field.
    handleListDocuSignUsers().then((result) => {
      if (result.success && result.users) {
        setDocuSignUsers(result.users)
      }
    })
  }, [])

  const [status, setStatus] = React.useState<
    'idle' | 'loading' | 'success' | 'consent_required' | 'error'
  >('idle')
  const [error, setError] = React.useState('')
  const [response, setResponse] = React.useState<{
    envelopeId: string
    senderViewUrl: string
  } | null>(null)
  const [authorizationUrl, setAuthorizationUrl] = React.useState('')

  React.useEffect(() => {
    if (user?.email && !initialized) {
      setSenderEmail(user.email)
      setRecipientEmail(user.email)
      setInitialized(true)
    }
  }, [user, initialized])

  const handleTest = async () => {
    setStatus('loading')
    setError('')
    setResponse(null)
    setAuthorizationUrl('')

    try {
      const result = await handleTestCreateEnvelope({
        senderEmail,
        recipientEmail,
      })

      if (!result.success) {
        if (result.authorizationUrl) {
          setStatus('consent_required')
          setAuthorizationUrl(result.authorizationUrl)
          return
        }
        throw new Error(result.message)
      }

      setStatus('success')
      setResponse(result.response || null)
    } catch (err) {
      setStatus('error')
      setError((err as Error)?.message || 'Unknown error')
    }
  }

  const isButtonDisabled = status === 'loading' || !senderEmail.trim() || !recipientEmail.trim()

  return (
    <div className="flex flex-col gap-4 !w-full max-w-xl mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={labelStyle}>
          Sender Email
        </label>
        <input
          type="email"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          placeholder="e.g. sender@company.com"
          list="docusign-sender-suggestions"
          className="rounded px-3 py-2 text-sm focus:outline-none"
          style={inputStyle}
        />
        <datalist id="docusign-sender-suggestions">
          {docuSignUsers.map((u) => (
            <option key={u.email} value={u.email}>
              {u.userName ? `${u.userName} (${u.email})` : u.email}
            </option>
          ))}
        </datalist>
        <span className="text-xs" style={helperTextStyle}>
          DocuSign user account to impersonate (must be registered in DocuSign). Suggestions are
          loaded from DocuSign, but you can type any email.
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold" style={labelStyle}>
          Recipient Email
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="e.g. recipient@company.com"
          list="docusign-sender-suggestions"
          className="rounded px-3 py-2 text-sm focus:outline-none"
          style={inputStyle}
        />
        <span className="text-xs" style={helperTextStyle}>
          Recipient who will be set as a signer on the draft envelope. Doesn&apos;t need to be a
          DocuSign user - any email works. Suggestions shown are just the known DocuSign users for
          convenience.
        </span>
      </div>

      <div>
        <Button disabled={isButtonDisabled} onClick={handleTest}>
          Test Create Envelope
        </Button>
      </div>

      {status === 'loading' && (
        <p className="text-sm" style={helperTextStyle}>
          Creating test draft envelope...
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
            Draft Envelope Created Successfully!
          </p>
          <p>
            <strong style={{ color: 'var(--theme-success-800)' }}>Envelope ID:</strong>{' '}
            <code
              className="px-1 py-0.5 rounded text-xs"
              style={{ background: 'var(--theme-success-100)', color: 'var(--theme-success-800)' }}
            >
              {response.envelopeId}
            </code>
          </p>
          <div className="mt-1">
            <Button
              el="anchor"
              url={response.senderViewUrl}
              newTab
              buttonStyle="secondary"
              size="small"
            >
              Open Sender View (Tagging Screen) &rarr;
            </Button>
          </div>
        </div>
      )}

      {status === 'consent_required' && authorizationUrl && (
        <div
          className="flex flex-col gap-2 p-3 rounded text-sm"
          style={{
            background: 'var(--theme-warning-50)',
            border: '1px solid var(--theme-warning-200)',
            color: 'var(--theme-warning-800)',
          }}
        >
          <p className="font-bold" style={{ color: 'var(--theme-warning-800)' }}>
            DocuSign Consent Required
          </p>
          <p style={{ color: 'var(--theme-warning-700)' }}>
            The sender account ({senderEmail}) has not granted JWT impersonation consent to this
            application yet.
          </p>
          <div className="mt-1">
            <Button el="anchor" url={authorizationUrl} newTab buttonStyle="primary" size="small">
              Connect your DocuSign account &rarr;
            </Button>
          </div>
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
          Creation failed: {error}
        </pre>
      )}
    </div>
  )
}

export default DocuSignTestCreateEnvelope
