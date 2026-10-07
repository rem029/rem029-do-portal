'use client'

import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Modal } from '@payloadcms/ui'
import { WorkflowSubmissionRow, fetchWorkflowSubmissionDetail } from './actions'
import { ReviewHistory } from './review-history'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export const workflowDetailModalSlug = 'workflow-detail-modal'

export const WorkflowDetailModal: React.FC<{
  row: WorkflowSubmissionRow | null
  userId: string
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}> = ({ row, userId, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchWorkflowSubmissionDetail>
  > | null>(null)

  // Guards against a slower earlier fetch (e.g. row A) resolving after a
  // faster later one (row B) and clobbering the UI when the user clicks
  // prev/next in quick succession.
  const requestIdRef = useRef(0)

  const rowId = row?.id
  const rowVersion = row?.version
  const instanceId = row?.version === 'v2' ? row.instance.id : undefined

  useEffect(() => {
    if (!rowId || !rowVersion) {
      setDetail(null)
      return
    }
    const requestId = ++requestIdRef.current
    setLoading(true)
    fetchWorkflowSubmissionDetail(userId, rowId, rowVersion, instanceId)
      .then((result) => {
        if (requestId !== requestIdRef.current) return
        setDetail(result)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })
  }, [rowId, rowVersion, instanceId, userId])

  if (!row) return null

  // Enriched by fetchWorkflowSubmissionDetail with label/type/url/filename resolved
  // against the form's field config — raw submission.submissionData only has {field,value,id}.
  const submissionData = detail?.submissionData ?? []

  // Group submission data
  const flatItems: typeof submissionData = []
  const sectionMap: Record<string, typeof submissionData> = {}

  submissionData.forEach((item) => {
    const parts = item.field.split('.')
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      const groupKey = `${parts[0]}.${parts[1]}`
      if (!sectionMap[groupKey]) sectionMap[groupKey] = []
      sectionMap[groupKey].push(item)
    } else if (parts.length === 2) {
      if (!sectionMap[parts[0]]) sectionMap[parts[0]] = []
      sectionMap[parts[0]].push(item)
    } else {
      flatItems.push(item)
    }
  })

  const renderItems = (items: typeof submissionData) => (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.field}>
          <label className="block text-[10px] font-bold text-(--theme-elevation-500) uppercase mb-0.5">
            {item.label || item.field.split('.').pop()}
          </label>
          {item.type === 'signature' && item.value ? (
            <img
              src={item.value}
              alt="Signature"
              style={{
                maxHeight: '80px',
                display: 'block',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                background: 'white',
              }}
            />
          ) : item.type === 'file' && item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              {item.filename || 'View file'} ↗
            </a>
          ) : (
            <div className="text-sm text-(--theme-elevation-800)">
              {item.value || <span style={{ opacity: 0.3 }}>—</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Modal
      slug={workflowDetailModalSlug}
      className="fixed inset-0 flex items-center justify-center p-4 z-9999"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[680px] max-h-[90vh] flex flex-col bg-(--theme-elevation-50) border border-(--theme-elevation-150) rounded-lg shadow-2xl z-10 overflow-hidden text-(--theme-elevation-800)">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50) shrink-0">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base font-bold truncate">{row.formTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-(--theme-elevation-500) font-mono">{row.id}</span>
              <span
                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: row.version === 'v2' ? '#dbeafe' : '#f3f4f6',
                  color: row.version === 'v2' ? '#1d4ed8' : 'var(--theme-elevation-600)',
                }}
              >
                {row.version.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-(--theme-elevation-150) rounded p-0.5">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-1 px-3 text-xs font-bold disabled:opacity-30 hover:bg-(--theme-elevation-250) rounded transition-colors cursor-pointer"
                title="Previous"
              >
                ←
              </button>
              <div className="w-px bg-(--theme-elevation-300) my-1" />
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="p-1 px-3 text-xs font-bold disabled:opacity-30 hover:bg-(--theme-elevation-250) rounded transition-colors cursor-pointer"
                title="Next"
              >
                →
              </button>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-1 px-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Meta row */}
          <div className="mb-4 pb-4 border-b border-(--theme-elevation-150) flex flex-wrap gap-6 text-[12px]">
            <div>
              <span className="text-[10px] font-bold uppercase text-(--theme-elevation-500)">
                Submitted By
              </span>
              <div className="font-medium text-(--theme-elevation-800) mt-0.5">
                {row.submittedBy || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-(--theme-elevation-500)">
                Submitted At
              </span>
              <div className="font-medium text-(--theme-elevation-800) mt-0.5">
                {format(new Date(row.submittedAt), 'PPP p')}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-(--theme-elevation-500)">
                Status
              </span>
              <div className="font-medium text-(--theme-elevation-800) mt-0.5 capitalize">
                {row.status}
              </div>
            </div>
            {row.currentStepLabel && (
              <div>
                <span className="text-[10px] font-bold uppercase text-(--theme-elevation-500)">
                  Current Step
                </span>
                <div className="font-medium text-(--theme-elevation-800) mt-0.5">
                  {row.currentStepLabel}
                </div>
              </div>
            )}
            <div>
              <a
                href={`${BACKEND_URL_WITH_BASE}/forms/submissions/${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-500 hover:underline mt-2"
              >
                View Submission ↗
              </a>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-(--theme-elevation-400) text-sm">
              Loading detail…
            </div>
          ) : (
            <>
              {/* Submission fields */}
              {submissionData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-(--theme-elevation-400) border-b border-(--theme-elevation-150) pb-1 mb-3">
                    Submission Data
                  </h4>
                  {flatItems.length > 0 && renderItems(flatItems)}
                  {Object.entries(sectionMap).map(([key, items]) => {
                    const parts = key.split('.')
                    let title = parts[0].replace(/_/g, ' ')
                    if (parts.length > 1) title = `${title} #${Number(parts[1]) + 1}`
                    return (
                      <div key={key} className="mt-4">
                        <h5 className="text-[10px] font-bold uppercase text-(--theme-elevation-400) mb-2">
                          {title}
                        </h5>
                        {renderItems(items)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Review history */}
              <ReviewHistory
                reviews={detail?.reviews || []}
                currentStepSlug={detail?.currentStepSlug || null}
                status={row.status}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
