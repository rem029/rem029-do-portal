'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Gutter } from '@payloadcms/ui'
import { fetchFnbOrdersReport, fetchFnbReportContext, fetchFnbReportItems } from './actions'
import { FnbReportToolbar } from './report-toolbar'
import { CompletionTimeCard } from './reports/CompletionTimeCard'
import { EngagementFunnelCard } from './reports/EngagementFunnelCard'
import { dohaDate } from './reports/formatters'
import { RefreshIcon } from './reports/icons'
import { ItemRankingCard } from './reports/ItemRankingCard'
import { OrdersPerDayCard } from './reports/OrdersPerDayCard'
import { PeakHoursCard } from './reports/PeakHoursCard'
import { RevenueBasketCard } from './reports/RevenueBasketCard'
import { StageTimingCard } from './reports/StageTimingCard'
import { StatusFunnelCard } from './reports/StatusFunnelCard'
import type { FnbOrdersReportData, FnbReportContext, FnbReportFilters } from './types'

const notice =
  'p-4 rounded-md border border-(--theme-elevation-150) bg-(--theme-elevation-0) text-sm text-(--theme-elevation-700)'

export const FnbOrdersReportView: React.FC<{ reportType?: 'restaurant' | 'event' }> = ({
  reportType = 'restaurant',
}) => {
  const [context, setContext] = useState<FnbReportContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)

  const [filters, setFilters] = useState<FnbReportFilters>({
    restaurantId: '',
    itemId: '',
    from: dohaDate(6),
    to: dohaDate(0),
  })

  const [items, setItems] = useState<{ id: string; title: string }[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [data, setData] = useState<FnbOrdersReportData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<'forbidden' | 'no-restaurant' | 'failed' | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    setContextLoading(true)
    fetchFnbReportContext(reportType).then((res) => {
      if (!mounted) return
      setContext(res)
      setContextLoading(false)
      if (res.lockedRestaurantId) {
        setFilters((prev) => ({ ...prev, restaurantId: res.lockedRestaurantId ?? '' }))
      }
    })
    return () => {
      mounted = false
    }
  }, [reportType])

  useEffect(() => {
    if (!filters.restaurantId) {
      setItems([])
      setLoadingItems(false)
      return
    }
    let mounted = true
    setLoadingItems(true)
    fetchFnbReportItems(filters.restaurantId, reportType).then((res) => {
      if (!mounted) return
      setItems(res)
      setLoadingItems(false)
    })
    return () => {
      mounted = false
    }
  }, [filters.restaurantId, reportType])

  useEffect(() => {
    if (!context || context.mode === 'forbidden' || context.mode === 'none') return
    let mounted = true
    setUpdating(true)
    const timer = setTimeout(async () => {
      const res = await fetchFnbOrdersReport(filters, reportType)
      if (!mounted) return
      setUpdating(false)
      setInitialLoading(false)
      if (res.success) {
        setData(res.data)
        setError(null)
      } else {
        setError(res.error)
      }
    }, 250)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [context, filters, retryCount, reportType])

  const handleFilterChange = useCallback((next: Partial<FnbReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }))
  }, [])

  const isEvent = reportType === 'event'

  const scopeLabel = useMemo(() => {
    if (!context) return ''
    const fallbackAll = isEvent ? 'All events' : 'All restaurants'
    const fallbackEntity = isEvent ? 'Assigned event' : 'Assigned restaurant'
    const entityLabel = isEvent ? 'Event' : 'Restaurant'
    if (context.mode === 'locked') return context.restaurants[0]?.title || fallbackEntity
    if (filters.restaurantId) {
      return context.restaurants.find((r) => r.id === filters.restaurantId)?.title || entityLabel
    }
    return fallbackAll
  }, [context, filters.restaurantId, isEvent])

  const handlePrint = useCallback(() => {
    const printContent = reportRef.current?.innerHTML
    const printWindow = window.open('', '_blank')
    if (!printWindow || !printContent) return

    // The charts colour themselves from Payload's `--theme-*` custom properties.
    // Those don't exist in a bare popup, so the bars and heatmap render blank —
    // copy the resolved values across so the printout matches the screen.
    const cs = getComputedStyle(document.documentElement)
    const themeVars = [
      'elevation-0', 'elevation-50', 'elevation-100', 'elevation-150', 'elevation-200',
      'elevation-250', 'elevation-300', 'elevation-400', 'elevation-500', 'elevation-600',
      'elevation-700', 'elevation-800', 'elevation-900', 'elevation-1000',
      'success-500', 'error-500', 'error-700', 'warning-500', 'bg', 'text',
    ]
    const themeCss = themeVars
      .map((v) => {
        const value = cs.getPropertyValue(`--theme-${v}`).trim()
        return value ? `--theme-${v}: ${value};` : ''
      })
      .filter(Boolean)
      .join(' ')

    const reportTitle = isEvent ? 'FnB Event Orders Report' : 'FnB Orders Report'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            :root { color-scheme: light; ${themeCss} }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background: var(--theme-elevation-0); color: var(--theme-elevation-800); font-size: 12px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 landscape; margin: 14mm; }
            section { break-inside: avoid; }
          </style>
        </head>
        <body>
          <div style="max-width: 1100px; margin: 0 auto;">
            <div style="margin-bottom: 20px; border-bottom: 1px solid var(--theme-elevation-200); padding-bottom: 12px;">
              <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px;">${reportTitle}</h1>
              <p style="font-size: 12px; opacity: 0.6; margin: 0;">${scopeLabel} &middot; ${filters.from || 'All time'} to ${filters.to || 'today'}</p>
            </div>
            ${printContent}
          </div>
          <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [filters.from, filters.to, isEvent, scopeLabel])

  const generatedAt = (iso: string) => {
    try {
      return format(new Date(iso), 'h:mm a')
    } catch {
      return 'just now'
    }
  }

  return (
    <Gutter className="py-8">
      <div className="max-w-[1200px]">
        <p className="text-xs text-(--theme-elevation-500) mb-5">
          {isEvent
            ? 'Order activity and menu engagement for FnB Events.'
            : 'Order activity and menu engagement for the FnB Orders group.'}
        </p>

        {contextLoading ? (
          <div className={notice}>Loading…</div>
        ) : !context || context.mode === 'forbidden' ? (
          <div className={notice}>You don&apos;t have access to reporting.</div>
        ) : context.mode === 'none' ? (
          <div className={notice}>
            {isEvent
              ? 'No events assigned to your account. Ask an admin to assign you to an event.'
              : 'Ask an admin to assign you a restaurant to view reporting.'}
          </div>
        ) : (
          <div>
            <FnbReportToolbar
              context={context}
              filters={filters}
              items={items}
              loadingItems={loadingItems}
              onChange={handleFilterChange}
              onPrint={handlePrint}
              reportType={reportType}
            />

            {error === 'failed' && (
              <div className="mb-4 p-3 rounded-md border border-(--theme-error-500)/30 bg-(--theme-error-500)/8 text-(--theme-error-700) flex items-center justify-between gap-3">
                <span className="text-xs font-medium">Couldn&apos;t load the report.</span>
                <button
                  type="button"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xs text-xs font-medium bg-(--theme-elevation-0) border border-(--theme-elevation-200) text-(--theme-elevation-700) hover:bg-(--theme-elevation-100) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--theme-success-500)"
                >
                  <RefreshIcon />
                  Retry
                </button>
              </div>
            )}

            {initialLoading && !data ? (
              <div className="flex flex-col gap-3">
                <div className="h-40 rounded-md border border-(--theme-elevation-150) bg-(--theme-elevation-50) animate-pulse" />
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 rounded-md border border-(--theme-elevation-150) bg-(--theme-elevation-50) animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-44 rounded-md border border-(--theme-elevation-150) bg-(--theme-elevation-50) animate-pulse" />
              </div>
            ) : data ? (
              <>
                <div className="mb-4 text-xs text-(--theme-elevation-500)">
                  <strong className="text-(--theme-elevation-800) tabular-nums font-medium">
                    {data.meta.ordersInRange}
                  </strong>
                  {data.meta.priceMode !== 'all' &&
                    data.meta.ordersInRangeAllPrices !== data.meta.ordersInRange && (
                      <>
                        {' '}
                        of{' '}
                        <span className="tabular-nums">{data.meta.ordersInRangeAllPrices}</span>
                      </>
                    )}{' '}
                  order{data.meta.ordersInRange === 1 ? '' : 's'}
                  {data.meta.priceMode === 'priced' && ' · priced only'}
                  {data.meta.priceMode === 'event' && ' · event menus only'} · {scopeLabel} · as of{' '}
                  <span className="tabular-nums">{generatedAt(data.meta.generatedAt)}</span>
                </div>

                <div className="relative">
                  {updating && (
                    <div className="absolute -top-1 right-0 z-10 px-2 py-0.5 rounded-xs bg-(--theme-elevation-800) text-(--theme-elevation-0) text-[11px] font-medium shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
                      Updating…
                    </div>
                  )}
                  <div
                    ref={reportRef}
                    className={`flex flex-col gap-3 transition-opacity duration-200 ${
                      updating ? 'opacity-55' : ''
                    }`}
                  >
                    <OrdersPerDayCard data={data.ordersPerDay} hideRevenue={isEvent} />
                    <div className="grid gap-3 md:grid-cols-2 items-start">
                      <div className="flex flex-col gap-3">
                        <CompletionTimeCard data={data.completionTime} />
                        <StageTimingCard data={data.stageTiming} />
                        <StatusFunnelCard data={data.statusFunnel} />
                      </div>
                      <div className="flex flex-col gap-3">
                        <EngagementFunnelCard data={data.engagementFunnel} />
                        <ItemRankingCard data={data.itemRanking} hideRevenue={isEvent} />
                        {!isEvent && <RevenueBasketCard data={data.revenueBasket} />}
                      </div>
                    </div>
                    <PeakHoursCard data={data.peakHours} />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Gutter>
  )
}

export default FnbOrdersReportView
