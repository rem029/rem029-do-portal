'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { FormSubmissionRow } from './actions'
import { resolveSubmittedBy } from '@/utilities/forms-dashboard'

export interface DynamicField {
  key: string
  label: string
  type: 'flat' | 'list'
  parentKey?: string
  parentLabel?: string
}

export type ColGroup =
  | { kind: 'single'; field: DynamicField }
  | { kind: 'group'; parentKey: string; parentLabel: string; fields: DynamicField[] }

export function buildColGroups(fields: DynamicField[]): ColGroup[] {
  const groups: ColGroup[] = []
  for (const field of fields) {
    if (!field.parentKey) {
      groups.push({ kind: 'single', field })
    } else {
      const last = groups[groups.length - 1]
      if (last?.kind === 'group' && last.parentKey === field.parentKey) {
        last.fields.push(field)
      } else {
        groups.push({
          kind: 'group',
          parentKey: field.parentKey,
          parentLabel: field.parentLabel || field.parentKey.replace(/_/g, ' '),
          fields: [field],
        })
      }
    }
  }
  return groups
}

export interface SubmissionsTableProps {
  displayedSubmissions: FormSubmissionRow[]
  dynamicFields: DynamicField[]
  showStatusColumn: boolean
  loadingSubmissions: boolean
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
  onStatusChange: (submissionId: string, newStatus: string) => void
  onArchiveToggle: (submissionId: string, archived: boolean) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

function renderCellValue(_colKey: string, data: any): React.ReactNode {
  if (!data?.value) return <span className="opacity-30">—</span>

  if (data.type === 'file') {
    if (!data.url) return <span className="opacity-30">—</span>
    const isImage =
      data.mimeType?.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(data.filename || '')
    return (
      <div className="flex flex-col gap-1">
        {isImage && (
          <img
            src={data.url}
            alt={data.filename || 'Uploaded file'}
            className="max-w-[80px] h-auto object-contain rounded border border-(--theme-elevation-200) block"
          />
        )}
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-mono text-(--theme-elevation-600) underline max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap inline-block"
        >
          {data.filename || 'View file'}
        </a>
      </div>
    )
  }

  return String(data.value)
}

const thBase =
  'px-3 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-(--theme-elevation-500) border-b-2 border-(--theme-elevation-150) whitespace-nowrap'

const thGroupHeader =
  'px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-(--theme-elevation-700) bg-(--theme-elevation-100) border-b border-(--theme-elevation-200) whitespace-nowrap'

const stickyTh = `${thBase} sticky z-10 bg-(--theme-elevation-50)`

const tdBase =
  'px-3 py-[10px] text-[13px] text-(--theme-elevation-800) border-b border-(--theme-elevation-100) align-middle'

const stickyTdBase =
  'px-3 py-[10px] text-[11px] text-(--theme-elevation-600) border-b border-(--theme-elevation-100) align-middle sticky z-[5]'

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  displayedSubmissions,
  dynamicFields,
  showStatusColumn,
  loadingSubmissions,
  searchQuery,
  pagination,
  page,
  limit,
  onRowClick,
  onStatusChange,
  onArchiveToggle,
  onPageChange,
  onLimitChange,
}) => {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [jumpToPage, setJumpToPage] = useState('')

  const colGroups = buildColGroups(dynamicFields)
  const hasGroupedCols = colGroups.some((g) => g.kind === 'group')
  const theadRowSpan = hasGroupedCols ? 2 : 1
  const groupStartKeys = new Set(
    colGroups.flatMap((g) => (g.kind === 'group' ? [g.fields[0].key] : [])),
  )

  const colSpanCount = 1 + (showStatusColumn ? 1 : 0) + dynamicFields.length + 1

  return (
    <>
      {/* Table */}
      <div className="border border-(--theme-elevation-150) rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-(--theme-elevation-50)">
              {/* Row 1: sticky columns (rowspan) + group headers (colspan) + ungrouped fields (rowspan) */}
              <tr>
                {showStatusColumn && (
                  <th
                    rowSpan={theadRowSpan}
                    className={`${stickyTh} left-0 w-[140px] min-w-[140px] border-r border-(--theme-elevation-150)`}
                  >
                    Status
                  </th>
                )}
                <th
                  rowSpan={theadRowSpan}
                  className={`${stickyTh} ${showStatusColumn ? 'left-[140px]' : 'left-0'} w-[160px] min-w-[160px] border-r border-(--theme-elevation-150)`}
                >
                  Submitted Date
                </th>
                {colGroups.map((group) =>
                  group.kind === 'single' ? (
                    <th key={group.field.key} rowSpan={theadRowSpan} className={thBase}>
                      {group.field.label}
                    </th>
                  ) : (
                    <th
                      key={group.parentKey}
                      colSpan={group.fields.length}
                      className={thGroupHeader}
                    >
                      {group.parentLabel}
                    </th>
                  ),
                )}
                <th rowSpan={theadRowSpan} className={`${thBase} text-right`}>
                  Actions
                </th>
              </tr>
              {/* Row 2: sub-field headers for each group (only when groups exist) */}
              {hasGroupedCols && (
                <tr>
                  {colGroups.flatMap((group) =>
                    group.kind === 'group'
                      ? group.fields.map((f, i) => (
                          <th
                            key={f.key}
                            className={`${thBase}${i === 0 ? ' border-l border-(--theme-elevation-200)' : ''}`}
                          >
                            {f.label}
                          </th>
                        ))
                      : [],
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {loadingSubmissions ? (
                <tr>
                  <td colSpan={colSpanCount} className={`${tdBase} text-center py-8`}>
                    Loading submissions…
                  </td>
                </tr>
              ) : displayedSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpanCount}
                    className={`${tdBase} text-center py-10 text-(--theme-elevation-400)`}
                  >
                    {searchQuery ? 'No submissions match your search.' : 'No submissions found.'}
                  </td>
                </tr>
              ) : (
                displayedSubmissions.map((row, index) => {
                  const isHovered = hoveredRowId === row.id
                  const rowBgClass = isHovered
                    ? 'bg-(--theme-elevation-50)'
                    : row.isArchived
                      ? 'bg-(--theme-elevation-50) opacity-60'
                      : 'bg-(--theme-elevation-0)'

                  return (
                    <tr
                      key={row.id}
                      className={`${rowBgClass} cursor-pointer`}
                      onClick={() => onRowClick(index)}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {showStatusColumn && (
                        <td
                          className={`${stickyTdBase} left-0 ${rowBgClass} border-r border-(--theme-elevation-150)`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.enableFormStatus ? (
                            <select
                              value={row.formStatus || ''}
                              onChange={(e) => onStatusChange(row.id, e.target.value)}
                              className="px-2 py-1 rounded border border-(--theme-elevation-200) bg-(--theme-elevation-50) text-xs text-(--theme-elevation-800) cursor-pointer w-full"
                            >
                              <option value="">- Select -</option>
                              {row.formStatuses?.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="opacity-30">—</span>
                          )}
                        </td>
                      )}
                      <td
                        className={`${stickyTdBase} ${showStatusColumn ? 'left-[140px]' : 'left-0'} ${rowBgClass} border-r border-(--theme-elevation-150)`}
                      >
                        <div className="font-medium text-(--theme-elevation-800) whitespace-nowrap text-xs flex items-center gap-1.5">
                          {format(new Date(row.submittedAt), 'MMM dd, yyyy HH:mm')}
                          {row.isArchived && (
                            <span className="px-1.5 py-[1px] rounded bg-(--theme-elevation-200) text-(--theme-elevation-600) text-[9px] font-bold uppercase tracking-wide">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-(--theme-elevation-500) mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                          {resolveSubmittedBy(row)}
                        </div>
                      </td>
                      {dynamicFields.map((col) => {
                        let displayValue: React.ReactNode = (
                          <span className="opacity-30">—</span>
                        )
                        if (col.type === 'list') {
                          const prefix = `${col.key}.`
                          const listItems =
                            row.submissionData?.filter((item) =>
                              item.field.startsWith(prefix),
                            ) || []
                          const uniqueIndices = new Set(
                            listItems.map((item) => item.field.split('.')[1]),
                          ).size
                          displayValue = uniqueIndices > 0 ? `Count: ${uniqueIndices}` : '0'
                        } else {
                          const data = row.submissionData?.find((d) => d.field === col.key)
                          displayValue = renderCellValue(col.key, data)
                        }
                        return (
                          <td
                            key={col.key}
                            className={`${tdBase}${groupStartKeys.has(col.key) ? ' border-l border-(--theme-elevation-100)' : ''}`}
                          >
                            {displayValue}
                          </td>
                        )
                      })}
                      <td className={`${tdBase} text-right`} onClick={(e) => e.stopPropagation()}>
                        {row.canDelete ? (
                          <button
                            type="button"
                            onClick={() => onArchiveToggle(row.id, !row.isArchived)}
                            className="px-2 py-1 rounded border border-(--theme-elevation-200) bg-transparent hover:bg-(--theme-elevation-100) text-[11px] font-bold text-(--theme-elevation-700) cursor-pointer whitespace-nowrap"
                          >
                            {row.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                        ) : (
                          <span className="opacity-30">—</span>
                        )}
                      </td>
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
              disabled={!pagination.hasPrevPage || loadingSubmissions}
              className="px-3 py-1.5 rounded border border-(--theme-elevation-150) bg-transparent text-xs font-semibold text-(--theme-elevation-600) transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!pagination.hasNextPage || loadingSubmissions}
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
