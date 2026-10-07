'use client'

import React, { useMemo, useState } from 'react'
import type { FnbOrdersPerDay } from '../types'
import { formatQar } from './formatters'
import { ReportCard } from './ReportCard'
import { Segmented } from './Segmented'

interface OrdersPerDayCardProps {
  data: FnbOrdersPerDay
  hideRevenue?: boolean
}

const OTHER_ID = '__other__'
const MAX_SERIES = 5 // + "Other" = 6

// Distinct per-restaurant hues (requested), evenly spaced around the wheel and
// mid-toned so each stays legible on the admin's light and dark card grounds.
// "Other" is kept neutral so it reads as the catch-all, not a named venue.
const RESTAURANT_COLORS = [
  'rgb(59, 130, 246)', // blue
  'rgb(245, 158, 11)', // amber
  'rgb(16, 185, 129)', // emerald
  'rgb(139, 92, 246)', // violet
  'rgb(236, 72, 153)', // pink
]
const OTHER_COLOR = 'var(--theme-elevation-400)'

const seriesColor = (id: string, i: number): string =>
  id === OTHER_ID ? OTHER_COLOR : RESTAURANT_COLORS[i % RESTAURANT_COLORS.length]

export const OrdersPerDayCard: React.FC<OrdersPerDayCardProps> = ({ data, hideRevenue }) => {
  const [metric, setMetric] = useState<'count' | 'revenue'>('count')
  const activeMetric = hideRevenue ? 'count' : metric
  const val = (v: { count: number; revenue: number } | undefined) =>
    !v ? 0 : activeMetric === 'revenue' ? v.revenue : v.count

  // Collapse a long restaurant list to the busiest few + a rolled-up "Other",
  // so "All restaurants" for a super user stays readable rather than a 20-way stack.
  const series = useMemo(() => {
    if (data.restaurants.length <= 1) return data.restaurants
    const totals = data.restaurants.map((r) => ({
      r,
      total: data.days.reduce((s, d) => s + (d.byRestaurant[r.id]?.count ?? 0), 0),
    }))
    totals.sort((a, b) => b.total - a.total)
    const kept = totals.slice(0, MAX_SERIES).map((t) => t.r)
    if (totals.length > MAX_SERIES) kept.push({ id: OTHER_ID, title: 'Other' })
    return kept
  }, [data])

  const isStacked = series.length > 1
  const keptIds = new Set(series.map((s) => s.id).filter((id) => id !== OTHER_ID))

  const dayValue = (day: FnbOrdersPerDay['days'][number]) =>
    activeMetric === 'revenue' ? day.totalRevenue : day.totalCount

  const max = Math.max(1, ...data.days.map(dayValue))
  const isAllZero = data.days.length === 0 || data.days.every((d) => dayValue(d) === 0)

  const segValue = (day: FnbOrdersPerDay['days'][number], id: string) =>
    id === OTHER_ID
      ? Object.entries(day.byRestaurant).reduce(
          (s, [rid, v]) => (keptIds.has(rid) ? s : s + val(v)),
          0,
        )
      : val(day.byRestaurant[id])

  const showLabel = (idx: number) => {
    const total = data.days.length
    if (total <= 14) return true
    const step = Math.ceil(total / 10)
    return idx % step === 0 || idx === total - 1
  }

  return (
    <ReportCard
      title="Orders Per Day"
      caption="How busy each day was, by restaurant."
      empty={isAllZero}
      emptyLabel="No orders in this range."
      headerRight={
        !hideRevenue ? (
          <Segmented
            ariaLabel="Chart metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'count', label: 'Count' },
              {
                value: 'revenue',
                label: 'Revenue',
                disabled: !data.revenueAvailable,
                title: data.revenueAvailable
                  ? undefined
                  : 'Set the pricing filter to “Priced” to chart revenue',
              },
            ]}
          />
        ) : undefined
      }
    >
      <div className="flex flex-col">
        <div className="flex items-end gap-0.5 sm:gap-1 h-32 pt-3 border-b border-(--theme-elevation-150)">
          {data.days.map((day) => {
            const dayVal = dayValue(day)
            const heightPct = (dayVal / max) * 100
            const tip = [
              `${day.date}  ${activeMetric === 'revenue' ? formatQar(day.totalRevenue) : `${day.totalCount} order${day.totalCount === 1 ? '' : 's'}`}`,
              ...(isStacked
                ? series.map((s) => {
                    const v = segValue(day, s.id)
                    return `  ${s.title}: ${activeMetric === 'revenue' ? formatQar(v) : v}`
                  })
                : []),
            ].join('\n')

            return (
              <div
                key={day.date}
                title={tip}
                className="flex-1 min-w-[6px] h-full flex flex-col justify-end items-center"
              >
                {dayVal > 0 ? (
                  <div
                    style={{ height: `${Math.max(3, heightPct)}%` }}
                    className="w-full max-w-[34px] flex flex-col justify-end overflow-hidden rounded-t-xs"
                  >
                    {isStacked ? (
                      series.map((s, i) => {
                        const v = segValue(day, s.id)
                        if (v <= 0) return null
                        return (
                          <div
                            key={s.id}
                            style={{
                              height: `${(v / dayVal) * 100}%`,
                              background: seriesColor(s.id, i),
                            }}
                            className="w-full"
                          />
                        )
                      })
                    ) : (
                      <div className="w-full h-full" style={{ background: RESTAURANT_COLORS[0] }} />
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-[34px] h-px bg-(--theme-elevation-200)" />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0.5 sm:gap-1 pt-1.5">
          {data.days.map((day, idx) => (
            <div
              key={day.date}
              className="flex-1 min-w-[6px] text-center text-[10px] text-(--theme-elevation-400) tabular-nums truncate"
            >
              {showLabel(idx) ? day.date.slice(5) : ''}
            </div>
          ))}
        </div>

        {isStacked && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-2.5 border-t border-(--theme-elevation-150)">
            {series.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs text-(--theme-elevation-600)">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ background: seriesColor(s.id, i) }}
                />
                <span>{s.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ReportCard>
  )
}
