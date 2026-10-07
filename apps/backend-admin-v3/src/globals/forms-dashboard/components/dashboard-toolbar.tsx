'use client'

import React from 'react'
import { useModal } from '@payloadcms/ui'
import { FormOption, SubmissionStatusFilter } from './actions'
import { exportModalSlug } from './export-csv-modal'

export interface DashboardToolbarProps {
  selectedForm: FormOption | undefined
  loadingForms: boolean
  searchQuery: string
  startDate: string
  endDate: string
  statusFilter: SubmissionStatusFilter
  onOpenSidebar: () => void
  onSearchChange: (val: string) => void
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onStatusFilterChange: (val: SubmissionStatusFilter) => void
  onClearDates: () => void
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  selectedForm,
  loadingForms,
  searchQuery,
  startDate,
  endDate,
  statusFilter,
  onOpenSidebar,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onStatusFilterChange,
  onClearDates,
}) => {
  const { openModal } = useModal()

  return (
    <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
      {/* Left: Form title + switch action */}
      <div className="flex flex-col gap-1">
        <div className="text-xl font-bold text-(--theme-elevation-900) leading-tight">
          {loadingForms ? '…' : selectedForm?.label || 'No form selected'}
        </div>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="bg-transparent border-none p-0 cursor-pointer text-xs text-(--theme-elevation-500) underline underline-offset-2 text-left w-fit"
        >
          {selectedForm ? 'Switch form ↓' : 'Select a form ↓'}
        </button>
      </div>

      {/* Right: Search + Date range + Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search submissions…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-[7px] border border-(--theme-elevation-200) rounded-md text-[13px] bg-(--theme-elevation-0) text-(--theme-elevation-800) w-[200px] outline-none pr-7"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Clear search"
              className="absolute right-2 bg-transparent border-none cursor-pointer text-(--theme-elevation-400) hover:text-(--theme-elevation-700) text-sm leading-none p-0"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as SubmissionStatusFilter)}
          title="Filter by archive status"
          className="px-[10px] py-[6px] border border-(--theme-elevation-200) rounded-md text-xs bg-(--theme-elevation-0) text-(--theme-elevation-800) outline-none cursor-pointer"
        >
          <option value="active">Active submissions</option>
          <option value="archived">Archived submissions</option>
          <option value="all">All submissions</option>
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
              title="Clear date range"
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
