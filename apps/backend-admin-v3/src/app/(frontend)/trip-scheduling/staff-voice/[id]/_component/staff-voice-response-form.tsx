'use client'

import React, { useState } from 'react'
import { sendStaffVoiceResponse } from '../actions'

// Keep in sync with the length limit enforced in ../actions.ts.
const MAX_NOTE_LENGTH = 2000

interface StaffVoiceResponseFormProps {
  id: string
  token: string
  requesterEmail: string
}

export function StaffVoiceResponseForm({ id, token, requesterEmail }: StaffVoiceResponseFormProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailQueued, setEmailQueued] = useState<boolean | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await sendStaffVoiceResponse({ id, token, note })

      if (result.success) {
        setEmailQueued(result.emailQueued)
      } else {
        setErrorMessage(result.error)
      }
    } catch {
      setErrorMessage('Something went wrong while sending your response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailQueued !== null) {
    return emailQueued ? (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold space-y-1">
        <p className="uppercase text-sm">Response Sent</p>
        <p className="text-[11px] font-normal text-emerald-600">
          The staff member has been notified by email. This link now shows the submission as
          responded to.
        </p>
      </div>
    ) : (
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center font-bold space-y-1">
        <p className="uppercase text-sm">Response Saved</p>
        <p className="text-[11px] font-normal">
          Your response was recorded, but the email to the staff member could not be sent. Please
          contact them directly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && <p className="text-red-600 font-bold text-[11px]">{errorMessage}</p>}

      <div className="space-y-1.5">
        <label
          htmlFor="staff-voice-response"
          className="block font-bold text-slate-700 uppercase tracking-wide text-[11px]"
        >
          Your Response <span className="text-[#ED1C24]">*</span>
        </label>
        <textarea
          id="staff-voice-response"
          name="note"
          required
          rows={5}
          maxLength={MAX_NOTE_LENGTH}
          disabled={isSubmitting}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a short reply to the staff member..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#DEC37D] resize-none"
        />
        <p className="text-[11px] text-slate-500">
          This will be emailed to <span className="font-semibold">{requesterEmail}</span>. It can
          only be sent once.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center shadow-md disabled:opacity-50"
      >
        {isSubmitting ? 'Sending Response...' : 'Send Response'}
      </button>
    </form>
  )
}
