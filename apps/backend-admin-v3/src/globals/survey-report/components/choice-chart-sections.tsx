'use client'

import React from 'react'
import { ChoiceChartCard } from './choice-chart-card'
import type { ChoiceQuestionStat } from './types'
import { emptyState, hairline, headingSerif } from './ui'

interface Section<T> {
  key: string
  label: string | null
  items: T[]
}

// Choices arrive in form order, so grouping consecutive runs keeps steps/groups in place.
function groupConsecutive<T>(items: T[], getLabel: (item: T) => string | null): Section<T>[] {
  const sections: Section<T>[] = []
  for (const item of items) {
    const label = getLabel(item)
    const last = sections[sections.length - 1]
    if (last && last.label === label) {
      last.items.push(item)
    } else {
      sections.push({ key: `${sections.length}-${label ?? ''}`, label, items: [item] })
    }
  }
  return sections
}

const CardList: React.FC<{ stats: ChoiceQuestionStat[] }> = ({ stats }) => (
  <div className="flex flex-col gap-4">
    {stats.map((stat) => (
      <ChoiceChartCard key={stat.path} stat={stat} />
    ))}
  </div>
)

const GroupSection: React.FC<{ label: string | null; stats: ChoiceQuestionStat[] }> = ({
  label,
  stats,
}) => {
  if (!label) return <CardList stats={stats} />
  return (
    <div className={`flex flex-col gap-3 pl-5 border-l ${hairline}`}>
      <h4 className={`m-0 mt-1 ${headingSerif} text-[22px] text-(--theme-elevation-800)`}>{label}</h4>
      <CardList stats={stats} />
    </div>
  )
}

const StepSection: React.FC<{ label: string | null; stats: ChoiceQuestionStat[] }> = ({
  label,
  stats,
}) => {
  const groups = groupConsecutive(stats, (s) => s.groupLabel)
  return (
    <section className="flex flex-col gap-4">
      {label && (
        <h3
          className={`m-0 pb-2 ${headingSerif} text-[28px] leading-tight text-(--admin-color-accent) border-b ${hairline}`}
        >
          {label}
        </h3>
      )}
      {groups.map((g) => (
        <GroupSection key={g.key} label={g.label} stats={g.items} />
      ))}
    </section>
  )
}

export const ChoiceChartsGrid: React.FC<{ choices: ChoiceQuestionStat[] }> = ({ choices }) => {
  if (choices.length === 0) {
    return (
      <div className={emptyState}>
        No choice questions in this survey.
      </div>
    )
  }

  const steps = groupConsecutive(choices, (s) => s.stepLabel)
  return (
    <div className="flex flex-col gap-10">
      {steps.map((step) => (
        <StepSection key={step.key} label={step.label} stats={step.items} />
      ))}
    </div>
  )
}
