'use client'

import React from 'react'
import type { FnbStageTiming } from '../types'
import { formatMinutes, seriesColor } from './formatters'
import { ReportCard } from './ReportCard'

interface StageTimingCardProps {
  data: FnbStageTiming
}

export const StageTimingCard: React.FC<StageTimingCardProps> = ({ data }) => {
  const totalAvg = data.stages.reduce((sum, s) => sum + (s.avgMinutes ?? 0), 0)
  const hasData = data.stages.some((s) => (s.avgMinutes ?? 0) > 0)

  return (
    <ReportCard
      title="Stage Timing Breakdown"
      caption="Where the wait actually falls between each handoff."
      empty={!hasData}
      emptyLabel="No stage timing data in this range."
    >
      <div className="flex flex-col">
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-(--theme-elevation-150) gap-px">
          {data.stages.map((stage, idx) => {
            if (!stage.avgMinutes || stage.avgMinutes <= 0) return null
            return (
              <div
                key={stage.key}
                style={{
                  width: `${Math.max(2, (stage.avgMinutes / totalAvg) * 100)}%`,
                  background: seriesColor(idx),
                }}
                title={`${stage.label}: ${formatMinutes(stage.avgMinutes)}`}
                className="h-full"
              />
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5 mt-3.5">
          {data.stages.map((stage, idx) => (
            <div key={stage.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ background: seriesColor(idx) }}
                />
                <span className="text-(--theme-elevation-700) truncate">{stage.label}</span>
              </div>
              <div className="tabular-nums shrink-0 ml-2">
                {stage.avgMinutes !== null ? (
                  <>
                    <strong className="text-(--theme-elevation-800) font-semibold">
                      {formatMinutes(stage.avgMinutes)}
                    </strong>
                    <span className="text-(--theme-elevation-400) text-[11px] ml-1">
                      {stage.sampleSize} order{stage.sampleSize === 1 ? '' : 's'}
                    </span>
                  </>
                ) : (
                  <span className="text-(--theme-elevation-400)">no data</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ReportCard>
  )
}
