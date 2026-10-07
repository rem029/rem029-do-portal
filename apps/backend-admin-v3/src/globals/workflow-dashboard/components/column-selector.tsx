'use client'

import React, { useEffect, useRef, useState } from 'react'

export const WORKFLOW_COLUMNS = [
  { key: 'formTitle', label: 'Form' },
  { key: 'submissionId', label: 'Submission ID' },
  { key: 'submittedBy', label: 'Submitted By' },
  { key: 'submittedAt', label: 'Submitted At' },
  { key: 'status', label: 'Status' },
  { key: 'currentStepLabel', label: 'Current Step' },
  { key: 'progress', label: 'Progress' },
  { key: 'operator', label: 'Operator' },
  { key: 'workflowVersion', label: 'Version' },
] as const

export type WorkflowColumnKey = (typeof WORKFLOW_COLUMNS)[number]['key']

interface WorkflowColumnSelectorProps {
  visibleKeys: Set<WorkflowColumnKey>
  onChange: (keys: Set<WorkflowColumnKey>) => void
}

export const WorkflowColumnSelector: React.FC<WorkflowColumnSelectorProps> = ({
  visibleKeys,
  onChange,
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const allVisible = WORKFLOW_COLUMNS.every((c) => visibleKeys.has(c.key))
  const someVisible = WORKFLOW_COLUMNS.some((c) => visibleKeys.has(c.key))
  const visibleCount = WORKFLOW_COLUMNS.filter((c) => visibleKeys.has(c.key)).length

  const toggleAll = () => {
    if (allVisible) {
      onChange(new Set())
    } else {
      onChange(new Set(WORKFLOW_COLUMNS.map((c) => c.key)))
    }
  }

  const toggle = (key: WorkflowColumnKey) => {
    const next = new Set(visibleKeys)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange(next)
  }

  const indeterminate = someVisible && !allVisible

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-(--theme-elevation-100) hover:bg-(--theme-elevation-150) text-(--theme-elevation-700) border border-(--theme-elevation-200) transition-colors cursor-pointer whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="1" y="4" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
          <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
          <rect
            x="1"
            y="10.5"
            width="14"
            height="1.5"
            rx="0.75"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
        Columns
        <span className="text-(--theme-elevation-500) font-normal tabular-nums">
          {visibleCount}/{WORKFLOW_COLUMNS.length}
        </span>
        <span className="opacity-40 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-40 w-[220px] bg-(--theme-elevation-0) border border-(--theme-elevation-200) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50)">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allVisible}
                ref={(el) => {
                  if (el) el.indeterminate = indeterminate
                }}
                onChange={toggleAll}
                className="cursor-pointer shrink-0"
              />
              <span className="text-[11px] font-bold text-(--theme-elevation-600) uppercase tracking-[0.06em]">
                All columns
              </span>
            </label>
          </div>

          {/* Column list */}
          <div className="overflow-y-auto max-h-[300px] py-1">
            {WORKFLOW_COLUMNS.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2.5 px-3 py-[7px] hover:bg-(--theme-elevation-50) cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={visibleKeys.has(col.key)}
                  onChange={() => toggle(col.key)}
                  className="cursor-pointer shrink-0"
                />
                <span className="text-[13px] text-(--theme-elevation-800)">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
