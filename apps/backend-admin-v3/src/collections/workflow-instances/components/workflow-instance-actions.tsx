'use client'

import React, { useState } from 'react'
import { useDocumentInfo, SaveButton } from '@payloadcms/ui'
import { retryNotificationsAction, reassignReviewerAction } from '../actions'

const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
  height: 32,
  padding: '0 12px',
  background: disabled ? '#9ca3af' : color,
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: 'nowrap',
})

export default function WorkflowInstanceActions() {
  const { id } = useDocumentInfo()

  const [retrying, setRetrying] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [reassignEmail, setReassignEmail] = useState('')
  const [reassigning, setReassigning] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const handleRetry = async () => {
    if (!id || typeof id !== 'string') return
    setRetrying(true)
    setMessage(null)
    try {
      const data = await retryNotificationsAction(id)
      setMessage({ text: `Sent ${data.sent} notification(s)`, isError: false })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Retry failed', isError: true })
    } finally {
      setRetrying(false)
    }
  }

  const handleReassign = async () => {
    if (!id || typeof id !== 'string' || !reassignEmail.trim()) return
    setReassigning(true)
    setMessage(null)
    try {
      const data = await reassignReviewerAction(id, reassignEmail.trim())
      setMessage({ text: `Reassigned — sent ${data.sent} notification(s)`, isError: false })
      setShowReassign(false)
      setReassignEmail('')
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Reassign failed', isError: true })
    } finally {
      setReassigning(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <SaveButton />

      <button type="button" onClick={handleRetry} disabled={retrying || !id} style={btnStyle('#059669', retrying || !id)}>
        {retrying ? 'Retrying...' : 'Retry Notifications'}
      </button>

      <button type="button" onClick={() => { setShowReassign((v) => !v); setMessage(null) }} disabled={!id} style={btnStyle('#d97706', !id)}>
        Reassign Reviewer
      </button>

      {showReassign && (
        <>
          <input
            type="email"
            value={reassignEmail}
            onChange={(e) => setReassignEmail(e.target.value)}
            placeholder="New reviewer email"
            style={{ height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13, width: 220 }}
          />
          <button type="button" onClick={handleReassign} disabled={reassigning || !reassignEmail.trim()} style={btnStyle('#d97706', reassigning || !reassignEmail.trim())}>
            {reassigning ? 'Reassigning...' : 'Confirm'}
          </button>
          <button type="button" onClick={() => { setShowReassign(false); setReassignEmail('') }} style={btnStyle('#6b7280', false)}>
            Cancel
          </button>
        </>
      )}

      {message && (
        <span style={{ fontSize: 12, color: message.isError ? '#ef4444' : '#059669' }}>
          {message.text}
        </span>
      )}
    </div>
  )
}
