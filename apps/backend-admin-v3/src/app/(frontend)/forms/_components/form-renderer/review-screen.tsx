'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { MultiStep, collectFieldEntries } from './helpers'
import { getMediaAction } from './actions'
import {
  getCrmCategoriesAction,
  getStoreDepartmentsAction,
  getSurveyDepartmentOptionsAction,
} from '@/common/actions/relation-options'
import { useFormId } from './form-id-context'
import { t, type Language } from '@/utilities/translations'

// Used during review-before-submit: value is a raw media ID, fetch info client-side.
const FilePreviewById: React.FC<{ id: string }> = ({ id }) => {
  const [media, setMedia] = useState<{
    url: string | null
    filename: string | null
    mimeType: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMediaAction(id).then((res) => {
      if (res.success && res.data) setMedia(res.data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <span className="loading loading-spinner loading-xs mt-1.5 text-primary" />
  if (!media?.url) return <p className="text-sm text-base-content/40 italic mt-0.5">File unavailable</p>

  return <FileDisplay url={media.url} filename={media.filename} mimeType={media.mimeType} />
}

// Shared display for a resolved media file (url + metadata already known).
const FileDisplay: React.FC<{
  url: string
  filename: string | null
  mimeType: string | null
}> = ({ url, filename, mimeType }) => {
  const isImage =
    mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename || '')

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {isImage && (
        <img
          src={url}
          alt={filename || 'Uploaded file'}
          className="h-auto max-h-32 w-auto max-w-[200px] object-contain rounded border border-base-200"
        />
      )}
      <div className="flex items-center gap-1.5">
        <svg
          className="h-3.5 w-3.5 text-base-content/40 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
        <span className="text-xs text-base-content/60 truncate max-w-[180px]">{filename}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-xs btn-ghost text-primary shrink-0"
        >
          View
        </a>
      </div>
    </div>
  )
}

// Blocks whose submitted value is a relationship ID (review-before-submit) rather than
// a human-readable label — resolve the title client-side, same pattern as FilePreviewById.
const RELATION_LABEL_ACTIONS: Record<
  string,
  () => Promise<{ success: boolean; data: { id: string; title?: string }[] }>
> = {
  'select-store-departments': getStoreDepartmentsAction,
  'select-crm-category': getCrmCategoriesAction,
}

const RelationLabelById: React.FC<{
  id: string
  action: () => Promise<{ success: boolean; data: { id: string; title?: string }[] }>
}> = ({ id, action }) => {
  const [label, setLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    action().then((res) => {
      if (res.success) setLabel(res.data.find((doc) => doc.id === id)?.title ?? null)
      setLoading(false)
    })
  }, [id, action])

  if (loading) return <span className="loading loading-spinner loading-xs mt-1.5 text-primary" />
  return <p className="text-sm text-base-content font-medium break-all mt-0.5">{label ?? id}</p>
}

const SurveyDepartmentLabelById: React.FC<{ id: string }> = ({ id }) => {
  const formId = useFormId()
  const action = React.useCallback(() => getSurveyDepartmentOptionsAction(formId), [formId])
  return <RelationLabelById id={id} action={action} />
}

type ReviewEntry = {
  name: string
  blockType: string
  label?: string
  options?: { label: string; value: string }[]
  value: any
}

// List item field paths look like "childrens.0.name" (index right before the leaf name,
// however deeply nested). Bucket consecutive entries that share the same list+index so they
// can be rendered under a single "Entry #N" sub-label instead of a flat, unlabeled dump.
const LIST_ITEM_RE = /^(.*)\.(\d+)\.[^.]+$/

type ReviewSection =
  | { kind: 'field'; entry: ReviewEntry }
  | { kind: 'list-item'; index: number; entries: ReviewEntry[] }

function groupReviewEntries(entries: ReviewEntry[]): ReviewSection[] {
  const sections: ReviewSection[] = []
  const bucketPositions: Record<string, number> = {}

  for (const entry of entries) {
    const match = LIST_ITEM_RE.exec(entry.name)
    if (match) {
      const bucketKey = `${match[1]}.${match[2]}`
      const existingPos = bucketPositions[bucketKey]
      if (existingPos === undefined) {
        bucketPositions[bucketKey] = sections.length
        sections.push({ kind: 'list-item', index: Number(match[2]), entries: [entry] })
      } else {
        ;(sections[existingPos] as { kind: 'list-item'; entries: ReviewEntry[] }).entries.push(
          entry,
        )
      }
    } else {
      sections.push({ kind: 'field', entry })
    }
  }

  return sections
}

const ReviewEntryRow: React.FC<{ entry: ReviewEntry; lang: Language }> = ({
  entry: { name, blockType, label: fieldLabel, options, value },
  lang,
}) => {
  if (blockType === 'message') {
    return (
      <div
        className="prose prose-sm max-w-none py-2"
        dangerouslySetInnerHTML={{ __html: lexicalToHtml(value) }}
      />
    )
  }

  const rawLabel = name.split('.').pop() || name
  const label = fieldLabel || rawLabel.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()

  let content: React.ReactNode

  if (blockType === 'signature' && typeof value === 'string' && value.startsWith('data:image')) {
    content = (
      <img
        src={value}
        alt="Signature"
        className="mt-1.5 h-16 w-auto max-w-[220px] object-contain rounded border border-base-200 bg-white"
      />
    )
  } else if (blockType === 'file' && value) {
    // Value can be a raw ID string (review before submit)
    // or an expanded media object (readOnly public view).
    if (typeof value === 'object' && value.url) {
      content = <FileDisplay url={value.url} filename={value.filename} mimeType={value.mimeType} />
    } else if (typeof value === 'string') {
      content = <FilePreviewById id={value} />
    }
  } else if (blockType === 'survey-department' && typeof value === 'string' && value) {
    content = <SurveyDepartmentLabelById id={value} />
  } else if (RELATION_LABEL_ACTIONS[blockType] && typeof value === 'string') {
    content = <RelationLabelById id={value} action={RELATION_LABEL_ACTIONS[blockType]} />
  } else {
    const optionLabel = options?.find((option) => option.value === String(value))?.label
    content = (
      <p className="text-sm text-base-content font-medium break-all mt-0.5">
        {typeof value === 'boolean' ? (value ? t('Yes', lang) : t('No', lang)) : optionLabel || String(value) || '—'}
      </p>
    )
  }

  return (
    <div className="py-2">
      <p className="text-[10px] uppercase tracking-wide text-base-content/40 font-semibold">
        {label}
      </p>
      {content}
    </div>
  )
}

export const ReviewScreen: React.FC<{
  steps: MultiStep[]
  allValues: Record<string, any>
  listCounts: Record<string, number>
  onEditStep: (idx: number) => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
  submitLabel: string
  originalSubmissionId?: string
  readOnly?: boolean
  showNoInputFields?: boolean
  language?: string
}> = ({
  steps,
  allValues,
  listCounts,
  onEditStep,
  onSubmit,
  isSubmitting,
  error,
  submitLabel,
  originalSubmissionId,
  readOnly = false,
  showNoInputFields = false,
  language,
}) => {
  const lang = language as Language

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center pb-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className={cn('text-lg font-bold text-base-content', noah.className)}>
          {readOnly ? t('Submission Details', lang) : t('Review Your Submission', lang)}
        </h2>
        <p className="text-xs text-base-content/50 mt-1">
          {readOnly ? t('This is a read-only view of the submitted form.', lang) : t('Please review your entries carefully. You can edit any section before submitting.', lang)}
        </p>
      </div>

      {steps.map((step, stepIdx) => {
        const entries = collectFieldEntries(step.fields, '', listCounts, showNoInputFields)
          .map(({ name, blockType, label, options, messageContent }) => ({
            name,
            blockType,
            label,
            options,
            value: blockType === 'message' ? messageContent : allValues[name],
          }))
          .filter(({ value }) => value !== undefined && value !== '' && value !== false && value !== null)

        if (entries.length === 0) return null
        return (
          <div key={stepIdx} className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-4 gap-3">
              <div className="flex items-center justify-between">
                <h3 className={cn('font-bold text-sm text-secondary', noah.className)}>
                  {step.label}
                </h3>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onEditStep(stepIdx)}
                    className="btn btn-xs btn-ghost text-primary gap-1 hover:bg-primary/10"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    {t('Edit', lang)}
                  </button>
                )}
              </div>

              <div className="divide-y divide-base-200">
                {groupReviewEntries(entries).map((section, idx) =>
                  section.kind === 'field' ? (
                    <ReviewEntryRow key={section.entry.name} entry={section.entry} lang={lang} />
                  ) : (
                    <div key={`entry-${idx}`} className="py-2">
                      <p className={cn('text-sm font-semibold text-base-content/60 mb-1', noah.className)}>
                        {t('Entry', lang)} #{section.index + 1}
                      </p>
                      <div className="divide-y divide-base-200 pl-3 border-l-2 border-base-200">
                        {section.entries.map((entry) => (
                          <ReviewEntryRow key={entry.name} entry={entry} lang={lang} />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )
      })}

      {!readOnly && error && (
        <div className="alert alert-error shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            'btn btn-primary btn-lg w-full text-white shadow-md hover:shadow-lg transition-all duration-300',
            noah.className,
          )}
        >
          {originalSubmissionId ? t('Resubmit', lang) : submitLabel || t('Submit', lang)}
          {isSubmitting && <span className="loading loading-ring loading-md ml-2" />}
        </button>
      )}
    </div>
  )
}
