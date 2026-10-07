'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, toast, useAuth, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import type { User } from '@/payload-types'
import { resendSurveyInvitation, type ResendInvitationResult } from './actions'

interface ResendButtonProps {
  invitationId: string
  onResult?: (result: ResendInvitationResult) => void
}

/**
 * Sends the invitation email right away (no job queue) with the row's existing code, then shows a
 * success/error toast. Callers hide it for `responded` rows (the code is spent).
 */
const ResendButton: React.FC<ResendButtonProps> = ({ invitationId, onResult }) => {
  const { user } = useAuth<User>()
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!user?.id || pending) return
    setPending(true)
    try {
      const result = await resendSurveyInvitation(user.id, invitationId)
      if (result.success) {
        toast.success('Invitation email sent.')
      } else {
        toast.error(`Resend failed: ${result.error || 'unknown error'}`)
      }
      onResult?.(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Resend failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Button buttonStyle="secondary" size="small" margin={false} disabled={pending} onClick={handleClick}>
      {pending ? 'Sending…' : 'Resend Email'}
    </Button>
  )
}

/** List-view Cell for the `resend` UI field. Refreshes the list so the status column updates. */
export const ResendButtonCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const router = useRouter()
  const invitationId = typeof rowData?.id === 'string' ? rowData.id : String(rowData?.id ?? '')

  if (rowData?.status === 'responded' || !invitationId) {
    return <span style={{ opacity: 0.5 }}>—</span>
  }

  return <ResendButton invitationId={invitationId} onResult={() => router.refresh()} />
}

/**
 * Edit-view Field for the `resend` UI field. Writes the new status/sent_at/error back into the
 * form (as saved values) so a later Save doesn't overwrite them with the stale ones.
 */
export const ResendButtonField: React.FC = () => {
  const { id } = useDocumentInfo()
  const { dispatchFields } = useForm()
  const status = useFormFields(([fields]) => fields.status?.value)

  if (!id || status === 'responded') return null

  const syncField = (path: string, value: unknown) =>
    dispatchFields({ type: 'UPDATE', path, value, initialValue: value })

  const handleResult = (result: ResendInvitationResult) => {
    if (!result.status) return
    syncField('status', result.status)
    if (result.sentAt) syncField('sent_at', result.sentAt)
    syncField('error_message', result.success ? null : (result.error ?? null))
  }

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <ResendButton invitationId={String(id)} onResult={handleResult} />
    </div>
  )
}

export default ResendButtonCell
