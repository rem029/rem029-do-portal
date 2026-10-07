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
import ConfirmationModal from '../workflow-frontend/confirmation-modal'
import {
  getDocxTemplateAction,
  getUserSignatureAction,
  generatePdfAction,
} from '../workflow-frontend/actions'
import { DynamicSelectField } from '@/common/components/dynamic-select-field'
import {
  getOperatorsAction,
  getRestaurantsAction,
  getDepartmentsAction,
  getStoreDepartmentsAction,
  getCrmCategoriesAction,
} from '@/common/actions/relation-options'
import { useLocalStorage } from '@/common/hooks/use-local-storage'

// ─────────────────────────────────────────────────────────────────────────────
// Types — block-based response fields, unified reviewer tokens
// ─────────────────────────────────────────────────────────────────────────────

export type FieldBlock = {
  blockType: string
  name?: string
  label?: string | null
  required?: boolean | null
  options?: Array<{ label: string; value: string }> | null
  add_all?: boolean | null
  selected_items?: unknown
  [key: string]: unknown
}

export type ReviewerTokenEntry = {
  email: string
  token: string
  approver_type?: string | null
  response: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'skipped'
  reviewed_by?: string | null
  reviewed_at?: string | null
}

export type FieldResponseEntry = {
  name: string
  label: string
  value: unknown
  blockType: string
}

type ReviewItem = NonNullable<WorkflowReviews>[number] & {
  reviewer_tokens?: ReviewerTokenEntry[] | null
  before_response_fields?: FieldBlock[] | null
  after_response_approved_fields?: FieldBlock[] | null
  after_response_rejected_fields?: FieldBlock[] | null
  after_response_acknowledged_fields?: FieldBlock[] | null
  field_responses?: FieldResponseEntry[] | null
  custom_email_text?: string | null
  can_generate_wordfile?: boolean | null
}

type ReviewFilter = 'default' | 'all' | 'approved' | 'rejected' | 'confirmed' | 'pending'

const REVIEW_FILTER_OPTIONS: Array<{ value: ReviewFilter; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'all', label: 'Show All' },
  { value: 'approved', label: 'Approved Only' },
  { value: 'rejected', label: 'Rejected Only' },
  { value: 'confirmed', label: 'Confirmed Only' },
  { value: 'pending', label: 'Pending Only' },
]

/** A review counts as "skipped" for filtering if it was explicitly skipped by a
 * skip_condition, OR it never got a response because the workflow already completed/
 * rejected before reaching it (same definition the badge rendering already uses). */
const isReviewSkippedForFilter = (review: ReviewItem, workflowStatus: string): boolean => {
  const isCompleted = review.response !== 'pending'
  return (
    review.response === 'skipped' ||
    (!isCompleted && (workflowStatus === 'completed' || workflowStatus === 'rejected'))
  )
}

const matchesReviewFilter = (
  review: ReviewItem,
  filter: ReviewFilter,
  workflowStatus: string,
): boolean => {
  switch (filter) {
    case 'all':
      return true
    case 'approved':
      return review.response === 'approved'
    case 'rejected':
      return review.response === 'rejected'
    case 'confirmed':
      return review.response === 'acknowledged'
    case 'pending':
      return review.response === 'pending' && !isReviewSkippedForFilter(review, workflowStatus)
    case 'default':
    default:
      return !isReviewSkippedForFilter(review, workflowStatus)
  }
}

const formatDisplayValue = (val: unknown) => {
  if (val == null || val === '') return ''
  try {
    return String(val)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return String(val)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic field-block renderer — one function handles every block type. Used
// identically for before-response and after-response phases (same mechanism,
// applied twice), and reused for the additional_approvers-independent case too
// since capabilities/blocks are step-level now, not per-approver.
// ─────────────────────────────────────────────────────────────────────────────

interface FieldBlockRenderCtx {
  fieldValues: Record<string, unknown>
  setFieldValue: (name: string, value: unknown) => void
  fileDisplayByField: Record<string, Array<{ id: string; filename: string; url: string }>>
  setFileDisplayByField: React.Dispatch<
    React.SetStateAction<Record<string, Array<{ id: string; filename: string; url: string }>>>
  >
  uploadingField: string | null
  setUploadingField: (name: string | null) => void
  sigPadRefs: React.MutableRefObject<Record<string, SignatureCanvas | null>>
  onUpload?: (formData: FormData) => Promise<{
    success: boolean
    data?: { id: string; filename: string; url: string }
    error?: string
  }>
  priorFieldValues: Record<string, unknown>
}

const RELATION_SELECT_CONFIG: Record<
  string,
  { action: () => Promise<{ success: boolean; data: any[] }>; valueKey: 'id' | 'title' }
> = {
  'select-operators': { action: getOperatorsAction, valueKey: 'title' },
  'select-restaurants': { action: getRestaurantsAction, valueKey: 'title' },
  'select-departments': { action: getDepartmentsAction, valueKey: 'id' },
  'select-store-departments': { action: getStoreDepartmentsAction, valueKey: 'id' },
  'select-crm-category': { action: getCrmCategoriesAction, valueKey: 'id' },
}

function renderFieldBlock(block: FieldBlock, ctx: FieldBlockRenderCtx): React.ReactNode {
  const {
    fieldValues,
    setFieldValue,
    fileDisplayByField,
    setFileDisplayByField,
    uploadingField,
    setUploadingField,
    sigPadRefs,
    onUpload,
    priorFieldValues,
  } = ctx

  const name = block.name || ''
  if (!name) return null
  const label = block.label || name
  const required = !!block.required
  const value = fieldValues[name]

  if (
    block.blockType === 'text' ||
    block.blockType === 'number' ||
    block.blockType === 'date' ||
    block.blockType === 'email'
  ) {
    return (
      <div key={name} className="form-control w-full">
        <label htmlFor={`fb-${name}`} className="label">
          <span className={cn('label-text text-sm font-semibold text-primary', noah.className)}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <input
          id={`fb-${name}`}
          type={block.blockType}
          className="input input-bordered input-primary w-full"
          value={(value as string) ?? ''}
          onChange={(e) => setFieldValue(name, e.target.value)}
        />
        {priorFieldValues[name] != null &&
          priorFieldValues[name] !== '' &&
          (value == null || value === '') && (
            <p className="text-xs text-base-content/50 mt-1">
              Previous answer: {formatDisplayValue(priorFieldValues[name])}
            </p>
          )}
      </div>
    )
  }

  if (block.blockType === 'textarea') {
    return (
      <div key={name} className="form-control w-full">
        <label htmlFor={`fb-${name}`} className="label">
          <span className={cn('label-text text-sm font-semibold text-primary', noah.className)}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <textarea
          id={`fb-${name}`}
          rows={4}
          className="textarea textarea-bordered textarea-primary h-32 w-full"
          placeholder="Provide your feedback here..."
          value={(value as string) ?? ''}
          onChange={(e) => setFieldValue(name, e.target.value)}
        />
      </div>
    )
  }

  if (block.blockType === 'select') {
    return (
      <div key={name} className="form-control w-full">
        <label htmlFor={`fb-${name}`} className="label">
          <span className={cn('label-text text-sm font-semibold text-primary', noah.className)}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <select
          id={`fb-${name}`}
          className="select select-bordered select-primary w-full"
          value={(value as string) ?? ''}
          onChange={(e) => setFieldValue(name, e.target.value)}
        >
          <option value="">Select...</option>
          {(block.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (RELATION_SELECT_CONFIG[block.blockType]) {
    const { action, valueKey } = RELATION_SELECT_CONFIG[block.blockType]
    return (
      <DynamicSelectField
        key={name}
        field={block}
        fieldName={name}
        elementId={`fb-${name}`}
        fieldLabel={label}
        fieldPlaceholder="Select..."
        isRequired={required}
        displayIndex={0}
        showSequenceNumber={false}
        values={fieldValues as Record<string, string | boolean | number>}
        onChange={(fname, fvalue) => setFieldValue(fname, fvalue)}
        disabled={false}
        action={action}
        valueKey={valueKey}
      />
    )
  }

  if (block.blockType === 'signature') {
    return (
      <div key={name}>
        <label className="label">
          <span className={cn('label-text text-sm font-semibold text-primary', noah.className)}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <div className="border border-base-300 rounded-lg bg-white overflow-hidden mb-2 hover:border-primary transition-colors">
          <SignatureCanvas
            ref={(el) => {
              sigPadRefs.current[name] = el
            }}
            penColor="black"
            canvasProps={{ className: 'sigCanvas w-full h-[150px] cursor-crosshair' }}
            onEnd={() => {
              const dataUrl = sigPadRefs.current[name]?.toDataURL('image/png')
              if (dataUrl) setFieldValue(name, dataUrl)
            }}
          />
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              sigPadRefs.current[name]?.clear()
              setFieldValue(name, '')
            }}
            className="btn btn-xs btn-ghost text-primary hover:text-primary-focus"
          >
            Clear Signature
          </button>
        </div>
      </div>
    )
  }

  if (block.blockType === 'file') {
    const files = fileDisplayByField[name] || []
    return (
      <div key={name} className="form-control w-full">
        <label className="label">
          <span className={cn('label-text text-sm font-semibold text-primary', noah.className)}>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <div className="space-y-4">
          <input
            type="file"
            multiple
            disabled={uploadingField === name || !onUpload}
            onChange={async (e) => {
              const inputFiles = e.target.files
              if (!inputFiles || inputFiles.length === 0 || !onUpload) return
              setUploadingField(name)
              try {
                const newFiles: Array<{ id: string; filename: string; url: string }> = []
                for (let i = 0; i < inputFiles.length; i++) {
                  const formData = new FormData()
                  formData.append('file', inputFiles[i])
                  const result = await onUpload(formData)
                  if (result.success && result.data) newFiles.push(result.data)
                }
                setFileDisplayByField((prev) => {
                  const merged = [...(prev[name] || []), ...newFiles]
                  setFieldValue(
                    name,
                    merged.map((f) => f.id),
                  )
                  return { ...prev, [name]: merged }
                })
              } finally {
                setUploadingField(null)
                e.target.value = ''
              }
            }}
            className="file-input file-input-bordered file-input-primary w-full"
          />
          {uploadingField === name && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <span className="loading loading-spinner loading-xs"></span>
              Uploading...
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((att) => (
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
                    onClick={() => {
                      setFileDisplayByField((prev) => {
                        const remaining = (prev[name] || []).filter((f) => f.id !== att.id)
                        setFieldValue(
                          name,
                          remaining.map((f) => f.id),
                        )
                        return { ...prev, [name]: remaining }
                      })
                    }}
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
    )
  }

  // global_field_ref never reaches the frontend — it's already resolved to a
  // concrete block by resolveFieldBlocks before the review is snapshotted.
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface WorkflowFrontendProps {
  slug: string
  docId: string
  docData: any
  reviews: ReviewItem[]
  currentStepSlug: string
  isTokenValid?: boolean
  isReadOnlyToken?: boolean
  isReviewer?: boolean
  workflowStatus: string
  onSubmit: (data: {
    response: 'approved' | 'rejected' | 'acknowledged'
    fieldResponses: FieldResponseEntry[]
  }) => Promise<void>
  onUpload?: (formData: FormData) => Promise<{
    success: boolean
    data?: { id: string; filename: string; url: string }
    error?: string
  }>
  authorizedEmail?: string
  /** Optional slot rendered below the action buttons inside "Your Action Required" */
  reassignSlot?: React.ReactNode
}

const WorkflowFrontend: React.FC<WorkflowFrontendProps> = ({
  slug,
  docId,
  docData,
  reviews,
  currentStepSlug,
  isTokenValid,
  isReadOnlyToken,
  isReviewer,
  onSubmit,
  onUpload,
  workflowStatus,
  authorizedEmail,
  reassignSlot,
}) => {
  const searchParams = useSearchParams()
  const [response, setResponse] = useState<'approved' | 'rejected' | 'acknowledged'>('approved')
  const [phase, setPhase] = useState<'before' | 'after'>('before')
  const [reviewFilter, setReviewFilter] = useLocalStorage<ReviewFilter>(
    'wf-review-filter',
    'default',
  )
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [fileDisplayByField, setFileDisplayByField] = useState<
    Record<string, Array<{ id: string; filename: string; url: string }>>
  >({})
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const sigPadRefs = useRef<Record<string, SignatureCanvas | null>>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingWord, setIsGeneratingWord] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sigWarning, setSigWarning] = useState(false)
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(() => {
    const set = new Set<number>()
    reviews.forEach((r, i) => {
      if (r.response !== 'pending' && r.response !== 'skipped') set.add(i)
    })
    return set
  })
  const toggleExpanded = (i: number) =>
    setExpandedIndexes((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const activeReview = reviews.find((r) => r.status_slug === currentStepSlug)

  const beforeFields: FieldBlock[] = useMemo(
    () => (activeReview?.before_response_fields as FieldBlock[]) || [],
    [activeReview],
  )

  const getAfterFields = useCallback(
    (r: 'approved' | 'rejected' | 'acknowledged'): FieldBlock[] => {
      if (!activeReview) return []
      if (r === 'approved')
        return (activeReview.after_response_approved_fields as FieldBlock[]) || []
      if (r === 'rejected')
        return (activeReview.after_response_rejected_fields as FieldBlock[]) || []
      return (activeReview.after_response_acknowledged_fields as FieldBlock[]) || []
    },
    [activeReview],
  )

  const afterFields = phase === 'after' ? getAfterFields(response) : []

  // Build prior field values to use as defaults/hints (latest value wins)
  const priorFieldValues = useMemo(() => {
    const prior: Record<string, unknown> = {}
    for (const review of reviews) {
      if (review.status_slug === currentStepSlug) break
      const responses = (review.field_responses as FieldResponseEntry[]) || []
      for (const r of responses) {
        if (r?.name) prior[r.name] = r.value
      }
    }
    return prior
  }, [reviews, currentStepSlug])

  // Aggregate the LATEST field value per name across ALL completed steps, for the
  // "Additional Info" recap card. Signature/file values need dedicated rendering
  // (image/link), not a plain text grid, so they're excluded here.
  const latestFieldValues: FieldResponseEntry[] = useMemo(() => {
    const latest: Record<string, FieldResponseEntry> = {}
    for (const review of reviews) {
      const responses = (review.field_responses as FieldResponseEntry[]) || []
      for (const r of responses) {
        if (r?.name && r.value !== '' && r.value != null) {
          latest[r.name] = r
        }
      }
    }
    return Object.values(latest).filter(
      (r) => r.blockType !== 'signature' && r.blockType !== 'file',
    )
  }, [reviews])

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

      console.log('Generating Word with authorizedEmail:', authorizedEmail)
      if (authorizedEmail) {
        const sigResult = await getUserSignatureAction(authorizedEmail)
        console.log('Signature fetch result:', sigResult)
        if (sigResult.success && sigResult.data?.signature) {
          const sigBase64 = sigResult.data.signature
          const base64Data = sigBase64.includes('base64,')
            ? sigBase64.split('base64,')[1]
            : sigBase64

          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          templateData.signature = {
            data: bytes.buffer,
            extension: '.png',
            width: 8,
            height: 2,
          }
          console.log(
            'Signature injected into templateData as ArrayBuffer:',
            templateData.signature,
          )
        } else {
          console.warn('Could not fetch signature for', authorizedEmail, sigResult.error)
          setSigWarning(true)
          const binaryString = atob(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          )
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
        const binaryString = atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        )
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
        new Blob([report.buffer as ArrayBuffer], {
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

      if (authorizedEmail) {
        const sigResult = await getUserSignatureAction(authorizedEmail)
        if (!sigResult.success || !sigResult.data?.signature) {
          setSigWarning(true)
        }
      }

      const generatedMedia = (
        result.data as { pdf: string; media: { id: string; filename: string; url: string } | null }
      ).media
      if (generatedMedia) {
        setFileDisplayByField((prev) => {
          const existing = prev.__generated_pdf__ || []
          const exists = existing.some((a) => a.id === generatedMedia.id)
          return exists ? prev : { ...prev, __generated_pdf__: [...existing, generatedMedia] }
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

  // Capabilities are step-level now, shared by every approver — read directly
  // off activeReview, no more primary-vs-additional-reviewer override needed.
  const effectiveCanAcknowledge = !!activeReview?.can_acknowledge
  const effectiveCanApprove = !!activeReview?.can_approve
  const effectiveCanReject = !!activeReview?.can_reject

  useEffect(() => {
    if (activeReview) {
      if (effectiveCanAcknowledge) {
        setResponse('acknowledged')
      } else if (effectiveCanApprove) {
        setResponse('approved')
      } else if (effectiveCanReject) {
        setResponse('rejected')
      }
    }
    // Reset to phase 'before' whenever the active step changes (e.g. after advancing)
    setPhase('before')
  }, [activeReview, effectiveCanAcknowledge, effectiveCanApprove, effectiveCanReject])

  const validateFields = (blocks: FieldBlock[]): boolean => {
    for (const block of blocks) {
      if (block.required && block.name) {
        const v = fieldValues[block.name]
        if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
          setError(`Please fill in the "${block.label ?? block.name}" field.`)
          return false
        }
      }
    }
    return true
  }

  const handleChooseResponse =
    (chosen: 'approved' | 'rejected' | 'acknowledged') => (e: React.MouseEvent) => {
      e.preventDefault()
      setError(null)
      if (!validateFields(beforeFields)) return

      setResponse(chosen)
      const nextAfterFields = getAfterFields(chosen)
      if (nextAfterFields.length === 0) {
        setIsModalOpen(true)
      } else {
        setPhase('after')
      }
    }

  const handleAfterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateFields(afterFields)) return
    setIsModalOpen(true)
  }

  const buildFieldResponses = (): FieldResponseEntry[] => {
    const allBlocks = [...beforeFields, ...(phase === 'after' ? afterFields : [])]
    return allBlocks
      .filter((b) => b.name && fieldValues[b.name] !== undefined && fieldValues[b.name] !== '')
      .map((b) => ({
        name: b.name as string,
        label: b.label || b.name || '',
        value: fieldValues[b.name as string],
        blockType: b.blockType,
      }))
  }

  const handleConfirmSubmit = async () => {
    setIsModalOpen(false)
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ response, fieldResponses: buildFieldResponses() })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit response. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldCtx: FieldBlockRenderCtx = {
    fieldValues,
    setFieldValue,
    fileDisplayByField,
    setFileDisplayByField,
    uploadingField,
    setUploadingField,
    sigPadRefs,
    onUpload,
    priorFieldValues,
  }

  const responseLabel =
    response === 'approved'
      ? activeReview?.approve_label || 'Approve'
      : response === 'rejected'
        ? activeReview?.reject_label || 'Reject'
        : activeReview?.acknowledge_label || 'Acknowledge'

  return (
    <div className="mt-8 space-y-8">
      {/* Token owner badge */}
      {authorizedEmail && (isTokenValid || !!isReadOnlyToken) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-base-200 border border-base-300 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs text-base-content/60 font-medium">Viewing as:</span>
          <span className="text-xs text-primary">{authorizedEmail}</span>
        </div>
      )}

      {/* Additional Info: latest field values from completed steps */}
      {latestFieldValues.length > 0 && (
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <h3 className={cn('text-sm font-bold text-primary mb-2', noah.className)}>
              Additional Info
            </h3>
            <dl className="flex flex-col gap-2">
              {latestFieldValues.map((field) => (
                <div key={field.name} className="flex flex-col">
                  <dt className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                    {field.label}
                  </dt>
                  <dd className="text-xs text-base-content font-normal break-words">
                    {formatDisplayValue(field.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-2 mb-3">
          <div className="flex flex-1 flex-row w-full items-center">
            <h2 className={cn('text-lg font-bold text-primary', noah.className, `w-full`)}>
              Workflow Progress
            </h2>
            <select
              className="select select-bordered select-xs select-primary w-full max-w-xs font-normal"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
              aria-label="Filter workflow progress"
            >
              {REVIEW_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {reviews
            .map((review, index) => ({ review, index }))
            .filter(({ review }) => matchesReviewFilter(review, reviewFilter, workflowStatus))
            .map(({ review, index }) => {
              const isCompleted = review.response !== 'pending'
              const isActive = review.status_slug === currentStepSlug
              const isSkipped =
                !isCompleted && (workflowStatus === 'completed' || workflowStatus === 'rejected')

              const isExpanded = expandedIndexes.has(index)
              const tokens = (review.reviewer_tokens as ReviewerTokenEntry[]) || []
              const reviewerSummary =
                tokens
                  .map((t) => t.email)
                  .filter(Boolean)
                  .join(', ') || '—'
              const fieldResponses = (review.field_responses as FieldResponseEntry[]) || []

              return (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200',
                    isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-base-200 bg-base-100',
                    review.response === 'skipped'
                      ? 'border-l-4 border-l-info'
                      : isCompleted
                        ? 'border-l-4 border-l-success'
                        : '',
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className={cn('text-sm font-semibold text-base-content', noah.className)}>
                        {review.label}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {tokens.length > 1 ? 'Approvers' : 'Reviewer'}: {reviewerSummary}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'badge badge-md uppercase',
                        review.response === 'approved' && 'badge-success',
                        review.response === 'rejected' && 'badge-error',
                        review.response === 'skipped' && 'badge-info badge-outline',
                        review.response === 'acknowledged' && 'badge-success',
                        review.response === 'pending' && !isSkipped && 'badge-ghost',
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
                    <>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(index)}
                        className="btn btn-link btn-xs p-0 h-auto min-h-0 mt-2 no-underline hover:underline text-primary/70"
                      >
                        {isExpanded ? 'View Less' : 'View More'}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 text-sm border-t border-base-200 pt-3">
                          {review.custom_email_text && (
                            <p className="text-xs text-base-content/50 font-medium mb-1">
                              Instruction: {review.custom_email_text}
                            </p>
                          )}
                          {fieldResponses.length > 0 && (
                            <dl className="flex flex-col gap-1.5">
                              {fieldResponses.map((r, ri: number) => (
                                <div key={ri} className="flex flex-col">
                                  <dt className="text-[10px] font-semibold text-base-content/50 uppercase tracking-wide">
                                    {r.label ?? r.name}
                                  </dt>
                                  <dd className="text-xs text-base-content font-normal break-words">
                                    {r.blockType === 'signature' ? (
                                      <img
                                        src={String(r.value)}
                                        alt="Signature"
                                        className="h-12 w-auto border border-base-300 rounded p-1 bg-white"
                                      />
                                    ) : r.blockType === 'file' ? (
                                      <span className="italic text-base-content/60">
                                        File attached
                                      </span>
                                    ) : (
                                      formatDisplayValue(r.value)
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          <p className="mt-2 text-xs opacity-60 font-medium">
                            Reviewed by {review.reviewed_by} at{' '}
                            {new Date(review.reviewed_at!).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {tokens.length > 1 && (
                        <div className="mt-3 border-t border-base-200 pt-3">
                          <p
                            className={cn(
                              'text-xs font-bold text-primary/70 uppercase tracking-wider mb-2',
                              noah.className,
                            )}
                          >
                            Approver Responses
                          </p>
                          <div className="space-y-2">
                            {tokens.map((t, ti: number) => {
                              // The step already resolved (isCompleted, checked above) once any one
                              // approver responded — sibling tokens never get updated after that, so a
                              // lingering 'pending' here means "never responded", not "still waiting".
                              const noResponse = t.response === 'pending'
                              return (
                                <div
                                  key={ti}
                                  className="flex items-center justify-between text-xs bg-base-200/60 rounded px-3 py-2"
                                >
                                  <span className="font-medium text-base-content/80">
                                    {t.email}
                                  </span>
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span
                                      className={cn(
                                        'badge badge-xs uppercase',
                                        t.response === 'approved' && 'badge-success',
                                        t.response === 'rejected' && 'badge-error',
                                        t.response === 'acknowledged' && 'badge-success',
                                        noResponse && 'badge-outline',
                                      )}
                                    >
                                      {noResponse ? 'no response' : t.response}
                                    </span>
                                    {t.reviewed_at && (
                                      <span className="text-base-content/50 text-[10px]">
                                        {new Date(t.reviewed_at).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {isReadOnlyToken && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-6 flex flex-col items-center gap-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-base-content">View Only</h3>
            <p className="text-sm text-base-content/60">
              You have view-only access to this submission. No further action is required from you.
            </p>
          </div>
        </div>
      )}

      {!isReadOnlyToken && (isTokenValid || isReviewer) && activeReview && (
        <div
          ref={formRef}
          className="card bg-base-100 shadow-xl border border-primary/10 overflow-hidden"
        >
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-base-200 pb-3">
              <h3 className={cn('text-lg font-bold text-primary', noah.className)}>
                Your Action Required
              </h3>

              {activeReview?.can_generate_wordfile && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateWord}
                      disabled={isGeneratingWord || isGeneratingPdf || !docData}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-md text-sm font-normal transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-error text-white hover:bg-error/90 rounded-md text-sm font-normal transition-all shadow-sm active:scale-95 disabled:opacity-50"
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

            {error && (
              <div role="alert" className="alert alert-error shadow-lg mb-6">
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

            {phase === 'before' && (
              <div className="space-y-6">
                {beforeFields.length > 0 && (
                  <div className="space-y-4">
                    {beforeFields.map((block) => renderFieldBlock(block, fieldCtx))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {effectiveCanAcknowledge && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleChooseResponse('acknowledged')}
                      className="btn btn-lg w-full mt-4 font-normal btn-primary"
                    >
                      {activeReview?.acknowledge_label || 'Acknowledge'}
                    </button>
                  )}

                  {effectiveCanApprove && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleChooseResponse('approved')}
                      className="btn btn-lg w-full mt-4 font-normal btn-primary"
                    >
                      {activeReview?.approve_label || 'Approve'}
                    </button>
                  )}

                  {effectiveCanReject && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleChooseResponse('rejected')}
                      className="btn btn-lg w-full mt-4 font-normal btn-error"
                    >
                      {activeReview?.reject_label || 'Reject'}
                    </button>
                  )}
                </div>

                {reassignSlot && (
                  <div className="mt-4 pt-4 border-t border-base-200 flex justify-end">
                    {reassignSlot}
                  </div>
                )}
              </div>
            )}

            {phase === 'after' && (
              <form onSubmit={handleAfterSubmit} className="space-y-6">
                <div className="flex items-center justify-between bg-base-200/60 rounded-lg px-4 py-3">
                  <span className="text-sm font-normal text-primary">
                    Responding: {responseLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhase('before')}
                    className="btn btn-xs btn-ghost text-primary hover:text-primary-focus"
                  >
                    Change response
                  </button>
                </div>

                {afterFields.length > 0 && (
                  <div className="space-y-4">
                    {afterFields.map((block) => renderFieldBlock(block, fieldCtx))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'btn btn-lg w-full mt-4 font-normal',
                    response === 'rejected' ? 'btn-error' : 'btn-primary',
                  )}
                >
                  Submit
                </button>

                {reassignSlot && (
                  <div className="mt-4 pt-4 border-t border-base-200 flex justify-end">
                    {reassignSlot}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Your Action"
        message={`Are you sure you want to ${responseLabel.toLowerCase()} this request? This action cannot be undone.`}
        variant={response === 'rejected' ? 'error' : 'primary'}
      />
    </div>
  )
}

export default WorkflowFrontend
