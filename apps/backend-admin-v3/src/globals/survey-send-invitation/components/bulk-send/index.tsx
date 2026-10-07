'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Banner, Button, CheckboxInput, SelectInput, TextareaInput, useAuth } from '@payloadcms/ui'
import type { OptionObject } from 'payload'
import type { User } from '@/payload-types'
import {
  countExistingInvitations,
  fetchSurveyDepartmentOptions,
  fetchSurveyForms,
  sendBulkSurveyInvitations,
  type ExistingInvitationCounts,
} from './actions'
import { dedupeEmails } from '@/utilities/dedupe-emails'
import './index.scss'

const EMAILS_FIELD_PATH = 'bulkSendEmails'
const FORM_FIELD_PATH = 'bulkSendForm'
const DEPARTMENT_FIELD_PATH = 'bulkSendDepartment'
const RESEND_FIELD_PATH = 'bulkSendResendExisting'
const COUNT_DEBOUNCE_MS = 400

const describeExisting = ({ invited, responded }: ExistingInvitationCounts): string | null => {
  if (invited === 0) return null
  const pending = invited - responded
  const parts = [
    pending > 0 && `${pending} already invited`,
    responded > 0 && `${responded} already responded`,
  ].filter(Boolean)
  return `${parts.join(', ')} for this survey.`
}

/**
 * Bulk-send panel — the sole content of the `survey-send-invitation` global. Posts
 * newline-separated emails to the server action, which validates inputs and queues
 * the background job `survey-bulk-send` to process invitation generation and email
 * dispatch asynchronously.
 *
 * Uses `@payloadcms/ui` field primitives (`TextareaInput`, `SelectInput`, `Button`,
 * `Banner`) so the panel matches the rest of the admin panel rather than pulling in daisyUI
 * classes the admin never loads.
 */
const BulkSendInvitations: React.FC = () => {
  const { user } = useAuth<User>()

  const [formOptions, setFormOptions] = useState<OptionObject[]>([])
  const [formsLoading, setFormsLoading] = useState(true)
  const [formId, setFormId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [deptOptions, setDeptOptions] = useState<OptionObject[]>([])
  const [hasDeptField, setHasDeptField] = useState(false)
  const [deptLoading, setDeptLoading] = useState(false)
  const [emailsText, setEmailsText] = useState('')
  const [resendExisting, setResendExisting] = useState(false)
  const [existingCounts, setExistingCounts] = useState<ExistingInvitationCounts | null>(null)
  const [sending, setSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [topError, setTopError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const loadSurveyForms = async () => {
      setFormsLoading(true)
      try {
        const forms = await fetchSurveyForms(user.id)
        if (!cancelled) {
          setFormOptions(forms.map((doc) => ({ label: doc.title, value: doc.id })))
        }
      } catch (err) {
        if (!cancelled) {
          setTopError(err instanceof Error ? err.message : 'Failed to load survey forms')
        }
      } finally {
        if (!cancelled) {
          setFormsLoading(false)
        }
      }
    }

    loadSurveyForms()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    setDepartmentId('')
    setHasDeptField(false)
    setDeptOptions([])
    if (!user?.id || !formId) return
    let cancelled = false
    setDeptLoading(true)

    fetchSurveyDepartmentOptions(user.id, formId)
      .then((res) => {
        if (!cancelled) {
          setHasDeptField(res.hasDepartmentField)
          setDeptOptions(res.options.map((opt) => ({ label: opt.title, value: opt.id })))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasDeptField(false)
          setDeptOptions([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDeptLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, formId])

  const parsedEmails = useMemo(
    () => dedupeEmails(emailsText.split('\n')),
    [emailsText],
  )

  useEffect(() => {
    setExistingCounts(null)
    if (!user?.id || !formId || parsedEmails.length === 0) return
    let cancelled = false

    const timer = setTimeout(() => {
      countExistingInvitations(user.id, formId, parsedEmails)
        .then((counts) => {
          if (!cancelled) setExistingCounts(counts)
        })
        .catch(() => {
          // The count is informational only; the send itself still dedupes server-side.
        })
    }, COUNT_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [user?.id, formId, parsedEmails])

  const existingNote = existingCounts ? describeExisting(existingCounts) : null

  const handleSend = useCallback(async () => {
    setTopError(null)
    setSuccessMessage(null)

    if (!user?.id) {
      setTopError('You must be logged in to send invitations.')
      return
    }

    if (!formId) {
      setTopError('Select a survey form first.')
      return
    }

    if (parsedEmails.length === 0) {
      setTopError('Paste at least one email address.')
      return
    }

    setSending(true)
    try {
      const result = await sendBulkSurveyInvitations(
        user.id,
        formId,
        parsedEmails,
        resendExisting,
        departmentId || undefined,
      )

      if (!result.success) {
        setTopError(result.error || 'Send failed')
        return
      }

      // Jobs run asynchronously, so the pre-send counts are stale and a recount now would be too.
      setExistingCounts(null)
      const count = result.queuedCount ?? parsedEmails.length
      const title = result.formTitle ? `'${result.formTitle}'` : 'the survey'
      setSuccessMessage(
        `Queued ${count} invitation${count === 1 ? '' : 's'} for ${title}. Track delivery status in the Survey Invitations list.`,
      )
    } catch (err) {
      setTopError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }, [user?.id, parsedEmails, formId, resendExisting, departmentId])

  return (
    <div className="bulk-send">
      <div className="bulk-send__header">
        <h4 className="bulk-send__title">Bulk send survey invitations</h4>
        <p className="bulk-send__description">
          Paste one email per line, pick the survey, and each recipient gets a unique single-use
          code and a link to the survey.
        </p>
      </div>

      <div className="bulk-send__fields">
        <div className="field-type textarea">
          <TextareaInput
            path={EMAILS_FIELD_PATH}
            label="Recipient emails"
            placeholder={'jane.doe@example.com\njohn.smith@example.com'}
            rows={6}
            value={emailsText}
            readOnly={sending}
            onChange={(e) => setEmailsText(e.target.value)}
          />
          <p className="bulk-send__hint">
            {parsedEmails.length} unique {parsedEmails.length === 1 ? 'address' : 'addresses'}
          </p>
        </div>

        <div className="field-type select bulk-send__form-field">
          <SelectInput
            path={FORM_FIELD_PATH}
            name={FORM_FIELD_PATH}
            label="Survey form"
            options={formOptions}
            value={formId || undefined}
            readOnly={sending || formsLoading}
            isClearable
            placeholder={formsLoading ? 'Loading survey forms…' : 'Select a survey form'}
            onChange={(option) => {
              const selected = Array.isArray(option) ? option[0] : option
              const nextValue = selected?.value
              setFormId(typeof nextValue === 'string' ? nextValue : '')
            }}
          />
        </div>

        {hasDeptField && (
          <div className="field-type select bulk-send__department-field">
            <SelectInput
              path={DEPARTMENT_FIELD_PATH}
              name={DEPARTMENT_FIELD_PATH}
              label="Department"
              options={deptOptions}
              value={departmentId || undefined}
              readOnly={sending || deptLoading}
              isClearable
              placeholder={
                deptLoading
                  ? 'Loading departments…'
                  : 'No department (respondent chooses)'
              }
              onChange={(option) => {
                const selected = Array.isArray(option) ? option[0] : option
                const nextValue = selected?.value
                setDepartmentId(typeof nextValue === 'string' ? nextValue : '')
              }}
            />
            <p className="bulk-send__hint">
              Codes in this batch will pre-select and lock this department on the survey.
            </p>
          </div>
        )}

        <div className="bulk-send__resend">
          <p className="bulk-send__hint">
            Recipients who already have an invitation for this survey are skipped. Recipients who
            already responded are always skipped.
          </p>
          {existingNote && (
            <p className="bulk-send__hint bulk-send__hint--strong">{existingNote}</p>
          )}
          <CheckboxInput
            id={RESEND_FIELD_PATH}
            name={RESEND_FIELD_PATH}
            label="Resend email to recipients who already have an invitation (same code)"
            checked={resendExisting}
            readOnly={sending}
            onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
              setResendExisting(Boolean(e?.target?.checked))
            }
          />
        </div>
      </div>

      <div className="bulk-send__actions">
        <Button
          buttonStyle="primary"
          disabled={sending || formsLoading || parsedEmails.length === 0 || !formId}
          onClick={handleSend}
        >
          {sending ? 'Sending…' : 'Send invitations'}
        </Button>
      </div>

      {topError && (
        <Banner type="error" className="bulk-send__banner">
          {topError}
        </Banner>
      )}

      {successMessage && (
        <Banner type="success" className="bulk-send__banner">
          {successMessage}
        </Banner>
      )}
    </div>
  )
}

export default BulkSendInvitations
