'use client'
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useSearchParams } from 'next/navigation'
import { saveAs } from 'file-saver'
import createReport from 'docx-templates'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { WorkflowReviews } from '@/payload-types'
import ConfirmationModal from './confirmation-modal'
import { getDocxTemplateAction, getUserSignatureAction, generatePdfAction } from './actions'

type ReviewItem = NonNullable<WorkflowReviews>[number] & {
  enable_comment?: boolean | null
  enable_signature?: boolean | null
  attachment_label?: string | null
  custom_fields_definition?: Array<{
    name: string
    label?: string | null
    type: 'text' | 'number' | 'select'
    options?: Array<{ label: string; value: string }> | null
    required?: boolean | null
    default_value?: string | null
    conditions?: Array<{
      field: string
      operator: 'equals' | 'not_equals'
      value: string
    }> | null
  }> | null
  custom_field_responses?: Array<{ name: string; label: string; value: string }> | null
  custom_email_text?: string | null
  skip_condition?: {
    enabled?: boolean | null
    field_name?: string | null
    operator?: string | null
    value?: string | null
  } | null
}

interface TokenOwnerCapabilities {
  canApprove?: boolean
  canReject?: boolean
  canAcknowledge?: boolean
}

const evaluateConditions = (
  conditions: NonNullable<ReviewItem['custom_fields_definition']>[number]['conditions'],
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

interface WorkflowFrontendProps {
  slug: string
  docId: string
  docData: any
  reviews: ReviewItem[]
  currentStepSlug: string
  isTokenValid?: boolean
  isReviewer?: boolean
  workflowStatus: string
  tokenOwnerCapabilities?: TokenOwnerCapabilities
  onSubmit: (data: {
    response: 'approved' | 'rejected' | 'acknowledged'
    comments: string
    signature: string
    attachments: string[]
    customFieldResponses: Array<{ name: string; label: string; value: string }>
  }) => Promise<void>
  onUpload?: (formData: FormData) => Promise<any>
  authorizedEmail?: string
}

const WorkflowFrontend: React.FC<WorkflowFrontendProps> = ({
  slug,
  docId,
  docData,
  reviews,
  currentStepSlug,
  isTokenValid,
  isReviewer,
  onSubmit,
  onUpload,
  workflowStatus,
  tokenOwnerCapabilities,
  authorizedEmail,
}) => {
  const searchParams = useSearchParams()
  const [response, setResponse] = useState<'approved' | 'rejected' | 'acknowledged'>('approved')
  const [comments, setComments] = useState('')
  const [uploadedAttachments, setUploadedAttachments] = useState<
    { id: string; filename: string; url: string }[]
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingWord, setIsGeneratingWord] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sigWarning, setSigWarning] = useState(false)

  // Custom field state: keyed by field name
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

  const activeReview = reviews.find((r) => r.status_slug === currentStepSlug)

  // Build prior custom field responses to use as defaults (latest value wins)
  const priorCustomFieldValues = useMemo(() => {
    const prior: Record<string, string> = {}
    for (const review of reviews) {
      if (review.status_slug === currentStepSlug) break
      const responses = (review.custom_field_responses as any[]) || []
      for (const r of responses) {
        if (r?.name) prior[r.name] = String(r.value ?? '')
      }
    }
    return prior
  }, [reviews, currentStepSlug])

  // Initialise custom field values when active review changes
  useEffect(() => {
    if (!activeReview?.custom_fields_definition?.length) return
    const initial: Record<string, string> = {}
    for (const field of activeReview.custom_fields_definition as any[]) {
      // Carry forward prior answer, or use configured default, or default to '0' for numbers
      const defaultValue = field.type === 'number' ? '0' : ''
      initial[field.name] =
        priorCustomFieldValues[field.name] ?? field.default_value ?? defaultValue
    }
    setCustomFieldValues(initial)
  }, [currentStepSlug, priorCustomFieldValues, activeReview?.custom_fields_definition])

  // Aggregate the LATEST custom field value per name across ALL completed steps
  const latestCustomFieldValues: Array<{ name: string; label: string; value: string }> = (() => {
    const latest: Record<string, { label: string; value: string }> = {}
    for (const review of reviews) {
      const responses = (review.custom_field_responses as any[]) || []
      for (const r of responses) {
        if (r?.name && r.value !== '' && r.value !== undefined && r.value !== null) {
          latest[r.name] = { label: r.label ?? r.name, value: String(r.value) }
        }
      }
    }
    return Object.entries(latest).map(([name, { label, value }]) => ({ name, label, value }))
  })()

  const formatDisplayValue = (val: string | number | null | undefined) => {
    if (!val) return ''
    try {
      return val
        .toString()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    } catch (e) {
      return String(val)
    }
  }
  const sigPad = useRef<SignatureCanvas>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const handleGenerateWord = useCallback(async () => {
    if (!docData) return

    setIsGeneratingWord(true)
    setSigWarning(false)
    setError(null)

    try {
      const result = await getDocxTemplateAction(slug, docData.type)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch template')
      }

      const { base64 } = result.data
      const templateBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

      const formattedDate = docData.createdAt
        ? new Date(docData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      let introHtml = lexicalToHtml(docData.description)
      if (introHtml) {
        introHtml = `
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Poppins', sans-serif; font-size: 10pt; line-height: 1.5; }
          </style>
          <body>${introHtml}</body>`
      }

      const templateData: any = {
        staff_name: docData.employee_name || 'Not provided',
        staff_no: docData.employee_h2a_id || 'Not provided',
        designation: docData.employee_designation || 'Not provided',
        department: docData.employee_department_name || 'Not provided',
        subject: docData.subject || 'Not provided',
        description: introHtml || 'Not provided',
        date: formattedDate,
        email: docData.employee_email || 'Not provided',
        days_deducted: docData.type === 'salary-deduction' ? docData.days_deducted : undefined,
        signature: null,
      }

      // ─── Inject Signature ───
      console.log('Generating Word with authorizedEmail:', authorizedEmail)
      if (authorizedEmail) {
        const sigResult = await getUserSignatureAction(authorizedEmail)
        console.log('Signature fetch result:', sigResult)
        if (sigResult.success && sigResult.data?.signature) {
          const sigBase64 = sigResult.data.signature
          // Strip data URL prefix if present
          const base64Data = sigBase64.includes('base64,')
            ? sigBase64.split('base64,')[1]
            : sigBase64

          // Converting base64 to ArrayBuffer (more stable for docx-templates in browser)
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          templateData.signature = {
            data: bytes.buffer,
            extension: '.png',
            width: 8, // Aspect ratio 16/4 -> 4:1
            height: 2,
          }
          console.log(
            'Signature injected into templateData as ArrayBuffer:',
            templateData.signature,
          )
        } else {
          console.warn('Could not fetch signature for', authorizedEmail, sigResult.error)
          setSigWarning(true)
          const binaryString = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          templateData.signature = {
            data: bytes.buffer,
            extension: '.png',
            width: 1,
            height: 1,
          }
        }
      } else {
        const binaryString = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        templateData.signature = {
          data: bytes.buffer,
          extension: '.png',
          width: 1,
          height: 1,
        }
      }

      console.log('Generating report with data:', templateData)

      const report = await createReport({
        template: new Uint8Array(templateBuffer),
        data: templateData,
        cmdDelimiter: ['{', '}'],
      })

      console.log('Generated report result:', report)

      const typeLabel = docData.type
        ? docData.type
            .split('-')
            .map((s: string) => s.charAt(0) + s.slice(1))
            .join('_')
        : 'Salary_Deduction'
      const filename = `${typeLabel}_${(docData.employee_name || 'record').replace(/\s+/g, '_')}_v2.docx`
      saveAs(
        new Blob([report as any], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        filename,
      )
    } catch (err: any) {
      console.error('Word generation error:', err)
      setError(err.message || 'Failed to generate Word document')
    } finally {
      setIsGeneratingWord(false)
    }
  }, [docData, authorizedEmail, slug])

  const handleGeneratePdf = useCallback(async () => {
    if (!docData) return
    setIsGeneratingPdf(true)
    setSigWarning(false)
    setError(null)
    try {
      const typeLabel = docData.type
        ? docData.type
            .split('-')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ')
        : 'Document'

      const result = await generatePdfAction({
        slug,
        id: docId,
        docData,
        templateName: typeLabel,
        authorizedEmail,
      })
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate PDF')
      }

      // Check if signature was missing in the PDF generation result
      // We assume if it succeeds but no signature was found, generatePdfAction logs a warning on server
      // But we can also check here if we want to be explicit, though generatePdfAction doesn't return that info yet.
      // For now, we rely on the manual check in handleGenerateWord or just proceed.
      // Actually, let's check sig manually here too if we want the warning.
      if (authorizedEmail) {
        const sigResult = await getUserSignatureAction(authorizedEmail)
        if (!sigResult.success || !sigResult.data?.signature) {
          setSigWarning(true)
        }
      }

      // Sync local attachments state so it shows up in the UI immediately
      const generatedMedia = (result.data as any).media
      if (generatedMedia) {
        setUploadedAttachments((prev) => {
          const exists = prev.some((a: any) => a.id === generatedMedia.id)
          return exists ? prev : [...prev, generatedMedia]
        })
      }

      const pdfBytes = Uint8Array.from(atob(result.data.pdf), (c) => c.charCodeAt(0))
      const filename = `${typeLabel.replace(/\s+/g, '_')}_${(docData.employee_name || 'record').replace(/\s+/g, '_')}.pdf`
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), filename)
    } catch (err: any) {
      console.error('PDF generation error:', err)
      setError(err.message || 'Failed to generate PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [docData, authorizedEmail, slug, docId])
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'approve') setResponse('approved')
    if (action === 'reject') setResponse('rejected')

    if ((isTokenValid || isReviewer) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [searchParams, isTokenValid, isReviewer])

  // Use tokenOwnerCapabilities override if provided (for additional reviewers)
  const effectiveCanAcknowledge = tokenOwnerCapabilities
    ? !!tokenOwnerCapabilities.canAcknowledge
    : !!activeReview?.can_acknowledge
  const effectiveCanApprove = tokenOwnerCapabilities
    ? !!tokenOwnerCapabilities.canApprove
    : !!activeReview?.can_approve
  const effectiveCanReject = tokenOwnerCapabilities
    ? !!tokenOwnerCapabilities.canReject
    : !!activeReview?.can_reject

  useEffect(() => {
    if (activeReview || tokenOwnerCapabilities) {
      if (effectiveCanAcknowledge) {
        setResponse('acknowledged')
      } else if (effectiveCanApprove) {
        setResponse('approved')
      } else if (effectiveCanReject) {
        setResponse('rejected')
      }
    }
  }, [activeReview, tokenOwnerCapabilities])

  const handleClearSignature = () => {
    sigPad.current?.clear()
    setSignatureDataUrl('')
  }

  const handleSaveSignature = () => {
    if (sigPad.current) {
      setSignatureDataUrl(sigPad.current.toDataURL('image/png'))
      if (error) setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (activeReview?.enable_comment && !comments) {
      setError('Please provide comments.')
      return
    }
    if (activeReview?.enable_signature && !signatureDataUrl) {
      setError('Please provide a signature.')
      return
    }
    // Validate required custom fields
    for (const field of (activeReview?.custom_fields_definition as any[]) || []) {
      if (field.required && !customFieldValues[field.name]) {
        setError(`Please fill in the "${field.label ?? field.name}" field.`)
        return
      }
    }

    setIsModalOpen(true)
  }

  const handleConfirmSubmit = async () => {
    setIsModalOpen(false)
    setIsSubmitting(true)
    setError(null)
    try {
      const customFieldResponses = ((activeReview?.custom_fields_definition as any[]) || [])
        .filter((field: any) =>
          evaluateConditions(field.conditions, { ...priorCustomFieldValues, ...customFieldValues }),
        )
        .map((field: any) => ({
          name: field.name,
          label: field.label ?? field.name,
          value: customFieldValues[field.name] ?? '',
        }))
      await onSubmit({
        response,
        comments,
        signature: signatureDataUrl,
        attachments: uploadedAttachments.map((a) => a.id),
        customFieldResponses,
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !onUpload) return

    setIsUploading(true)
    setError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        const result = await onUpload(formData)
        if (result.success) {
          setUploadedAttachments((prev) => [...prev, result.data])
        } else {
          setError(result.error || 'Failed to upload file.')
        }
      }
    } catch (err: any) {
      console.error(err)
      setError('An error occurred during file upload.')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setUploadedAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Additional Info: latest custom field values from completed steps */}
      {latestCustomFieldValues.length > 0 && (
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 sm:p-6">
            <h3 className={cn('text-base font-bold text-primary mb-3', noah.className)}>
              Additional Info
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {latestCustomFieldValues.map((field) => (
                <div key={field.name} className="flex flex-col">
                  <dt className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-base-content font-medium">
                    {formatDisplayValue(field.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <div>
        <h2
          className={cn(
            'text-xl font-bold text-primary border-b border-base-200 pb-2 mb-4',
            noah.className,
          )}
        >
          Workflow Progress
        </h2>
        <div className="space-y-4">
          {reviews.map((review, index) => {
            const isCompleted = review.response !== 'pending'
            const isActive = review.status_slug === currentStepSlug
            const isSkipped =
              !isCompleted && (workflowStatus === 'completed' || workflowStatus === 'rejected')

            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border transition-all duration-200',
                  isActive
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-base-200 bg-base-100',
                  isCompleted ? 'border-l-4 border-l-success' : '',
                )}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <p className={cn('font-semibold text-base-content', noah.className)}>
                      {review.label}
                    </p>
                    <p className="text-sm text-base-content/60">Reviewer: {review.reviewer}</p>
                  </div>
                  <div
                    className={cn(
                      'badge badge-md uppercase',
                      review.response === 'approved' && 'badge-success',
                      review.response === 'rejected' && 'badge-error',
                      review.response === 'pending' && !isSkipped && 'badge-info',
                      isSkipped && 'badge-warning',
                      noah.className,
                    )}
                  >
                    {isSkipped
                      ? 'skipped'
                      : review.response === 'auto_completed'
                        ? 'auto completed'
                        : review.response}
                  </div>
                </div>

                {isCompleted && (
                  <div className="mt-3 text-sm border-t border-base-200 pt-3">
                    {review.custom_email_text && (
                      <p className="text-xs text-base-content/50 font-medium mb-1">
                        Instruction: {review.custom_email_text}
                      </p>
                    )}
                    <p className="italic">&quot;{review.comments}&quot;</p>
                    {/* Custom field responses for this step */}
                    {(review.custom_field_responses as any[]) &&
                      (review.custom_field_responses as any[]).length > 0 && (
                        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {(review.custom_field_responses as any[]).map((r: any, ri: number) => (
                            <div key={ri} className="flex flex-col">
                              <dt className="text-[10px] font-semibold text-base-content/50 uppercase tracking-wide">
                                {r.label ?? r.name}
                              </dt>
                              <dd className="text-xs text-base-content font-medium">
                                {formatDisplayValue(r.value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    {(review as any).attachments && (review as any).attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(review as any).attachments.map((att: any, i: number) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-base-200 hover:bg-base-300 text-xs px-2 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            {att.filename}
                          </a>
                        ))}
                      </div>
                    )}
                    {review.signature && (
                      <div className="mt-2 text-right">
                        <img
                          src={review.signature}
                          alt="Signature"
                          className="h-12 w-auto border border-base-300 rounded p-1 bg-white"
                        />
                      </div>
                    )}
                    <p className="mt-2 text-xs opacity-60 font-medium">
                      Reviewed by {review.reviewed_by} at{' '}
                      {new Date(review.reviewed_at!).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Additional reviewer responses */}
                {(() => {
                  const additionalTokens: any[] = (review as any).additional_reviewer_tokens || []
                  const responded = additionalTokens.filter((t: any) => t.response !== 'pending')
                  if (responded.length === 0) return null
                  return (
                    <div className="mt-3 border-t border-base-200 pt-3">
                      <p
                        className={cn(
                          'text-xs font-bold text-primary/70 uppercase tracking-wider mb-2',
                          noah.className,
                        )}
                      >
                        Additional Reviewer Responses
                      </p>
                      <div className="space-y-2">
                        {responded.map((t: any, ti: number) => (
                          <div
                            key={ti}
                            className="flex items-center justify-between text-xs bg-base-200/60 rounded px-3 py-2"
                          >
                            <span className="font-medium text-base-content/80">{t.email}</span>
                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={cn(
                                  'badge badge-xs uppercase',
                                  t.response === 'approved' && 'badge-success',
                                  t.response === 'rejected' && 'badge-error',
                                  t.response === 'acknowledged' && 'badge-success',
                                )}
                              >
                                {t.response}
                              </span>
                              {t.reviewed_at && (
                                <span className="text-base-content/50 text-[10px]">
                                  {new Date(t.reviewed_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {(isTokenValid || isReviewer) && activeReview && (
        <div
          ref={formRef}
          className="card bg-base-100 shadow-xl border border-primary/10 overflow-hidden"
        >
          <div className="card-body p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-base-200 pb-4">
              <h3 className={cn('text-xl font-bold text-primary', noah.className)}>
                Your Action Required
              </h3>

              {activeReview?.can_generate_wordfile && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateWord}
                      disabled={isGeneratingWord || isGeneratingPdf || !docData}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-md text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      title="Generate Word Document"
                    >
                      {isGeneratingWord ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                      <span>{isGeneratingWord ? 'Generating...' : 'DOCX'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGeneratePdf}
                      disabled={isGeneratingPdf || isGeneratingWord || !docData}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-error text-white hover:bg-error/90 rounded-md text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      title="Generate PDF"
                    >
                      {isGeneratingPdf ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      <span>{isGeneratingPdf ? 'Converting...' : 'PDF'}</span>
                    </button>
                  </div>

                  {sigWarning && (
                    <div className="flex items-center gap-1.5 text-warning animate-pulse">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="text-[10px] font-medium leading-tight">
                        Signature not setup.
                        <a
                          href={
                            docData.operator_slug
                              ? `/${docData.operator_slug}/admin/collections/user-settings`
                              : '/admin/collections/user-settings'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 underline font-bold hover:text-warning-content"
                        >
                          Setup now
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeReview?.custom_email_text && (
              <div className="bg-info/10 border-l-4 border-info p-4 mb-6">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-info"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-info-content/80 font-medium">
                      {activeReview.custom_email_text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div role="alert" className="alert alert-error shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6 text-error-content"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-error-content font-medium">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="btn btn-sm btn-ghost btn-circle text-error-content"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* <div className="flex flex-col gap-4">
                <label className={cn('label-text text-lg font-bold text-primary', noah.className)}>
                  Your Decision
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeReview.can_acknowledge && (
                    <button
                      type="button"
                      onClick={() => setResponse('approved')}
                      className={cn(
                        'btn btn-md flex-1 uppercase',
                        response === 'approved'
                          ? 'btn-success'
                          : 'btn-outline btn-success opacity-50',
                        noah.className,
                      )}
                    >
                      {activeReview.acknowledge_label || 'Acknowledge'}
                    </button>
                  )}
                  {activeReview.can_approve && (
                    <button
                      type="button"
                      onClick={() => setResponse('approved')}
                      className={cn(
                        'btn btn-md flex-1 uppercase',
                        response === 'approved'
                          ? 'btn-success'
                          : 'btn-outline btn-success opacity-50',
                        noah.className,
                      )}
                    >
                      {activeReview.approve_label || 'Approve'}
                    </button>
                  )}
                  {activeReview.can_reject && (
                    <button
                      type="button"
                      onClick={() => setResponse('rejected')}
                      className={cn(
                        'btn btn-md flex-1 uppercase',
                        response === 'rejected' ? 'btn-error' : 'btn-outline btn-error opacity-50',
                        noah.className,
                      )}
                    >
                      {activeReview.reject_label || 'Reject'}
                    </button>
                  )}
                </div>
              </div> */}

              {/* Custom fields for this workflow step */}
              {(activeReview.custom_fields_definition as any[]) &&
                (activeReview.custom_fields_definition as any[]).length > 0 && (
                  <div className="space-y-4">
                    <p className={cn('text-lg font-bold text-primary', noah.className)}>
                      Additional Information
                    </p>
                    {(activeReview.custom_fields_definition as any[]).map((field: any) => {
                      // Conditional logic
                      if (
                        !evaluateConditions(field.conditions, {
                          ...priorCustomFieldValues,
                          ...customFieldValues,
                        })
                      ) {
                        return null
                      }

                      return (
                        <div key={field.name} className="form-control w-full">
                          <label htmlFor={`cf-${field.name}`} className="label">
                            <span
                              className={cn(
                                'label-text text-base font-semibold text-primary',
                                noah.className,
                              )}
                            >
                              {field.label ?? field.name}
                              {field.required && <span className="text-error ml-1">*</span>}
                            </span>
                          </label>
                          {field.type === 'select' ? (
                            <select
                              id={`cf-${field.name}`}
                              className="select select-bordered select-primary w-full"
                              value={customFieldValues[field.name] ?? ''}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Select...</option>
                              {(field.options || []).map((opt: any) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <>
                              <input
                                id={`cf-${field.name}`}
                                type={field.type === 'number' ? 'number' : 'text'}
                                className="input input-bordered input-primary w-full"
                                value={
                                  customFieldValues[field.name] !== undefined &&
                                  customFieldValues[field.name] !== ''
                                    ? customFieldValues[field.name]
                                    : field.type === 'number'
                                      ? '0'
                                      : ''
                                }
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [field.name]: e.target.value,
                                  }))
                                }
                              />
                              {priorCustomFieldValues[field.name] &&
                                !customFieldValues[field.name] && (
                                  <p className="text-xs text-base-content/50 mt-1">
                                    Previous answer:{' '}
                                    {formatDisplayValue(priorCustomFieldValues[field.name])}
                                  </p>
                                )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

              {activeReview.enable_comment && (
                <div className="form-control w-full">
                  <label htmlFor="comments" className="label">
                    <span
                      className={cn('label-text text-lg font-bold text-primary', noah.className)}
                    >
                      Comments <span className="text-error">*</span>
                    </span>
                  </label>
                  <textarea
                    id="comments"
                    rows={4}
                    required
                    className="textarea textarea-bordered textarea-primary h-32 w-full"
                    placeholder="Provide your feedback here..."
                    value={comments}
                    onChange={(e) => {
                      setComments(e.target.value)
                      if (error) setError(null)
                    }}
                  />
                </div>
              )}

              {(activeReview as any).can_attach && (
                <div className="form-control w-full">
                  <label className="label">
                    <span
                      className={cn('label-text text-lg font-bold text-primary', noah.className)}
                    >
                      {(activeReview as any).attachment_label || 'Attachments'}
                    </span>
                  </label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="file-input file-input-bordered file-input-primary w-full"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <span className="loading loading-spinner loading-xs"></span>
                        Uploading...
                      </div>
                    )}
                    {uploadedAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {uploadedAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="badge badge-outline gap-2 p-3 bg-base-100 flex items-center"
                          >
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate max-w-[150px] hover:underline"
                            >
                              {att.filename}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeAttachment(att.id)}
                              className="text-error hover:text-error-focus ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeReview.enable_signature && (
                <div>
                  <label className="label">
                    <span
                      className={cn('label-text text-lg font-bold text-primary', noah.className)}
                    >
                      Signature <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="border border-base-300 rounded-lg bg-white overflow-hidden mb-2 hover:border-primary transition-colors">
                    <SignatureCanvas
                      ref={sigPad}
                      penColor="black"
                      canvasProps={{ className: 'sigCanvas w-full h-[150px] cursor-crosshair' }}
                      onEnd={handleSaveSignature}
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="btn btn-xs btn-ghost text-primary hover:text-primary-focus"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {effectiveCanAcknowledge && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setResponse('acknowledged')}
                    className={cn('btn btn-lg w-full mt-4', 'btn-primary', noah.className)}
                  >
                    {activeReview?.acknowledge_label || 'Acknowledge'}
                  </button>
                )}

                {effectiveCanApprove && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setResponse('approved')}
                    className={cn('btn btn-lg w-full mt-4', 'btn-primary', noah.className)}
                  >
                    {activeReview?.approve_label || 'Approve'}
                  </button>
                )}

                {effectiveCanReject && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setResponse('rejected')}
                    className={cn('btn btn-lg w-full mt-4', 'btn-error', noah.className)}
                  >
                    {activeReview?.reject_label || 'Reject'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Your Action"
        message={`Are you sure you want to ${
          response === 'approved'
            ? (activeReview?.approve_label || 'approve').toLowerCase()
            : response === 'acknowledged'
              ? (activeReview?.acknowledge_label || 'acknowledge').toLowerCase()
              : (activeReview?.reject_label || 'reject').toLowerCase()
        } this request? This action cannot be undone.`}
        variant={response === 'rejected' ? 'error' : 'primary'}
      />
    </div>
  )
}

export default WorkflowFrontend
