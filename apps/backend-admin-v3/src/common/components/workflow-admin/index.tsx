'use client'
import React, { useRef, useEffect, useMemo, useTransition } from 'react'
import {
  useAuth,
  useField,
  FieldLabel,
  SelectInput,
  TextareaInput,
  TextInput,
  Button,
  useDocumentInfo,
} from '@payloadcms/ui'
import { User } from '@/payload-types'
import SignatureCanvas from 'react-signature-canvas'
import { v4 as uuidv4 } from 'uuid'
import { saveAs } from 'file-saver'
import createReport from 'docx-templates'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import {
  resendWorkflowNotificationAction,
  uploadInternalMediaAction,
  syncWorkflowSettingsAction,
  updateWorkflowStatusAction,
} from './actions'
import { getDocxTemplateAction } from '../workflow-frontend/actions'

const evaluateConditions = (
  conditions: any[] | null | undefined,
  fieldValues: Record<string, string>,
): boolean => {
  if (!conditions || conditions.length === 0) return true

  return conditions.every((cond) => {
    const currentValue = fieldValues[cond.field] || ''
    const targetValue = cond.value || ''

    if (cond.operator === 'not_equals') {
      return currentValue !== targetValue
    }
    return currentValue === targetValue
  })
}

const AdditionalReviewerTokensView = ({ index }: { index: number }) => {
  const { value: additionalReviewerTokens } = useField<any[]>({
    path: `workflow_reviews.${index}.additional_reviewer_tokens`,
  })

  const tokens = Array.isArray(additionalReviewerTokens) ? additionalReviewerTokens : []
  if (tokens.length === 0) return null

  const responded = tokens.filter((t) => t.response !== 'pending')
  const pending = tokens.filter((t) => t.response === 'pending')

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    >
      <FieldLabel label="Additional Reviewer Responses" />
      {responded.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {responded.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                borderRadius: '4px',
                backgroundColor:
                  t.response === 'approved' || t.response === 'acknowledged'
                    ? 'var(--theme-success-50, rgba(74,222,128,0.08))'
                    : t.response === 'rejected'
                      ? 'var(--theme-error-50, rgba(239,68,68,0.08))'
                      : 'var(--theme-elevation-100)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{t.email}</div>
                {t.comments && (
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    &quot;{t.comments}&quot;
                  </div>
                )}
                {t.reviewed_at && (
                  <div style={{ fontSize: '0.6875rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    {new Date(t.reviewed_at).toLocaleString()}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor:
                    t.response === 'approved' || t.response === 'acknowledged'
                      ? 'var(--theme-success-500, #4ade80)'
                      : t.response === 'rejected'
                        ? 'var(--theme-error-500, #ef4444)'
                        : 'var(--theme-elevation-300)',
                  color: '#fff',
                }}
              >
                {t.response}
              </span>
            </div>
          ))}
        </div>
      )}
      {pending.length > 0 && (
        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          Awaiting response from:{' '}
          {pending
            .map((t) => t.email)
            .filter(Boolean)
            .join(', ')}
        </div>
      )}
    </div>
  )
}

const ReviewItem = ({ index, workflowStatus }: { index: number; workflowStatus: string }) => {
  const { user, fetchFullUser } = useAuth<User>()

  const sigCanvas = useRef<SignatureCanvas>(null)

  // Refresh user data if needed
  useEffect(() => {
    const loadUser = async () => {
      await fetchFullUser()
      return
    }
    if (!user?.email) {
      loadUser()
    }
  }, [user, fetchFullUser])

  // Get specific fields for this row using hooks to ensure reactivity
  const { value: label } = useField<string>({ path: `workflow_reviews.${index}.label` })
  const { value: reviewer } = useField<string>({ path: `workflow_reviews.${index}.reviewer` })
  const { value: statusSlug } = useField<string>({
    path: `workflow_reviews.${index}.status_slug`,
  })
  const { value: response, setValue: setResponse } = useField<string>({
    path: `workflow_reviews.${index}.response`,
  })
  const { value: comments, setValue: setComments } = useField<string>({
    path: `workflow_reviews.${index}.comments`,
  })
  const { value: reviewedBy } = useField<string>({
    path: `workflow_reviews.${index}.reviewed_by`,
  })
  const { value: reviewedAt } = useField<string>({
    path: `workflow_reviews.${index}.reviewed_at`,
  })
  const { value: signature, setValue: setSignature } = useField<string>({
    path: `workflow_reviews.${index}.signature`,
  })
  const { value: approveToken } = useField<string>({
    path: `workflow_reviews.${index}.approve_token`,
  })
  const { value: rejectToken } = useField<string>({
    path: `workflow_reviews.${index}.reject_token`,
  })
  const { value: token, setValue: setToken } = useField<string>({
    path: `workflow_reviews.${index}.token`,
  })
  const { value: canAcknowledge } = useField<boolean>({
    path: `workflow_reviews.${index}.can_acknowledge`,
  })
  const { value: canApprove } = useField<boolean>({
    path: `workflow_reviews.${index}.can_approve`,
  })
  const { value: canReject } = useField<boolean>({
    path: `workflow_reviews.${index}.can_reject`,
  })
  const { value: acknowledgeLabel } = useField<string>({
    path: `workflow_reviews.${index}.acknowledge_label`,
  })
  const { value: approveLabel } = useField<string>({
    path: `workflow_reviews.${index}.approve_label`,
  })
  const { value: rejectLabel } = useField<string>({
    path: `workflow_reviews.${index}.reject_label`,
  })
  const { value: canSkip } = useField<boolean>({
    path: `workflow_reviews.${index}.can_skip`,
  })
  const { value: approverType } = useField<string>({
    path: `workflow_reviews.${index}.approver_type`,
  })
  const { value: skipLabel } = useField<string>({
    path: `workflow_reviews.${index}.skip_label`,
  })
  const { value: canAttach } = useField<boolean>({
    path: `workflow_reviews.${index}.can_attach`,
  })
  const { value: canGenerateWordfile } = useField<boolean>({
    path: `workflow_reviews.${index}.can_generate_wordfile`,
  })
  const { value: enableComment } = useField<boolean>({
    path: `workflow_reviews.${index}.enable_comment`,
  })
  const { value: enableSignature } = useField<boolean>({
    path: `workflow_reviews.${index}.enable_signature`,
  })
  const { value: attachmentLabel } = useField<string>({
    path: `workflow_reviews.${index}.attachment_label`,
  })
  const { value: attachments, setValue: setAttachments } = useField<any[]>({
    path: `workflow_reviews.${index}.attachments`,
  })
  const { value: customFieldsDefinition } = useField<any[]>({
    path: `workflow_reviews.${index}.custom_fields_definition`,
  })
  const { value: customFieldResponses, setValue: setCustomFieldResponses } = useField<any[]>({
    path: `workflow_reviews.${index}.custom_field_responses`,
  })

  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  // Load custom field values into local state for editing
  const [customFieldValues, setCustomFieldValues] = React.useState<Record<string, string>>({})

  useEffect(() => {
    if (customFieldResponses && Array.isArray(customFieldResponses)) {
      const values: Record<string, string> = {}
      customFieldResponses.forEach((resp) => {
        values[resp.name] = resp.value
      })
      setCustomFieldValues(values)
    }
  }, [customFieldResponses])

  // Get all reviews to calculate prior custom field values
  const { value: allReviews } = useField<any[]>({ path: 'workflow_reviews' })

  const priorCustomFieldValues = useMemo(() => {
    const values: Record<string, string> = {}
    if (allReviews && Array.isArray(allReviews)) {
      allReviews.slice(0, index).forEach((review) => {
        if (review.custom_field_responses && Array.isArray(review.custom_field_responses)) {
          review.custom_field_responses.forEach((resp: any) => {
            values[resp.name] = resp.value
          })
        }
      })
    }
    return values
  }, [allReviews, index])

  // Logic derived from the individual field values with useMemo
  const isCurrentStep = useMemo(() => statusSlug === workflowStatus, [statusSlug, workflowStatus])

  const isUserReviewer = useMemo(
    () => user?.email && reviewer === user.email,
    [user?.email, reviewer],
  )

  const canEdit = useMemo(() => isCurrentStep && isUserReviewer, [isCurrentStep, isUserReviewer])

  const { collectionSlug, id: docId } = useDocumentInfo()
  const [isGeneratingWord, setIsGeneratingWord] = React.useState(false)

  // Get field values for template
  const { value: employeeName } = useField<string>({ path: 'employee_name' })
  const { value: employeeId } = useField<string>({ path: 'employee_h2a_id' })
  const { value: employeeDesignation } = useField<string>({ path: 'employee_designation' })
  const { value: employeeDepartmentName } = useField<string>({ path: 'employee_department_name' })
  const { value: employeeEmail } = useField<string>({ path: 'employee_email' })
  const { value: subject } = useField<string>({ path: 'subject' })
  const { value: descriptionRichText } = useField<any>({ path: 'description' })
  const { value: createdAt } = useField<string>({ path: 'createdAt' })

  const handleGenerateWord = React.useCallback(async () => {
    setIsGeneratingWord(true)
    try {
      const result = await getDocxTemplateAction(collectionSlug as string)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch template')
      }

      const { base64 } = result.data
      const templateBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      let introHtml = lexicalToHtml(descriptionRichText)
      if (introHtml) {
        introHtml = `
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Poppins', sans-serif; font-size: 10pt; line-height: 1.5; }
          </style>
          <body>${introHtml}</body>`
      }

      const templateData = {
        staff_name: employeeName || 'Not provided',
        staff_no: employeeId || 'Not provided',
        designation: employeeDesignation || 'Not provided',
        department: employeeDepartmentName || 'Not provided',
        subject: subject || 'Not provided',
        description: introHtml || 'Not provided',
        date: formattedDate,
        email: employeeEmail || 'Not provided',
      }

      const report = await createReport({
        template: new Uint8Array(templateBuffer),
        data: templateData,
        cmdDelimiter: ['{', '}'],
      })

      const filename = `Salary_Deduction_${(employeeName || 'record').replace(/\s+/g, '_')}_v2.docx`
      saveAs(
        new Blob([report as any], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        filename,
      )
    } catch (err) {
      console.error(err)
    } finally {
      setIsGeneratingWord(false)
    }
  }, [
    collectionSlug,
    employeeName,
    employeeId,
    employeeDesignation,
    employeeDepartmentName,
    employeeEmail,
    subject,
    descriptionRichText,
    createdAt,
  ])

  useEffect(() => {
    if (canEdit && signature && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(signature)
    }
  }, [canEdit, signature])

  const clearSignature = () => {
    sigCanvas.current?.clear()
    setSignature('')
  }

  const saveSignature = () => {
    if (sigCanvas.current) {
      // Use toDataURL() directly (saves full canvas) instead of getTrimmedCanvas()
      // to avoid 'trim_canvas... is not a function' link error in Next.js
      setSignature(sigCanvas.current.toDataURL('image/png'))
    }
  }

  const statusBorderColor = useMemo(() => {
    if (response === 'approved') return 'border-l-[var(--theme-success-500)]'
    if (response === 'acknowledged') return 'border-l-[var(--theme-success-500)]'
    if (response === 'rejected') return 'border-l-[var(--theme-error-500)]'
    if (response === 'auto_completed') return 'border-l-[var(--theme-primary-500)]'
    if (response === 'skipped') return 'border-l-[var(--theme-elevation-400)]'
    return 'border-l-[var(--theme-elevation-400)]'
  }, [response])

  return (
    <div
      className={`p-4 border border-[var(--theme-elevation-150)] rounded bg-transparent ${
        isCurrentStep ? 'bg-[var(--theme-elevation-50)]' : ''
      } border-l-4 ${statusBorderColor}`}
    >
      <div className="mb-4">
        <h4 className="m-0">{label}</h4>
        <p className="text-sm text-[var(--theme-elevation-500)] my-1">
          Reviewer: {reviewer} {isUserReviewer && <strong>(You)</strong>}
        </p>
        {user?.super_user && (
          <p className="text-xs text-[var(--theme-elevation-400)] m-0">
            Status Slug: <code>{statusSlug}</code>
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {/* Response Field */}
        <div>
          <FieldLabel label="Response" />
          <SelectInput
            path={`workflow_reviews.${index}.response`}
            name="response"
            options={[
              { label: 'Pending', value: 'pending' },
              ...(approverType === 'requestor_department' ||
              approverType === 'specific_department' ||
              approverType === 'employee' ||
              canAcknowledge
                ? [{ label: acknowledgeLabel || 'Acknowledge', value: 'acknowledged' }]
                : []),
              ...(approverType !== 'requestor_department' &&
              approverType !== 'specific_department' &&
              approverType !== 'employee' &&
              canApprove !== false &&
              !canAcknowledge
                ? [{ label: approveLabel || 'Approve', value: 'approved' }]
                : []),
              ...(approverType !== 'requestor_department' &&
              approverType !== 'specific_department' &&
              approverType !== 'employee' &&
              canReject !== false
                ? [{ label: rejectLabel || 'Reject', value: 'rejected' }]
                : []),
              ...(canSkip ? [{ label: skipLabel || 'Skip', value: 'skipped' }] : []),
              { label: 'Auto-Completed', value: 'auto_completed' },
            ]}
            readOnly={!canEdit}
            value={response}
            onChange={(option: any) => {
              const newValue = option?.value || option
              setResponse(newValue)
            }}
          />
        </div>

        {/* Comments Field */}
        {(enableComment || comments) && (
          <div>
            <FieldLabel label="Comments" />
            <TextareaInput
              path={`workflow_reviews.${index}.comments`}
              readOnly={!canEdit}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        )}

        {/* Custom Fields */}
        {customFieldsDefinition && customFieldsDefinition.length > 0 && (
          <div className="space-y-4">
            <FieldLabel label="Additional Information" />
            <div className="grid gap-4">
              {customFieldsDefinition.map((field: any) => {
                // Conditional visibility logic
                if (
                  !evaluateConditions(field.conditions, {
                    ...priorCustomFieldValues,
                    ...customFieldValues,
                  })
                ) {
                  return null
                }

                const currentResponseIndex = (customFieldResponses || []).findIndex(
                  (r: any) => r.name === field.name,
                )
                const fieldPath =
                  currentResponseIndex > -1
                    ? `workflow_reviews.${index}.custom_field_responses.${currentResponseIndex}.value`
                    : `workflow_reviews.${index}.custom_field_responses`

                if (canEdit) {
                  return (
                    <div key={field.name}>
                      <FieldLabel
                        label={`${field.label || field.name}${field.required ? ' *' : ''}`}
                      />
                      {field.type === 'select' ? (
                        <SelectInput
                          path={fieldPath}
                          name={field.name}
                          options={field.options || []}
                          value={customFieldValues[field.name] || ''}
                          onChange={(val: any) => {
                            const value = val?.value !== undefined ? val.value : val
                            const newValues = { ...customFieldValues, [field.name]: value }
                            setCustomFieldValues(newValues)

                            // Update custom_field_responses array
                            const newResponses = [...(customFieldResponses || [])]
                            const respIndex = newResponses.findIndex((r) => r.name === field.name)
                            if (respIndex > -1) {
                              newResponses[respIndex].value = value
                            } else {
                              newResponses.push({
                                name: field.name,
                                label: field.label || field.name,
                                value,
                              })
                            }
                            setCustomFieldResponses(newResponses)
                          }}
                        />
                      ) : (
                        <TextInput
                          path={fieldPath}
                          value={customFieldValues[field.name] || (field.type === 'number' ? '0' : '')}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = e.target.value
                            const newValues = { ...customFieldValues, [field.name]: val }
                            setCustomFieldValues(newValues)

                            // Update custom_field_responses array
                            const newResponses = [...(customFieldResponses || [])]
                            const respIndex = newResponses.findIndex((r) => r.name === field.name)
                            if (respIndex > -1) {
                              newResponses[respIndex].value = val
                            } else {
                              newResponses.push({
                                name: field.name,
                                label: field.label || field.name,
                                value: val,
                              })
                            }
                            setCustomFieldResponses(newResponses)
                          }}
                        />
                      )}
                    </div>
                  )
                }

                // Read-only view for non-active steps
                return (
                  <div key={field.name}>
                    <FieldLabel label={field.label || field.name} />
                    <TextInput
                      path={fieldPath}
                      readOnly
                      value={customFieldValues[field.name] || 'N/A'}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Attachments Field */}
        {(canAttach || (attachments && attachments.length > 0)) && (
          <div style={{ marginTop: '1.5rem' }}>
            <FieldLabel label={attachmentLabel || 'Attachments'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attachments && attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachments.map((att: any, i: number) => {
                    const id = typeof att === 'object' ? att.id : att
                    const filename = typeof att === 'object' ? att.filename : `File ${id}`
                    const url = typeof att === 'object' ? att.url : null

                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'between',
                          padding: '0.75rem',
                          border: '1px solid var(--theme-elevation-150)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--theme-elevation-50)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexGrow: 1,
                            minWidth: 0,
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--theme-elevation-400)', flexShrink: 0 }}
                          >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                          </svg>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--theme-primary-500)',
                                textDecoration: 'none',
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.textDecoration = 'underline')
                              }
                              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {filename}
                            </a>
                          ) : (
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'var(--theme-elevation-700)',
                              }}
                            >
                              {filename}
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments(attachments.filter((_, idx) => idx !== i))
                            }
                            style={{
                              marginLeft: '0.75rem',
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--theme-error-500)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor = 'var(--theme-error-50)')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {canEdit && canAttach && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="file"
                    id={`file-upload-${index}`}
                    multiple
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files || files.length === 0) return

                      setIsUploading(true)
                      setUploadError(null)

                      try {
                        const newAttachments = [...(attachments || [])]
                        for (let i = 0; i < files.length; i++) {
                          const formData = new FormData()
                          formData.append('file', files[i])
                          const result = await uploadInternalMediaAction(formData)
                          if (result.success && result.data) {
                            newAttachments.push(result.data)
                          } else {
                            setUploadError(result.error || 'Failed to upload file.')
                          }
                        }
                        setAttachments(newAttachments)
                      } catch (err: any) {
                        console.error(err)
                        setUploadError('An error occurred during file upload.')
                      } finally {
                        setIsUploading(false)
                        e.target.value = ''
                      }
                    }}
                  />
                  <Button
                    size="small"
                    buttonStyle="secondary"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(`file-upload-${index}`)?.click()
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Add Attachment'}
                  </Button>
                  {uploadError && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--theme-error-500)',
                        marginTop: '0.5rem',
                      }}
                    >
                      {uploadError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {canGenerateWordfile && (
          <div className="mb-4">
            <FieldLabel label="Word Document" />
            <div className="mt-2 text-center">
              <Button
                size="small"
                buttonStyle="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  handleGenerateWord()
                }}
                disabled={isGeneratingWord}
                className="w-full"
              >
                {isGeneratingWord ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📝</span>
                    Generate & Download Word
                  </>
                )}
              </Button>
              <div className="text-[10px] text-[var(--theme-elevation-400)] mt-1 italic">
                {collectionSlug === 'salary-deduction'
                  ? 'Generates a Word file using the Salary Deduction template.'
                  : 'Generates a Word file using the configured template.'}
              </div>
            </div>
          </div>
        )}

        {/* Signature Field */}
        {(enableSignature || signature) && (
          <div>
            <FieldLabel label="Signature" />
            {canEdit ? (
              <div>
                <div className="border border-[var(--theme-elevation-200)] rounded bg-white overflow-hidden">
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className: 'sigCanvas w-full h-[150px] block' }}
                    onEnd={saveSignature}
                  />
                </div>
                <div className="m-0 p-0 text-right">
                  <Button
                    className="py-0 my-2"
                    buttonStyle="secondary"
                    size="small"
                    onClick={(e) => {
                      e.preventDefault()
                      clearSignature()
                    }}
                  >
                    Clear Signature
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {signature ? (
                  <div className="p-2 border border-[var(--theme-elevation-150)] rounded bg-white inline-block">
                    <img src={signature} alt="Signature" className="max-h-[100px] w-auto" />
                  </div>
                ) : (
                  <div className="italic text-[var(--theme-elevation-400)]">No signature</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Read-only info for completed reviews */}
        {!isCurrentStep && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-[var(--theme-elevation-100)] rounded text-sm">
            <div>
              <FieldLabel label="Reviewed By" />
              <TextInput
                path={`workflow_reviews.${index}.reviewed_by`}
                readOnly
                value={reviewedBy}
              />
            </div>
            <div>
              <FieldLabel label="Reviewed At" />
              <TextInput
                path={`workflow_reviews.${index}.reviewed_at`}
                readOnly
                value={reviewedAt}
              />
            </div>
          </div>
        )}

        {user?.super_user && (
          <div>
            <FieldLabel label="Token" />
            <div className="flex flex-col gap-2">
              <div className="flex-grow">
                <TextInput path={`workflow_reviews.${index}.token`} readOnly value={token} />
              </div>
              <Button
                size="small"
                buttonStyle="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  if (window.confirm('Are you sure you want to reset the token?')) {
                    setToken(uuidv4())
                  }
                }}
              >
                Reset Token
              </Button>
            </div>
          </div>
        )}

        <AdditionalReviewerTokensView index={index} />
      </div>

      {canEdit && (
        <div className="mt-4 text-[var(--theme-success-500)] text-sm font-bold">
          Action Required: Please provide your feedback above.
        </div>
      )}
    </div>
  )
}

// RequestLetterReviewItem.displayName = 'RequestLetterReviewItem'

const WorkflowReviewsView: React.FC = () => {
  const { user } = useAuth<User>()
  const { id: docId, collectionSlug } = useDocumentInfo()
  const { value: workflowStatus } = useField<string>({ path: '_workflow_status' })
  const { value: workflowReviewsCount } = useField<number>({ path: 'workflow_reviews' })
  const { versionCount } = useDocumentInfo()
  const [isPending, startTransition] = useTransition()
  const prevVersionRef = useRef<number | null>(null)

  // Detect when document has been saved
  useEffect(() => {
    const handlePageReload = () => {
      if (prevVersionRef.current === null) {
        // First render, store the initial version
        prevVersionRef.current = versionCount
        return
      }

      // If version changed, document was saved
      if (versionCount !== prevVersionRef.current) {
        prevVersionRef.current = versionCount
        if (versionCount === 1) return

        // Use startTransition to handle the page reload
        startTransition(async () => {
          // Small delay to ensure server has processed everything
          await new Promise((resolve) => setTimeout(resolve, 500))
          window.location.reload()
        })
      }
    }

    handlePageReload()
  }, [versionCount])

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault()
    if (
      window.confirm('Are you sure you want to resend the email notification for the current step?')
    ) {
      startTransition(async () => {
        const result = await resendWorkflowNotificationAction(
          collectionSlug || '',
          docId || '',
          workflowStatus || '',
        )
        if (result.success) {
          alert('Email notification resent successfully!')
        } else {
          alert(`Error resending email: ${result.error}`)
        }
      })
    }
  }
  const handleSyncSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    if (
      window.confirm(
        'Are you sure you want to sync workflow settings? This will update all pending reviews with the latest workflow configuration.',
      )
    ) {
      startTransition(async () => {
        const result = await syncWorkflowSettingsAction(collectionSlug || '', docId || '')
        if (result.success) {
          alert(
            result.modified
              ? 'Workflow settings synced successfully!'
              : 'Workflow settings are already up to date.',
          )
          if (result.modified) {
            window.location.reload()
          }
        } else {
          alert(`Error syncing settings: ${result.error}`)
        }
      })
    }
  }

  const handleUpdateStatus = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.confirm('Are you sure you want to re-trigger the workflow status update?')) {
      startTransition(async () => {
        const result = await updateWorkflowStatusAction(collectionSlug || '', docId || '')
        if (result.success) {
          alert('Workflow status update triggered successfully!')
          window.location.reload()
        } else {
          alert(`Error updating status: ${result.error}`)
        }
      })
    }
  }

  if (typeof workflowReviewsCount !== 'number' || workflowReviewsCount === 0) return null

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <FieldLabel label="Workflow Progress" />
        {user?.super_user && workflowStatus && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {workflowStatus !== 'draft' && (
              <Button
                size="small"
                buttonStyle="secondary"
                disabled={isPending}
                onClick={handleResend}
              >
                {isPending ? 'Sending...' : 'Resend Email'}
              </Button>
            )}
            <Button
              size="small"
              buttonStyle="secondary"
              disabled={isPending}
              onClick={handleSyncSettings}
            >
              {isPending ? 'Syncing...' : 'Sync Settings'}
            </Button>
            <Button
              size="small"
              buttonStyle="secondary"
              disabled={isPending}
              onClick={handleUpdateStatus}
            >
              {isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '0.5rem',
        }}
      >
        {Array.from({ length: workflowReviewsCount }).map((_, index) => (
          <ReviewItem key={index} index={index} workflowStatus={workflowStatus ?? ''} />
        ))}
      </div>
    </div>
  )
}

export default WorkflowReviewsView
