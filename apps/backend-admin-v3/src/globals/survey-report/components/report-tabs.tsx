'use client'

import React from 'react'
import { ChoiceChartsGrid } from './choice-chart-sections'
import { TextAnswersTable } from './text-answers-table'
import type { SurveyReportData } from './types'
import { focusRing, hairline } from './ui'

export type ReportTab = 'charts' | 'text'

interface ReportTabsProps {
  data: SurveyReportData
  hasDepartmentField: boolean
  activeTab: ReportTab
  onTabChange: (tab: ReportTab) => void
}

const tabClass = (active: boolean) =>
  `tab -mb-px px-1 py-3 mr-7 text-[16px] cursor-pointer bg-transparent rounded-none border-0 border-b-2 border-solid transition-colors ${focusRing} ${
    active
      ? 'tab-active border-(--admin-color-accent) text-(--admin-color-accent) font-normal!'
      : 'border-transparent text-(--theme-elevation-600) font-light! hover:text-(--theme-elevation-900)'
  }`

export const ReportTabs: React.FC<ReportTabsProps> = ({
  data,
  hasDepartmentField,
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'charts', label: 'Charts' },
    { id: 'text', label: `Text answers (${data.textRows.length})` },
  ]

  return (
    <>
      <div role="tablist" className={`tabs tabs-border flex border-b ${hairline} mb-6`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
            className={tabClass(activeTab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'charts' ? (
        <ChoiceChartsGrid choices={data.choices} />
      ) : (
        <TextAnswersTable
          rows={data.textRows}
          questions={data.questions}
          hasDepartmentField={hasDepartmentField}
        />
      )}
    </>
  )
}
