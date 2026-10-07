'use client'

import React from 'react'
import type { FnbCompletionTime } from '../types'
import { formatMinutes } from './formatters'
import { ReportCard } from './ReportCard'

interface CompletionTimeCardProps {
  data: FnbCompletionTime
}

export const CompletionTimeCard: React.FC<CompletionTimeCardProps> = ({ data }) => {
  return (
    <ReportCard
      title="How long orders take"
      caption="Time from a guest placing an order to staff marking it complete."
      empty={data.sampleSize === 0}
      emptyLabel="No completed orders in this range."
    >
      <div className="flex flex-col">
        <div>
          <div className="text-2xl font-semibold text-(--theme-elevation-900) tabular-nums leading-none">
            {formatMinutes(data.medianMinutes)}
          </div>
          <div className="text-[11px] text-(--theme-elevation-500) mt-1">
            a typical order — half are quicker, half take longer
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-(--theme-elevation-150) flex flex-col gap-1.5 text-xs text-(--theme-elevation-600)">
          <div className="flex items-center justify-between gap-2">
            <span>9 out of 10 orders done within</span>
            <strong className="text-(--theme-elevation-800) font-medium tabular-nums shrink-0">
              {formatMinutes(data.p90Minutes)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Longest an order took</span>
            <strong className="text-(--theme-elevation-800) font-medium tabular-nums shrink-0">
              {formatMinutes(data.maxMinutes)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Average of every order</span>
            <strong className="text-(--theme-elevation-800) font-medium tabular-nums shrink-0">
              {formatMinutes(data.meanMinutes)}
            </strong>
          </div>
        </div>

        <div className="mt-2.5 text-[11px] text-(--theme-elevation-400)">
          Based on {data.sampleSize} completed order{data.sampleSize === 1 ? '' : 's'}.
        </div>
      </div>
    </ReportCard>
  )
}
