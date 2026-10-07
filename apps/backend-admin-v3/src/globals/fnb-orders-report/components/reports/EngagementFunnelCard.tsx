'use client'

import React from 'react'
import type { FnbEngagementFunnel } from '../types'
import { ReportCard } from './ReportCard'

interface EngagementFunnelCardProps {
  data: FnbEngagementFunnel
}

export const EngagementFunnelCard: React.FC<EngagementFunnelCardProps> = ({ data }) => {
  const isAllZero =
    data.pageViews === 0 &&
    data.itemClicks === 0 &&
    data.ordersPlaced === 0 &&
    data.ordersCompleted === 0

  const base = data.pageViews > 0 ? data.pageViews : 1
  const stages = [
    { label: 'Page views', count: data.pageViews },
    { label: 'Item clicks', count: data.itemClicks },
    { label: 'Orders placed', count: data.ordersPlaced },
    { label: 'Orders completed', count: data.ordersCompleted },
  ]

  return (
    <ReportCard
      title="Menu Page Engagement"
      caption="From a menu view to a completed order."
      empty={isAllZero}
      emptyLabel="No engagement activity in this range."
    >
      <div className="flex flex-col gap-1">
        {stages.map((stage, idx) => {
          const widthPct = Math.min(100, Math.round((stage.count / base) * 100))
          const conv = idx > 0 ? data.steps[idx - 1]?.conversionPct : null

          return (
            <div key={stage.label}>
              {conv !== null && conv !== undefined && (
                <div className="ml-2 border-l border-(--theme-elevation-200) pl-2.5 py-1 text-[11px] text-(--theme-elevation-500)">
                  <span className="font-semibold text-(--theme-elevation-700) tabular-nums">
                    {conv}%
                  </span>{' '}
                  carry through
                </div>
              )}
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-(--theme-elevation-700)">{stage.label}</span>
                <span className="text-(--theme-elevation-900) font-semibold tabular-nums">
                  {stage.count.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-(--theme-elevation-100) rounded-xs overflow-hidden">
                <div
                  style={{ width: `${Math.max(stage.count > 0 ? 2 : 0, widthPct)}%` }}
                  className="h-full bg-(--theme-elevation-600)"
                />
              </div>
            </div>
          )
        })}
      </div>
    </ReportCard>
  )
}
