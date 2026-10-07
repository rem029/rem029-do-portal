import type { Order } from '@/payload-types'

export type FnbReportMode = 'all' | 'locked' | 'none' | 'forbidden'

export interface FnbReportRestaurantOption {
  id: string
  title: string
}

export interface FnbReportContext {
  mode: FnbReportMode
  restaurants: FnbReportRestaurantOption[]
  lockedRestaurantId: string | null
}

/**
 * Which slice of orders every widget in the report is built from:
 * - 'all'    — no price filter
 * - 'priced' — only orders whose menu showed prices (revenue is exact)
 * - 'event'  — only orders whose menu hid prices (event menus; no revenue)
 */
export type FnbPriceMode = 'all' | 'priced' | 'event'

export interface FnbReportFilters {
  restaurantId?: string // '' or undefined = all allowed
  itemId?: string
  from?: string // 'YYYY-MM-DD' inclusive, undefined = no lower bound
  to?: string // 'YYYY-MM-DD' inclusive (expanded to end-of-day), undefined = now
  priceMode?: FnbPriceMode // undefined = 'all'
}

export interface FnbOrdersPerDayPoint {
  date: string
  byRestaurant: Record<string, { count: number; revenue: number }>
  totalCount: number
  totalRevenue: number
}

export interface FnbOrdersPerDay {
  days: FnbOrdersPerDayPoint[]
  restaurants: FnbReportRestaurantOption[]
  revenueAvailable: boolean
}

export interface FnbCompletionTime {
  sampleSize: number
  meanMinutes: number | null
  medianMinutes: number | null
  p90Minutes: number | null
  maxMinutes: number | null
}

export interface FnbStageTiming {
  stages: {
    key:
      | 'placed_to_confirmed'
      | 'confirmed_to_preparing'
      | 'preparing_to_prepared'
      | 'prepared_to_served'
      | 'served_to_completed'
    label: string
    sampleSize: number
    avgMinutes: number | null
  }[]
}

export interface FnbStatusFunnel {
  reached: { status: Order['status']; count: number }[] // orders that reached each pipeline status (exclude 'cancelled' from the pipeline row)
  totalOrders: number
  cancelledCount: number
  cancellationRatePct: number
  cancelledAtStage: { stage: string; count: number }[] // last status before cancel, inferred from which *_at timestamps are set
}

export interface FnbItemRankingRow {
  itemId: string
  title: string
  units: number
  ordersContaining: number
  revenue: number
  pctOfUnits: number
}

export interface FnbItemRanking {
  rows: FnbItemRankingRow[]
  totalUnits: number
  revenueAvailable: boolean
}

export interface FnbPeakHours {
  grid: number[][] /* [weekday 0-6 Sun..Sat][hour 0-23] = count */
  maxCell: number
  totalOrders: number
}

export interface FnbRevenueBasket {
  available: boolean // false when priceDataComplete is false
  totalRevenue: number
  completedRevenue: number
  averageOrderValue: number
  averageItemsPerOrder: number
  byRestaurant: { restaurantId: string; title: string; revenue: number }[]
}

export interface FnbEngagementFunnel {
  pageViews: number
  itemClicks: number
  ordersPlaced: number
  ordersCompleted: number
  steps: { from: string; to: string; conversionPct: number }[]
}

export interface FnbOrdersReportData {
  ordersPerDay: FnbOrdersPerDay
  completionTime: FnbCompletionTime
  stageTiming: FnbStageTiming
  statusFunnel: FnbStatusFunnel
  itemRanking: FnbItemRanking
  peakHours: FnbPeakHours
  revenueBasket: FnbRevenueBasket
  engagementFunnel: FnbEngagementFunnel
  meta: {
    priceDataComplete: boolean
    priceMode: FnbPriceMode
    restaurantMode: FnbReportMode
    appliedFilters: FnbReportFilters
    resolvedRestaurantIds: string[]
    ordersInRange: number // orders after the price-mode filter (what the widgets use)
    ordersInRangeAllPrices: number // orders before the price-mode filter
    generatedAt: string
  }
}

export type FnbOrdersReportResult =
  | { success: true; data: FnbOrdersReportData }
  | { success: false; error: 'forbidden' | 'no-restaurant' | 'failed' }

