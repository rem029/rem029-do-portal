'use client'

import React from 'react'
import type { FnbPeakHours } from '../types'
import { heatFill } from './formatters'
import { ReportCard } from './ReportCard'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SPARSE_HOURS = [0, 6, 12, 18]

interface PeakHoursCardProps {
  data: FnbPeakHours
}

export const PeakHoursCard: React.FC<PeakHoursCardProps> = ({ data }) => {
  const isEmpty = data.maxCell === 0 || data.totalOrders === 0

  return (
    <ReportCard
      title="Peak Hours"
      caption="Busiest times of the week (Doha time)."
      empty={isEmpty}
      emptyLabel="No orders in this range."
    >
      <div className="overflow-x-auto">
        <div className="min-w-[460px] flex flex-col gap-0.5 select-none">
          <div className="grid grid-cols-[32px_repeat(24,1fr)] gap-0.5 text-[10px] text-(--theme-elevation-400) tabular-nums">
            <span />
            {Array.from({ length: 24 }).map((_, h) => (
              <span key={h} className="text-center">
                {SPARSE_HOURS.includes(h) ? h : ''}
              </span>
            ))}
          </div>

          {WEEKDAYS.map((dayName, dayIdx) => (
            <div key={dayName} className="grid grid-cols-[32px_repeat(24,1fr)] gap-0.5 items-center">
              <span className="text-[11px] text-(--theme-elevation-500)">{dayName}</span>
              {Array.from({ length: 24 }).map((_, h) => {
                const count = data.grid[dayIdx]?.[h] ?? 0
                return (
                  <div
                    key={h}
                    title={`${dayName} ${String(h).padStart(2, '0')}:00 — ${count} order${count === 1 ? '' : 's'}`}
                    style={{
                      background:
                        count > 0 ? heatFill(count / data.maxCell) : 'var(--theme-elevation-100)',
                    }}
                    className="h-5 rounded-xs"
                  />
                )
              })}
            </div>
          ))}

          <div className="flex items-center justify-end gap-1.5 text-[10px] text-(--theme-elevation-400) mt-2 pt-2 border-t border-(--theme-elevation-150)">
            <span>Fewer</span>
            {[0.08, 0.35, 0.7, 1].map((v) => (
              <span
                key={v}
                className="w-3 h-3 rounded-xs"
                style={{ background: heatFill(v) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </ReportCard>
  )
}
