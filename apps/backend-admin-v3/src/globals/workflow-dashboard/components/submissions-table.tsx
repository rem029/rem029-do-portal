'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { WorkflowSubmissionRow } from './actions'
import { WorkflowColumnKey } from './column-selector'

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--theme-elevation-150)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? '#16a34a' : 'var(--theme-elevation-500)',
          }}
        />
      </div>
      <span className="text-[10px] text-(--theme-elevation-500)">
        {completed}/{total}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    completed: { color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0' },
    rejected: { color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' },
    in_review: { color: '#d97706', background: '#fffbeb', borderColor: '#fde68a' },
    pending: { color: '#2563eb', background: '#eff6ff', borderColor: '#bfdbfe' },
  }
  const style = styles[status] || {
    color: 'var(--theme-elevation-600)',
    background: 'var(--theme-elevation-100)',
    borderColor: 'var(--theme-elevation-200)',
  }
  return (
    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border" style={style}>
      {status.replace('_', ' ')}
    </span>
  )
}

function VersionBadge({ version }: { version: 'v1' | 'v2' }) {
  const style: React.CSSProperties =
    version === 'v2'
      ? { color: '#1d4ed8', background: '#dbeafe', borderColor: '#bfdbfe' }
      : {
          color: 'var(--theme-elevation-600)',
          background: 'var(--theme-elevation-100)',
          borderColor: 'var(--theme-elevation-200)',
        }
  return (
    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border" style={style}>
      {version.toUpperCase()}
    </span>
  )
}

const thBase =
  'px-3 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-(--theme-elevation-500) border-b-2 border-(--theme-elevation-150) whitespace-nowrap'

const tdBase =
  'px-3 py-[10px] text-[13px] text-(--theme-elevation-800) border-b border-(--theme-elevation-100) align-middle'

// Fixed column order — version is deprioritized to last (users don't care about it);
// submissionId surfaces the UUID so duplicate-looking rows can be told apart.
const COLUMN_ORDER: WorkflowColumnKey[] = [
  'formTitle',
  'submissionId',
  'submittedBy',
  'submittedAt',
  'status',
  'currentStepLabel',
  'progress',
  'operator',
  'workflowVersion',
]

const COLUMN_LABELS: Record<WorkflowColumnKey, string> = {
  formTitle: 'Form',
  submissionId: 'Submission ID',
  submittedBy: 'Submitted By',
  submittedAt: 'Submitted At',
  workflowVersion: 'Version',
  status: 'Status',
  currentStepLabel: 'Current Step',
  progress: 'Progress',
  operator: 'Operator',
}

interface WorkflowSubmissionsTableProps {
  rows: WorkflowSubmissionRow[]
  visibleColumns: Set<WorkflowColumnKey>
  loading: boolean
  searchQuery: string
  pagination: {
    totalDocs: number
    totalPages: number
    hasPrevPage: boolean
    hasNextPage: boolean
  }
  page: number
  limit: number
  onRowClick: (index: number) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export const WorkflowSubmissionsTable: React.FC<WorkflowSubmissionsTableProps> = ({
  rows,
  visibleColumns,
  loading,
  searchQuery,
  pagination,
  page,
  limit,
  onRowClick,
  onPageChange,
  onLimitChange,
}) => {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [jumpToPage, setJumpToPage] = useState('')

  const visibleColOrder = COLUMN_ORDER.filter((key) => visibleColumns.has(key))
  const colSpan = visibleColOrder.length

  const renderCell = (row: WorkflowSubmissionRow, key: WorkflowColumnKey): React.ReactNode => {
    switch (key) {
      case 'formTitle':
        return (
          <span className="font-medium text-(--theme-elevation-800) text-[13px]">
            {row.formTitle}
          </span>
        )
      case 'submissionId':
        return (
          <span
            className="text-[11px] font-mono text-(--theme-elevation-500)"
            title={row.id}
          >
            {row.id}
          </span>
        )
      case 'submittedBy':
        return (
          <span className="text-[13px] text-(--theme-elevation-700)">
            {row.submittedBy || <span className="opacity-30">—</span>}
          </span>
        )
      case 'submittedAt':
        return (
          <span className="text-[12px] text-(--theme-elevation-700) whitespace-nowrap">
            {format(new Date(row.submittedAt), 'MMM dd, yyyy HH:mm')}
          </span>
        )
      case 'workflowVersion':
        return <VersionBadge version={row.version} />
      case 'status':
        return <StatusBadge status={row.status} />
      case 'currentStepLabel':
        return (
          <span className="text-[12px] text-(--theme-elevation-700)">
            {row.currentStepLabel || <span className="opacity-30">—</span>}
          </span>
        )
      case 'progress':
        return <ProgressBar completed={row.completedSteps} total={row.totalSteps} />
      case 'operator':
        return (
          <span className="text-[12px] text-(--theme-elevation-700)">
            {row.operator || <span className="opacity-30">—</span>}
          </span>
        )
      default:
        return <span className="opacity-30">—</span>
    }
  }

  return (
    <>
      {/* Table */}
      <div className="border border-(--theme-elevation-150) rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-(--theme-elevation-50)">
              <tr>
                {visibleColOrder.map((key) => (
                  <th key={key} className={thBase}>
                    {COLUMN_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className={`${tdBase} text-center py-8`}>
                    Loading submissions…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className={`${tdBase} text-center py-10 text-(--theme-elevation-400)`}
                  >
                    {searchQuery
                      ? 'No submissions match your search.'
                      : 'No workflow submissions found.'}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const isHovered = hoveredRowId === row.id
                  const rowBgClass = isHovered
                    ? 'bg-(--theme-elevation-50)'
                    : 'bg-(--theme-elevation-0)'

                  return (
                    <tr
                      key={`${row.id}-${row.version}`}
                      className={`${rowBgClass} cursor-pointer`}
                      onClick={() => onRowClick(index)}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {visibleColOrder.map((key) => (
                        <td key={key} className={tdBase}>
                          {renderCell(row, key)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 p-4 bg-(--theme-elevation-50) rounded-md border border-(--theme-elevation-150) flex-wrap gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-(--theme-elevation-500) whitespace-nowrap">
              Items per page:
            </span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="bg-transparent border border-(--theme-elevation-150) rounded px-2 py-0.5 text-xs cursor-pointer text-(--theme-elevation-800)"
            >
              {[10, 25, 50, 100].map((size) => (
                <option
                  key={size}
                  value={size}
                  className="bg-(--theme-elevation-50) text-(--theme-elevation-800)"
                >
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-(--theme-elevation-500) whitespace-nowrap">
              Jump to page:
            </span>
            <input
              type="number"
              min={1}
              max={pagination.totalPages}
              placeholder={String(page)}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = Number(jumpToPage)
                  if (p >= 1 && p <= pagination.totalPages) {
                    onPageChange(p)
                    setJumpToPage('')
                  }
                }
              }}
              className="w-[50px] bg-transparent border border-(--theme-elevation-150) rounded px-2 py-0.5 text-xs text-(--theme-elevation-800)"
            />
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <span className="text-xs text-(--theme-elevation-500) font-medium">
            {pagination.totalDocs > 0 ? (
              <>
                {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.totalDocs)} of{' '}
                {pagination.totalDocs}
              </>
            ) : (
              '0 Submissions'
            )}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={!pagination.hasPrevPage || loading}
              className="px-3 py-1.5 rounded border border-(--theme-elevation-150) bg-transparent text-xs font-semibold text-(--theme-elevation-600) transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="px-3 py-1.5 rounded border border-(--theme-elevation-150) bg-transparent text-xs font-semibold text-(--theme-elevation-600) transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
