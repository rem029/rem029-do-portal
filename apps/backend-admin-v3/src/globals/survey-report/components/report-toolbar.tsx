'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'
import { dohaDate, dohaStartOfMonth } from '@/globals/fnb-orders-report/components/reports/formatters'
import { RefreshIcon } from '@/globals/fnb-orders-report/components/reports/icons'
import { exportSurveyReportCsv } from './actions'
import type { SurveyReportContext, SurveyReportFilters } from './types'
import { control, focusRing, hairline, secondaryButton } from './ui'

export function getDatePresets() {
  return [
    { id: 'today', label: 'Today', from: dohaDate(0), to: dohaDate(0) },
    { id: '7d', label: '7 days', from: dohaDate(6), to: dohaDate(0) },
    { id: '30d', label: '30 days', from: dohaDate(29), to: dohaDate(0) },
    { id: 'month', label: 'This month', from: dohaStartOfMonth(), to: dohaDate(0) },
  ]
}

export interface SurveyReportToolbarProps {
  userId: string
  context: SurveyReportContext
  filters: SurveyReportFilters
  onChange: (next: Partial<SurveyReportFilters>) => void
  onRefresh: () => void
  disabled?: boolean
}

export const SurveyReportToolbar: React.FC<SurveyReportToolbarProps> = ({
  userId,
  context,
  filters,
  onChange,
  onRefresh,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false)

  const presets = getDatePresets()
  // A saved survey that is no longer available falls back to the context's pick
  const surveyValue = context.surveys.some((s) => s.id === filters.formId)
    ? filters.formId
    : (context.selectedFormId ?? '')

  const activePreset = (from: string, to: string) =>
    filters.from === from && filters.to === to

  const handleExportCsv = async () => {
    if (isExporting || !userId) return
    setIsExporting(true)
    try {
      const result = await exportSurveyReportCsv(userId, filters)
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', result.filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (!result.success) {
        toast.error(result.error || 'Failed to export survey report.')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred while exporting.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-3 items-center mb-6 pb-6 border-b ${hairline}`}>
      {/* Survey selector */}
      <select
        value={surveyValue}
        onChange={(e) => onChange({ formId: e.target.value })}
        aria-label="Filter by survey"
        disabled={context.surveys.length <= 1}
        className={`${control} cursor-pointer max-w-[260px] disabled:opacity-75 disabled:cursor-default`}
      >
        {context.surveys.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>

      {/* Hidden when blocked: a locked user with no usable department would see an arbitrary option */}
      {context.hasDepartmentField && !context.blockedReason && (
        <select
          value={context.departmentLocked ? (context.lockedDepartmentId || '') : (filters.departmentId || '')}
          onChange={(e) => onChange({ departmentId: e.target.value || null })}
          disabled={context.departmentLocked}
          aria-label="Filter by department"
          title={context.departmentLocked ? 'Department locked to your assigned department' : undefined}
          className={`${control} cursor-pointer max-w-[200px] disabled:opacity-75 disabled:cursor-not-allowed`}
        >
          {!context.departmentLocked && <option value="">All departments</option>}
          {context.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
              {!d.offered ? ' (not offered)' : ''}
            </option>
          ))}
        </select>
      )}

      {/* Date from / to */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.from || ''}
          max={filters.to || undefined}
          onChange={(e) => {
            if (e.target.value) {
              onChange({ from: e.target.value })
            }
          }}
          aria-label="From date"
          className={control}
        />
        <span className="text-[14px] text-(--theme-elevation-500)">to</span>
        <input
          type="date"
          value={filters.to || ''}
          min={filters.from || undefined}
          onChange={(e) => {
            if (e.target.value) {
              onChange({ to: e.target.value })
            }
          }}
          aria-label="To date"
          className={control}
        />
      </div>

      {/* Presets */}
      <div className={`flex items-center gap-0.5 p-0.5 flex-wrap rounded-md border ${hairline} bg-(--theme-elevation-0)`}>
        {presets.map((p) => {
          const active = activePreset(p.from, p.to)
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ from: p.from, to: p.to })}
              className={`h-[32px] px-3 text-[14px] rounded-[5px] border-0 cursor-pointer transition-colors ${focusRing} ${
                active
                  ? 'bg-(--admin-color-primary) text-(--admin-color-primary-content) font-normal!'
                  : 'bg-transparent hover:bg-(--admin-card) text-(--theme-elevation-700) font-light!'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Action buttons (Refresh & Export CSV) */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh report"
          aria-label="Refresh report"
          className={secondaryButton}
        >
          <RefreshIcon size={15} />
          Refresh
        </button>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={disabled || isExporting}
          title="Export to CSV"
          aria-label="Export to CSV"
          className={secondaryButton}
        >
          {isExporting ? (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d="M10 3v10M6 9l4 4 4-4M3 17h14" />
            </svg>
          )}
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </div>
  )
}
