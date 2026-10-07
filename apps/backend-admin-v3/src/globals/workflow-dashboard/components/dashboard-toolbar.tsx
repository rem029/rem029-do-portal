'use client'

import React from 'react'
import { useModal } from '@payloadcms/ui'
import { exportModalSlug } from './export-csv-modal'

export interface WorkflowDashboardToolbarProps {
  searchQuery: string
  status: string
  workflowVersion: 'v1' | 'v2' | 'all'
  formId: string
  startDate: string
  endDate: string
  forms: { id: string; title: string; slug: string }[]
  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onWorkflowVersionChange: (val: 'v1' | 'v2' | 'all') => void
  onFormChange: (val: string) => void
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onClearDates: () => void
}

const inputCls =
  'px-3 py-[7px] border border-(--theme-elevation-200) rounded-md text-[13px] bg-(--theme-elevation-0) text-(--theme-elevation-800) outline-none'
const selectCls =
  'px-2 py-[7px] border border-(--theme-elevation-200) rounded-md text-[13px] bg-(--theme-elevation-0) text-(--theme-elevation-800) outline-none cursor-pointer'

export const WorkflowDashboardToolbar: React.FC<WorkflowDashboardToolbarProps> = ({
  searchQuery,
  status,
  workflowVersion,
  formId,
  startDate,
  endDate,
  forms,
  onSearchChange,
  onStatusChange,
  onWorkflowVersionChange,
  onFormChange,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
}) => {
  const { openModal } = useModal()

  return (
    <div className="mb-5">
      <div className="text-xl font-bold text-(--theme-elevation-900) leading-tight mb-3">
        Workflow Submissions
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by submitter, ID…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${inputCls} w-[210px]`}
        />

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectCls}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={workflowVersion}
          onChange={(e) => onWorkflowVersionChange(e.target.value as 'v1' | 'v2' | 'all')}
          className={selectCls}
        >
          <option value="all">All Versions</option>
          <option value="v1">Workflow V1</option>
          <option value="v2">Workflow V2</option>
        </select>

        <select value={formId} onChange={(e) => onFormChange(e.target.value)} className={selectCls}>
          <option value="">All Forms</option>
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-(--theme-elevation-500) whitespace-nowrap">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-[10px] py-[6px] border border-(--theme-elevation-200) rounded-md text-xs bg-(--theme-elevation-0) text-(--theme-elevation-800) outline-none"
          />
          <span className="text-[11px] text-(--theme-elevation-500)">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-[10px] py-[6px] border border-(--theme-elevation-200) rounded-md text-xs bg-(--theme-elevation-0) text-(--theme-elevation-800) outline-none"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={onClearDates}
              title="Clear dates"
              className="bg-transparent border-none cursor-pointer text-(--theme-elevation-400) text-sm px-1 py-0.5 leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => openModal(exportModalSlug)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-(--theme-elevation-150) hover:bg-(--theme-elevation-200) text-(--theme-elevation-800) border border-(--theme-elevation-200) transition-colors cursor-pointer whitespace-nowrap"
        >
          📥 Export to CSV
        </button>
      </div>
    </div>
  )
}
