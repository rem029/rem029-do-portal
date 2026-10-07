'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useField, SelectInput, FieldLabel, TextInput, CheckboxInput, Button } from '@payloadcms/ui'
import type { RelationshipFieldClientProps } from 'payload'
import { searchEventStaffUsersAction, createEventStaffUserAction } from './actions'

/* -------------------------------------------------------------------------- */
/* icons — one stroke weight, currentColor                                    */
/* -------------------------------------------------------------------------- */

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const CloseIcon = () => (
  <svg {...iconProps}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const CheckIcon = () => (
  <svg {...iconProps}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const CopyIcon = () => (
  <svg {...iconProps}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const PlusIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/* clipboard — works outside a secure context (HTTP admin over LAN)           */
/* -------------------------------------------------------------------------- */

const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the execCommand path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* password hand-off banner                                                   */
/* -------------------------------------------------------------------------- */

interface PasswordBannerProps {
  email: string
  password: string
  emailed: boolean
  onDismiss: () => void
}

const PasswordBanner: React.FC<PasswordBannerProps> = ({ email, password, emailed, onDismiss }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const ok = await copyText(password)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }, [password])

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 0.75)',
        padding: 'calc(var(--base) * 0.75)',
        border: '1px solid var(--theme-success-500)',
        borderRadius: 'var(--style-radius-m)',
        background: 'var(--theme-success-50)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--base)',
          marginBottom: 'calc(var(--base) * 0.5)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--theme-success-700)',
          }}
        >
          <CheckIcon />
          Account created for {email}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            display: 'inline-flex',
            padding: 4,
            border: 0,
            background: 'transparent',
            color: 'var(--theme-success-700)',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          <CloseIcon />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 'calc(var(--base) * 0.5)' }}>
        <input
          type="text"
          readOnly
          value={password}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
            fontSize: 14,
            letterSpacing: '0.02em',
            padding: '6px 10px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            background: 'var(--theme-input-bg, var(--theme-elevation-0))',
            color: 'var(--theme-elevation-800)',
          }}
        />
        <Button buttonStyle="secondary" size="small" onClick={handleCopy} icon={<CopyIcon />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <p
        style={{
          margin: '6px 0 0',
          fontSize: 12,
          fontStyle: 'italic',
          color: 'var(--theme-success-700)',
          opacity: 0.85,
        }}
      >
        {emailed
          ? "Sign-in details were emailed to the staff member. Copy the password here too — it won't be shown again."
          : "Share this password with the staff member — it won't be shown again."}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* inline "new staff member" form                                             */
/* -------------------------------------------------------------------------- */

interface MiniCreateFormProps {
  email: string
  fullName: string
  sendInvite: boolean
  isSubmitting: boolean
  error: string | null
  onEmailChange: (val: string) => void
  onFullNameChange: (val: string) => void
  onSendInviteChange: (val: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

const MiniCreateForm: React.FC<MiniCreateFormProps> = ({
  email,
  fullName,
  sendInvite,
  isSubmitting,
  error,
  onEmailChange,
  onFullNameChange,
  onSendInviteChange,
  onSubmit,
  onCancel,
}) => (
  <div
    style={{
      marginTop: 'calc(var(--base) * 0.75)',
      padding: 'var(--base)',
      border: '1px solid var(--theme-elevation-150)',
      borderRadius: 'var(--style-radius-m)',
      background: 'var(--theme-elevation-50)',
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--theme-elevation-450)',
        marginBottom: 'calc(var(--base) * 0.75)',
      }}
    >
      New staff member
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'calc(var(--base) * 0.75)',
      }}
    >
      <TextInput
        path="__newStaffEmail"
        label="Email"
        required
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
        readOnly={isSubmitting}
        placeholder="staff@dohaoasis.com"
      />
      <TextInput
        path="__newStaffFullName"
        label="Full name"
        value={fullName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFullNameChange(e.target.value)}
        readOnly={isSubmitting}
        placeholder="Optional"
      />
    </div>

    <div className="field-type checkbox" style={{ marginTop: 'calc(var(--base) * 0.5)' }}>
      <CheckboxInput
        label="Send login details to the staff member by email"
        checked={sendInvite}
        onToggle={(e: React.ChangeEvent<HTMLInputElement>) => onSendInviteChange(e.target.checked)}
        readOnly={isSubmitting}
      />
    </div>

    {error && (
      <p
        role="alert"
        style={{
          margin: 'calc(var(--base) * 0.75) 0 0',
          padding: '8px 10px',
          fontSize: 13,
          color: 'var(--theme-error-700)',
          background: 'var(--theme-error-50)',
          border: '1px solid var(--theme-error-500)',
          borderRadius: 'var(--style-radius-s)',
        }}
      >
        {error}
      </p>
    )}

    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'calc(var(--base) * 0.5)',
        marginTop: 'var(--base)',
      }}
    >
      <Button buttonStyle="secondary" size="small" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button size="small" onClick={onSubmit} disabled={isSubmitting || !email.trim()}>
        {isSubmitting ? 'Creating…' : 'Create staff member'}
      </Button>
    </div>
  </div>
)

/* -------------------------------------------------------------------------- */
/* the field                                                                  */
/* -------------------------------------------------------------------------- */

export const StaffUserField: React.FC<RelationshipFieldClientProps> = (props) => {
  const { path = 'user', field } = props
  const { value, setValue, showError } = useField<string | number>({ path })

  // Sibling `event` field: standalone form → 'event'; nested → swap last segment.
  const eventPath = path.includes('.') ? path.replace(/\.[^.]+$/, '.event') : 'event'
  const { value: eventValue } = useField<unknown>({ path: eventPath })

  const eventId = useMemo(() => {
    if (!eventValue) return ''
    if (typeof eventValue === 'string') return eventValue
    if (typeof eventValue === 'number') return String(eventValue)
    if (typeof eventValue === 'object' && eventValue !== null) {
      const obj = eventValue as { id?: string | number; value?: string | number }
      if (obj.id !== undefined) return String(obj.id)
      if (obj.value !== undefined) return String(obj.value)
    }
    return ''
  }, [eventValue])

  const selectedUserId = useMemo(() => {
    if (!value) return ''
    if (typeof value === 'object' && value !== null) {
      const v = value as { id?: string | number }
      return v.id !== undefined ? String(v.id) : ''
    }
    return String(value)
  }, [value])

  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [sendInvite, setSendInvite] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [createdPasswordInfo, setCreatedPasswordInfo] = useState<{
    email: string
    password: string
    emailed: boolean
  } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 250)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!eventId) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    searchEventStaffUsersAction({
      query: debouncedQuery,
      eventId,
      selectedId: selectedUserId || undefined,
    })
      .then((res) => {
        if (cancelled) return
        setOptions(
          res.success && res.data
            ? res.data.map((u) => ({
                label: u.full_name ? `${u.full_name} — ${u.email}` : u.email,
                value: String(u.id),
              }))
            : [],
        )
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, eventId, selectedUserId])

  const handleCreateUser = useCallback(async () => {
    const trimmedEmail = newEmail.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCreateError('Enter a valid email address.')
      return
    }
    if (!eventId) {
      setCreateError('Pick an event first.')
      return
    }

    setIsSubmitting(true)
    setCreateError(null)
    try {
      const res = await createEventStaffUserAction({
        email: trimmedEmail,
        fullName: newFullName.trim() || undefined,
        eventId,
        sendInvite,
      })
      if (!res.success) {
        setCreateError(res.error)
        return
      }
      const { id, email, generatedPassword } = res.data
      const label = newFullName.trim() ? `${newFullName.trim()} — ${email}` : email
      setOptions((prev) => [
        { label, value: String(id) },
        ...prev.filter((o) => o.value !== String(id)),
      ])
      setValue(String(id))
      setCreatedPasswordInfo({ email, password: generatedPassword, emailed: sendInvite })
      setIsCreating(false)
      setNewEmail('')
      setNewFullName('')
      setCreateError(null)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create the staff member.')
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, newEmail, newFullName, sendInvite, setValue])

  const label = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--base)',
        marginBottom: 6,
      }}
    >
      <FieldLabel
        label={typeof field?.label === 'string' ? field.label : 'Staff user'}
        required={field?.required}
        path={path}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--base) * 0.5)' }}>
        {!eventId && (
          <span style={{ fontSize: 11, color: 'var(--theme-warning-600, var(--theme-elevation-500))' }}>
            Pick an event first
          </span>
        )}
        <Button
          buttonStyle={isCreating ? 'secondary' : 'transparent'}
          size="small"
          disabled={!eventId}
          onClick={() => {
            setIsCreating((prev) => !prev)
            setCreateError(null)
          }}
          icon={isCreating ? undefined : <PlusIcon />}
        >
          {isCreating ? 'Cancel' : 'New staff member'}
        </Button>
      </div>
    </div>
  )

  const afterInput = (
    <>
      {createdPasswordInfo && (
        <PasswordBanner
          email={createdPasswordInfo.email}
          password={createdPasswordInfo.password}
          emailed={createdPasswordInfo.emailed}
          onDismiss={() => setCreatedPasswordInfo(null)}
        />
      )}
      {isCreating && (
        <MiniCreateForm
          email={newEmail}
          fullName={newFullName}
          sendInvite={sendInvite}
          isSubmitting={isSubmitting}
          error={createError}
          onEmailChange={(val) => {
            setNewEmail(val)
            setCreateError(null)
          }}
          onFullNameChange={setNewFullName}
          onSendInviteChange={setSendInvite}
          onSubmit={handleCreateUser}
          onCancel={() => {
            setIsCreating(false)
            setCreateError(null)
          }}
        />
      )}
    </>
  )

  return (
    <SelectInput
      path={path}
      name={path}
      Label={label}
      AfterInput={afterInput}
      required={field?.required}
      description={field?.admin?.description}
      options={options}
      value={selectedUserId}
      onChange={(selected) => {
        // Structural cast: `selected` is a ReactSelectOption for a single select.
        const opt = selected as unknown as { value?: string | number } | null | undefined
        setValue(opt?.value !== undefined ? String(opt.value) : null)
      }}
      onInputChange={(val: string) => setSearchQuery(val)}
      filterOption={() => true}
      isClearable
      showError={showError}
      placeholder={
        !eventId
          ? 'Pick an event first'
          : loading
            ? 'Loading staff…'
            : 'Search or select a staff member'
      }
      readOnly={!eventId}
    />
  )
}

export default StaffUserField
