'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Modal } from '@payloadcms/ui'
import { FormSubmissionRow } from './actions'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export const detailModalSlug = 'submission-detail-modal'

export const SubmissionDetailModal: React.FC<{
  submission: FormSubmissionRow | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  onStatusChange?: (submissionId: string, newStatus: string) => void
  onDataSave?: (submissionId: string, updatedData: any[]) => Promise<void>
  onArchiveToggle?: (submissionId: string, archived: boolean) => Promise<void> | void
}> = ({
  submission,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onStatusChange,
  onDataSave,
  onArchiveToggle,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  useEffect(() => {
    setIsEditing(false)
    if (submission?.submissionData) {
      setEditedData(JSON.parse(JSON.stringify(submission.submissionData)))
    } else {
      setEditedData([])
    }
  }, [submission])

  if (!submission) return null

  // Advanced grouping logic
  // 1. Ungrouped (flat) fields
  // 2. Sections (groups or list items)
  const sections: { title: string; items: any[] }[] = []
  const flatItems: any[] = []

  const sectionMap: Record<string, any[]> = {}

  const dataToRender = isEditing ? editedData : submission.submissionData || []

  dataToRender.forEach((item, index) => {
    // Keep track of the original index to update the state later
    const itemWithIndex = { ...item, _originalIndex: index }
    const parts = item.field.split('.')

    // Check if it's a list item (parent.index.child)
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      const parentName = parts[0]
      const listIndex = parts[1]
      const groupKey = `${parentName}.${listIndex}`

      if (!sectionMap[groupKey]) sectionMap[groupKey] = []
      sectionMap[groupKey].push(itemWithIndex)
    }
    // Check if it's a group item (parent.child)
    else if (parts.length === 2) {
      const parentName = parts[0]
      if (!sectionMap[parentName]) sectionMap[parentName] = []
      sectionMap[parentName].push(itemWithIndex)
    }
    // Flat field
    else {
      flatItems.push(itemWithIndex)
    }
  })

  const renderFieldValue = (item: any) => {
    // 1. Signature Field rendering
    if (item.type === 'signature' && item.value) {
      return (
        <div className="mt-2 border border-(--theme-elevation-150) rounded p-2 bg-white inline-block">
          <img src={item.value} alt="Signature" style={{ maxHeight: '100px', display: 'block' }} />
        </div>
      )
    }

    // 2. Interactive Editing Layout View
    if (isEditing && item.type !== 'signature') {
      const onChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => {
        const newData = [...editedData]
        newData[item._originalIndex].value = e.target.value
        setEditedData(newData)
      }

      if (item.type === 'textarea') {
        return (
          <textarea
            value={item.value || ''}
            onChange={onChange}
            disabled={isSaving}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-(--theme-elevation-200) rounded bg-(--theme-elevation-0) text-(--theme-elevation-800) focus:outline-none focus:border-(--theme-elevation-400)"
          />
        )
      }

      if (
        item.type === 'select' ||
        item.type === 'radio' ||
        item.type === 'select-operators' ||
        item.type === 'select-restaurants'
      ) {
        const options: { label: string; value: string }[] = item.options || []

        // For relationship blocks (select-operators, select-restaurants), we want to save the label, not the ID.
        const useLabelAsValue =
          item.type === 'select-operators' || item.type === 'select-restaurants'

        return (
          <select
            value={item.value || ''}
            onChange={onChange}
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm border border-(--theme-elevation-200) rounded bg-(--theme-elevation-0) text-(--theme-elevation-800) focus:outline-none focus:border-(--theme-elevation-400)"
          >
            <option value="">- Select -</option>
            {options.map((opt) => (
              <option key={opt.value} value={useLabelAsValue ? opt.label : opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      }

      let inputType = 'text'
      if (item.type === 'number') inputType = 'number'
      if (item.type === 'email') inputType = 'email'
      if (item.type === 'date') inputType = 'date'
      if (item.type === 'time') inputType = 'time'

      return (
        <input
          type={inputType}
          value={item.value || ''}
          onChange={onChange}
          disabled={isSaving}
          className="w-full px-3 py-2 text-sm border border-(--theme-elevation-200) rounded bg-(--theme-elevation-0) text-(--theme-elevation-800) focus:outline-none focus:border-(--theme-elevation-400)"
        />
      )
    }

    // 3. File field — use url/filename/mimeType resolved server-side
    if (item.type === 'file') {
      if (!item.url) return <span style={{ opacity: 0.3 }}>—</span>

      const isImage =
        item.mimeType?.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.filename || '')

      return (
        <div className="mt-2 flex flex-col gap-1.5">
          {isImage && (
            <img
              src={item.url}
              alt={item.filename || 'Uploaded file'}
              style={{
                maxWidth: '200px',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '6px',
                border: '1px solid var(--theme-elevation-200)',
                display: 'block',
              }}
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-(--theme-elevation-600) max-w-[200px] truncate">
              {item.filename || 'Attached file'}
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-500 hover:underline shrink-0"
            >
              View ↗
            </a>
          </div>
        </div>
      )
    }

    // 4. Plain Text string fallback handler
    if (!item.value) return <span style={{ opacity: 0.3 }}>—</span>
    return <div className="text-sm">{String(item.value)}</div>
  }

  const renderItems = (items: any[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.field}>
          <label className="block text-[10px] font-bold text-(--theme-elevation-500) uppercase mb-1">
            {item.label}
          </label>
          {renderFieldValue(item)}
        </div>
      ))}
    </div>
  )

  const handleSave = async () => {
    if (!onDataSave) return
    setIsSaving(true)
    try {
      await onDataSave(submission.id, editedData)
      setIsEditing(false)
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!onArchiveToggle) return
    setIsArchiving(true)
    try {
      await onArchiveToggle(submission.id, !submission.isArchived)
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <Modal
      slug={detailModalSlug}
      className="fixed inset-0 flex items-center justify-center p-4 z-9999"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col bg-(--theme-elevation-50) border border-(--theme-elevation-150) rounded-lg shadow-2xl z-10 overflow-hidden text-(--theme-elevation-800)">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50)">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold flex items-center gap-2">
              {submission.formTitle}
              {submission.isArchived && (
                <span className="px-1.5 py-[1px] rounded bg-(--theme-elevation-200) text-(--theme-elevation-600) text-[9px] font-bold uppercase tracking-wide">
                  Archived
                </span>
              )}
            </h3>
            <span className="text-[10px] text-(--theme-elevation-500) font-mono">
              {submission.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-(--theme-elevation-150) rounded p-0.5">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-1 px-3 text-xs font-bold disabled:opacity-30 hover:bg-(--theme-elevation-250) rounded transition-colors"
                title="Previous"
              >
                ←
              </button>
              <div className="w-px bg-(--theme-elevation-300) my-1" />
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="p-1 px-3 text-xs font-bold disabled:opacity-30 hover:bg-(--theme-elevation-250) rounded transition-colors"
                title="Next"
              >
                →
              </button>
            </div>

            {submission.canUpdate &&
              (isEditing ? (
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedData(JSON.parse(JSON.stringify(submission.submissionData || [])))
                    }}
                    disabled={isSaving}
                    className="p-1 px-3 bg-(--theme-elevation-200) hover:bg-(--theme-elevation-300) text-(--theme-elevation-800) text-xs font-bold rounded transition-colors disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-1 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 px-3 bg-(--theme-elevation-200) hover:bg-(--theme-elevation-300) text-(--theme-elevation-800) text-xs font-bold rounded transition-colors disabled:opacity-50"
                >
                  EDIT
                </button>
              ))}

            {submission.canDelete && onArchiveToggle && (
              <button
                onClick={handleArchiveToggle}
                disabled={isArchiving || isSaving}
                className="ml-2 p-1 px-3 bg-(--theme-elevation-200) hover:bg-(--theme-elevation-300) text-(--theme-elevation-800) text-xs font-bold rounded transition-colors disabled:opacity-50"
              >
                {isArchiving
                  ? 'SAVING...'
                  : submission.isArchived
                    ? 'UNARCHIVE'
                    : 'ARCHIVE'}
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isSaving}
              className="ml-2 p-1 px-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-bold rounded transition-colors disabled:opacity-50"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {submission.enableWorkflow && (
                <a
                  href={`${BACKEND_URL_WITH_BASE}/forms/submissions/${submission.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold px-1 py-1.5"
                >
                  View Form Submission ↗
                </a>
              )}
              {submission.enablePublicSubmissionLink && submission.formSlug && (
                <a
                  href={`${BACKEND_URL_WITH_BASE}/forms/${submission.formSlug}/${submission.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold px-1 py-1.5 text-primary"
                >
                  View Public Link ↗
                </a>
              )}
            </div>

            {submission.enableFormStatus && onStatusChange && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-(--theme-elevation-500) text-xs uppercase">
                  Status:
                </span>
                <select
                  value={submission.formStatus || ''}
                  onChange={(e) => onStatusChange(submission.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--theme-elevation-200)',
                    background: 'var(--theme-elevation-50)',
                    fontSize: '12px',
                    color: 'var(--theme-elevation-800)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">- Select -</option>
                  {submission.formStatuses?.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {flatItems.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-(--theme-elevation-400) border-b border-(--theme-elevation-150) pb-1 mb-3">
                General Information
              </h4>
              {renderItems(flatItems)}
            </div>
          )}

          {Object.entries(sectionMap).map(([key, items]) => {
            const parts = key.split('.')
            let title = parts[0].replace(/_/g, ' ')
            if (parts.length > 1) {
              title = `${title} #${Number(parts[1]) + 1}`
            }

            return (
              <div key={key} className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-(--theme-elevation-400) border-b border-(--theme-elevation-150) pb-1 mb-3">
                  {title}
                </h4>
                {renderItems(items)}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-(--theme-elevation-150) bg-(--theme-elevation-50) flex justify-between items-center text-[11px] text-(--theme-elevation-500)">
          <div>
            Submitted By:{' '}
            <span className="font-bold text-(--theme-elevation-700)">{submission.submittedBy}</span>
          </div>
          <div>{format(new Date(submission.submittedAt), 'PPP p')}</div>
        </div>
      </div>
    </Modal>
  )
}
