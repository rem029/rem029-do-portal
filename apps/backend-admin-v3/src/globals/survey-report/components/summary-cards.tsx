'use client'

import React from 'react'
import type { SurveyReportSummary } from './types'
import { divideHairline, headingSerif, surface } from './ui'

export interface SummaryCardsProps {
  summary: SurveyReportSummary
  departmentFilterActive: boolean
}

const Metric: React.FC<{ label: string; value: string; children?: React.ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <div className="flex-1 min-w-0 px-6 py-5">
    <div className="text-[14px] text-(--theme-elevation-600) mb-2">{label}</div>
    <div
      className={`${headingSerif} text-[42px] leading-none tabular-nums text-(--theme-elevation-900)`}
    >
      {value}
    </div>
    {children}
  </div>
)

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  departmentFilterActive,
}) => (
  <div
    className={`${surface} mb-8 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x ${divideHairline}`}
  >
    <Metric
      label={departmentFilterActive ? 'Sent (all departments)' : 'Sent'}
      value={summary.sent.toLocaleString()}
    />
    <Metric label="Responded" value={summary.responded.toLocaleString()} />
    {summary.rate !== null && (
      <Metric label="Response rate" value={`${summary.rate}%`}>
        <div
          className="mt-3 h-1.5 rounded-full bg-(--admin-card) overflow-hidden"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-(--admin-color-accent) transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, summary.rate)}%` }}
          />
        </div>
      </Metric>
    )}
  </div>
)
