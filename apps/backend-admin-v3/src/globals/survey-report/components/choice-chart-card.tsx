'use client'

import React from 'react'
import { ReportCard } from '@/globals/fnb-orders-report/components/reports/ReportCard'
import type { ChoiceQuestionStat } from './types'

export interface ChoiceChartCardProps {
  stat: ChoiceQuestionStat
}

export const ChoiceChartCard: React.FC<ChoiceChartCardProps> = ({ stat }) => {
  // Repeated and multi-select questions can give several answers per response
  const caption =
    stat.isRepeated || stat.answerCount > stat.answered
      ? `${stat.answerCount} answers from ${stat.answered} responses`
    : `${stat.answered} answered / ${stat.responses} responses`

  const allCounts = [
    ...stat.options.map((o) => o.count),
    ...(stat.other > 0 ? [stat.other] : []),
  ]
  const maxCount = Math.max(...allCounts, 1)

  const otherPercent =
    stat.answerCount > 0 ? Math.round((stat.other / stat.answerCount) * 1000) / 10 : 0
  const otherWidthPct = stat.other > 0 ? (stat.other / maxCount) * 100 : 0

  return (
    <ReportCard
      title={stat.fieldLabel || stat.label}
      className="rounded-lg! p-5! border-[color-mix(in_srgb,var(--admin-color-secondary)_35%,var(--theme-elevation-100))]!"
      titleClassName="text-[18px] font-light leading-snug!"
      captionClassName="text-[14px] text-(--theme-elevation-600) mt-1.5!"
      caption={caption}
      headerRight={
        stat.average !== null ? (
          <span className="inline-flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-(--admin-card) text-(--theme-elevation-800) text-[14px] tabular-nums">
            Avg
            <span className="font-(family-name:--admin-font-secondary) text-[18px] leading-none text-(--admin-color-accent)">
              {stat.average.toFixed(1)}
            </span>
          </span>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 mt-1">
        {stat.options.map((opt) => {
          const isMuted = opt.count === 0
          const widthPct = opt.count > 0 ? (opt.count / maxCount) * 100 : 0

          return (
            <div key={opt.value} className="flex flex-col gap-1.5 text-[15px]">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`break-words leading-snug ${
                    isMuted ? 'text-(--theme-elevation-500)' : 'text-(--theme-elevation-800) font-light'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="shrink-0 tabular-nums text-right">
                  <span
                    className={`font-medium ${
                      isMuted ? 'text-(--theme-elevation-500)' : 'text-(--theme-elevation-900)'
                    }`}
                  >
                    {opt.count}
                  </span>
                  <span
                    className={`ml-1.5 text-[13px] ${
                      isMuted ? 'text-(--theme-elevation-500)' : 'text-(--theme-elevation-600)'
                    }`}
                  >
                    ({opt.percent}%)
                  </span>
                </span>
              </div>
              <div className="h-2.5 w-full bg-(--admin-card) rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(opt.count > 0 ? 2 : 0, widthPct)}%` }}
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                    isMuted ? 'bg-transparent' : 'bg-(--admin-color-accent)'
                  }`}
                />
              </div>
            </div>
          )
        })}

        {stat.other > 0 && (
          <div className="flex flex-col gap-1.5 text-[15px]">
            <div className="flex items-start justify-between gap-2">
              <span className="break-words leading-snug text-(--theme-elevation-800) font-light italic">
                Other
              </span>
              <span className="shrink-0 tabular-nums text-right">
                <span className="font-medium text-(--theme-elevation-900)">{stat.other}</span>
                <span className="ml-1.5 text-[13px] text-(--theme-elevation-600)">
                  ({otherPercent}%)
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-(--admin-card) rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(2, otherWidthPct)}%` }}
                className="h-full rounded-full bg-(--admin-color-secondary) transition-[width] duration-500 ease-out"
              />
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  )
}
