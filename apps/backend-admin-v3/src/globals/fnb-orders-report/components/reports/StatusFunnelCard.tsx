'use client'

import React from 'react'
import type { FnbStatusFunnel } from '../types'
import { ReportCard } from './ReportCard'

const STATUS_NAMES: Record<string, string> = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  prepared: 'Prepared',
  served: 'Served',
  completed: 'Completed',
}

interface StatusFunnelCardProps {
  data: FnbStatusFunnel
}

export const StatusFunnelCard: React.FC<StatusFunnelCardProps> = ({ data }) => {
  const baseCount = data.reached[0]?.count || data.totalOrders || 1

  return (
    <ReportCard
      title="Status Funnel & Cancellations"
      caption="How far orders get, and where they fall out."
      empty={data.totalOrders === 0}
      emptyLabel="No orders in this range."
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-1.5">
          {data.reached.map((step) => {
            const pct = Math.round((step.count / baseCount) * 100)
            return (
              <div key={step.status} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-(--theme-elevation-600)">
                  {STATUS_NAMES[step.status] || step.status}
                </span>
                <div className="flex-1 h-2 bg-(--theme-elevation-100) rounded-xs overflow-hidden">
                  <div
                    style={{ width: `${Math.max(step.count > 0 ? 2 : 0, pct)}%` }}
                    className="h-full bg-(--theme-elevation-600)"
                  />
                </div>
                <span className="w-14 shrink-0 text-right tabular-nums text-(--theme-elevation-800) font-medium">
                  {step.count}
                  <span className="text-(--theme-elevation-400) font-normal ml-1">{pct}%</span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-(--theme-elevation-150)">
          <div className="flex items-center justify-between text-xs">
            <span className="text-(--theme-elevation-700)">
              Cancelled{' '}
              <strong className="text-(--theme-error-500) tabular-nums">{data.cancelledCount}</strong>
            </span>
            <span className="text-(--theme-elevation-600) tabular-nums">
              {data.cancellationRatePct}% of orders
            </span>
          </div>

          {data.cancelledAtStage.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-(--theme-elevation-500)">
              {data.cancelledAtStage.map((s) => (
                <span
                  key={s.stage}
                  className="bg-(--theme-elevation-100) text-(--theme-elevation-600) px-1.5 py-0.5 rounded-xs tabular-nums"
                >
                  {s.stage} &middot; {s.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ReportCard>
  )
}
