import type { Order } from '@/payload-types'
import type {
  FnbCompletionTime,
  FnbEngagementFunnel,
  FnbItemRanking,
  FnbItemRankingRow,
  FnbOrdersPerDay,
  FnbOrdersPerDayPoint,
  FnbPeakHours,
  FnbReportFilters,
  FnbReportRestaurantOption,
  FnbRevenueBasket,
  FnbStageTiming,
  FnbStatusFunnel,
} from './types'

// ---------------------------------------------------------------------------
// Shared Math & Date Helpers (Pure)
// ---------------------------------------------------------------------------

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return sum(values) / values.length
}

export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0]
  if (p <= 0) return sorted[0]
  if (p >= 100) return sorted[sorted.length - 1]

  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function median(sorted: number[]): number | null {
  return percentile(sorted, 50)
}

export function minutesBetween(aIso: string, bIso: string): number {
  const start = new Date(aIso).getTime()
  const end = new Date(bIso).getTime()
  if (isNaN(start) || isNaN(end)) return 0
  return (end - start) / 60000
}

/**
 * Qatar has been a fixed UTC+3 with no DST since 1972, so a constant offset is
 * exact. All calendar-day and hour-of-day bucketing in the reports is done in
 * Doha local time - that is how an on-site F&B ops team reads "today" and the
 * "lunch rush". Elapsed-duration maths (minutesBetween) is unaffected.
 */
const QATAR_OFFSET_MS = 3 * 60 * 60 * 1000

/** The given instant shifted so its UTC getters read as Doha wall-clock time. */
function toQatarClock(iso: string): Date {
  return new Date(new Date(iso).getTime() + QATAR_OFFSET_MS)
}

export function dayKey(iso: string): string {
  const d = toQatarClock(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function weekday(iso: string): number {
  return toQatarClock(iso).getUTCDay()
}

export function hour(iso: string): number {
  return toQatarClock(iso).getUTCHours()
}

export function getOrderRevenue(order: Order): number {
  if (order.show_prices === false) return 0
  if (!order.items) return 0
  let rev = 0
  for (const item of order.items) {
    rev += (item.price_at_order ?? 0) * (item.quantity ?? 1)
  }
  return rev
}

export function extractMenuPageSlug(path: string): string | null {
  if (!path) return null
  const clean = path.split('?')[0].split('#')[0]
  const prefix = '/fnb/menu/'
  const idx = clean.indexOf(prefix)
  if (idx === -1) return null
  const after = clean.slice(idx + prefix.length)
  const segment = after.split('/')[0].trim()
  return segment || null
}

function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = []
  const start = new Date(`${startStr}T00:00:00.000Z`)
  const end = new Date(`${endStr}T00:00:00.000Z`)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return []
  }
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

// ---------------------------------------------------------------------------
// Report 1: Orders Per Day
// ---------------------------------------------------------------------------

export function buildOrdersPerDay(
  orders: Order[],
  filters: FnbReportFilters,
  restaurants: FnbReportRestaurantOption[],
  priceDataComplete?: boolean,
): FnbOrdersPerDay {
  const revenueAvailable =
    priceDataComplete !== undefined
      ? priceDataComplete
      : orders.length === 0 || orders.every((o) => o.show_prices !== false)

  let dates: string[] = []
  if (filters.from && filters.to) {
    dates = generateDateRange(filters.from, filters.to)
  } else if (filters.from) {
    const todayStr = dayKey(new Date().toISOString())
    dates = generateDateRange(filters.from, todayStr)
  } else if (filters.to) {
    const validOrderDates = orders.map((o) => dayKey(o.createdAt)).filter(Boolean)
    const minDate = validOrderDates.length > 0 ? [...validOrderDates].sort()[0] : filters.to
    dates = generateDateRange(minDate, filters.to)
  } else if (orders.length > 0) {
    const validOrderDates = orders.map((o) => dayKey(o.createdAt)).filter(Boolean)
    if (validOrderDates.length > 0) {
      const sortedDates = [...validOrderDates].sort()
      dates = generateDateRange(sortedDates[0], sortedDates[sortedDates.length - 1])
    }
  }

  const pointsMap = new Map<string, FnbOrdersPerDayPoint>()
  for (const date of dates) {
    const byRestaurant: Record<string, { count: number; revenue: number }> = {}
    for (const r of restaurants) {
      byRestaurant[r.id] = { count: 0, revenue: 0 }
    }
    pointsMap.set(date, {
      date,
      byRestaurant,
      totalCount: 0,
      totalRevenue: 0,
    })
  }

  for (const order of orders) {
    const dStr = dayKey(order.createdAt)
    if (!dStr) continue

    let point = pointsMap.get(dStr)
    if (!point) {
      const byRestaurant: Record<string, { count: number; revenue: number }> = {}
      for (const r of restaurants) {
        byRestaurant[r.id] = { count: 0, revenue: 0 }
      }
      point = {
        date: dStr,
        byRestaurant,
        totalCount: 0,
        totalRevenue: 0,
      }
      pointsMap.set(dStr, point)
    }

    const restId =
      typeof order.restaurant === 'object' && order.restaurant !== null
        ? order.restaurant.id
        : String(order.restaurant || '')

    if (restId) {
      if (!point.byRestaurant[restId]) {
        point.byRestaurant[restId] = { count: 0, revenue: 0 }
      }
      point.byRestaurant[restId].count++
      const rev = getOrderRevenue(order)
      point.byRestaurant[restId].revenue =
        Math.round((point.byRestaurant[restId].revenue + rev) * 100) / 100
      point.totalRevenue = Math.round((point.totalRevenue + rev) * 100) / 100
    }
    point.totalCount++
  }

  const days = Array.from(pointsMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  return {
    days,
    restaurants,
    revenueAvailable,
  }
}

// ---------------------------------------------------------------------------
// Report 2: Completion Time
// ---------------------------------------------------------------------------

export function buildCompletionTime(orders: Order[]): FnbCompletionTime {
  const diffs: number[] = []

  for (const order of orders) {
    if (order.status !== 'completed') continue
    if (!order.completed_at || !order.createdAt) continue
    const m = minutesBetween(order.createdAt, order.completed_at)
    if (m >= 0) {
      diffs.push(m)
    }
  }

  if (diffs.length === 0) {
    return {
      sampleSize: 0,
      meanMinutes: null,
      medianMinutes: null,
      p90Minutes: null,
      maxMinutes: null,
    }
  }

  diffs.sort((a, b) => a - b)
  const avg = mean(diffs)
  const med = median(diffs)
  const p90 = percentile(diffs, 90)
  const max = diffs[diffs.length - 1]

  return {
    sampleSize: diffs.length,
    meanMinutes: avg !== null ? Math.round(avg * 10) / 10 : null,
    medianMinutes: med !== null ? Math.round(med * 10) / 10 : null,
    p90Minutes: p90 !== null ? Math.round(p90 * 10) / 10 : null,
    maxMinutes: Math.round(max * 10) / 10,
  }
}

// ---------------------------------------------------------------------------
// Report 3: Stage Timing
// ---------------------------------------------------------------------------

export function buildStageTiming(orders: Order[]): FnbStageTiming {
  const stageDefs: {
    key:
      | 'placed_to_confirmed'
      | 'confirmed_to_preparing'
      | 'preparing_to_prepared'
      | 'prepared_to_served'
      | 'served_to_completed'
    label: string
    getTimestamps: (o: Order) => [string | null | undefined, string | null | undefined]
  }[] = [
    {
      key: 'placed_to_confirmed',
      label: 'Placed to Confirmed',
      getTimestamps: (o) => [o.createdAt, o.confirmed_at],
    },
    {
      key: 'confirmed_to_preparing',
      label: 'Confirmed to Preparing',
      getTimestamps: (o) => [o.confirmed_at, o.preparing_at],
    },
    {
      key: 'preparing_to_prepared',
      label: 'Preparing to Prepared',
      getTimestamps: (o) => [o.preparing_at, o.prepared_at],
    },
    {
      key: 'prepared_to_served',
      label: 'Prepared to Served',
      getTimestamps: (o) => [o.prepared_at, o.served_at],
    },
    {
      key: 'served_to_completed',
      label: 'Served to Completed',
      getTimestamps: (o) => [o.served_at, o.completed_at],
    },
  ]

  const stages = stageDefs.map((def) => {
    const diffs: number[] = []
    for (const order of orders) {
      const [start, end] = def.getTimestamps(order)
      if (!start || !end) continue
      const diff = minutesBetween(start, end)
      if (diff >= 0) {
        diffs.push(diff)
      }
    }

    const sampleSize = diffs.length
    const avg = mean(diffs)

    return {
      key: def.key,
      label: def.label,
      sampleSize,
      avgMinutes: avg !== null ? Math.round(avg * 10) / 10 : null,
    }
  })

  return { stages }
}

// ---------------------------------------------------------------------------
// Report 4: Status Funnel
// ---------------------------------------------------------------------------

const PIPELINE_STATUSES: Order['status'][] = [
  'pending',
  'confirmed',
  'preparing',
  'prepared',
  'served',
  'completed',
]

function orderReachedStatus(order: Order, targetStatus: Order['status']): boolean {
  if (targetStatus === 'pending') return true

  if (targetStatus === 'confirmed' && order.confirmed_at) return true
  if (targetStatus === 'preparing' && order.preparing_at) return true
  if (targetStatus === 'prepared' && order.prepared_at) return true
  if (targetStatus === 'served' && order.served_at) return true
  if (targetStatus === 'completed' && order.completed_at) return true

  if (order.status !== 'cancelled') {
    const currentIdx = PIPELINE_STATUSES.indexOf(order.status)
    const targetIdx = PIPELINE_STATUSES.indexOf(targetStatus)
    if (currentIdx !== -1 && targetIdx !== -1 && currentIdx >= targetIdx) {
      return true
    }
  }

  return false
}

function getCancelledAtStage(order: Order): string {
  if (order.completed_at) return 'completed'
  if (order.served_at) return 'served'
  if (order.prepared_at) return 'prepared'
  if (order.preparing_at) return 'preparing'
  if (order.confirmed_at) return 'confirmed'
  return 'placed'
}

export function buildStatusFunnel(orders: Order[]): FnbStatusFunnel {
  const reached = PIPELINE_STATUSES.map((status) => {
    const count = orders.filter((o) => orderReachedStatus(o, status)).length
    return { status, count }
  })

  const totalOrders = orders.length
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')
  const cancelledCount = cancelledOrders.length
  const cancellationRatePct =
    totalOrders === 0 ? 0 : Math.round((cancelledCount / totalOrders) * 1000) / 10

  const STAGE_ORDER = ['placed', 'confirmed', 'preparing', 'prepared', 'served', 'completed']
  const stageCounts = new Map<string, number>()
  for (const o of cancelledOrders) {
    const st = getCancelledAtStage(o)
    stageCounts.set(st, (stageCounts.get(st) || 0) + 1)
  }

  const cancelledAtStage = STAGE_ORDER.filter(
    (st) => (stageCounts.get(st) || 0) > 0,
  ).map((stage) => ({
    stage,
    count: stageCounts.get(stage)!,
  }))

  return {
    reached,
    totalOrders,
    cancelledCount,
    cancellationRatePct,
    cancelledAtStage,
  }
}

// ---------------------------------------------------------------------------
// Report 5: Item Ranking
// ---------------------------------------------------------------------------

export function buildItemRanking(
  orders: Order[],
  options?: { bottom?: boolean; priceDataComplete?: boolean },
): FnbItemRanking {
  const revenueAvailable =
    options?.priceDataComplete !== undefined
      ? options.priceDataComplete
      : orders.length === 0 || orders.every((o) => o.show_prices !== false)

  interface ItemAccumulator {
    itemId: string
    title: string
    units: number
    ordersContaining: number
    revenue: number
  }

  const itemMap = new Map<string, ItemAccumulator>()

  for (const order of orders) {
    if (!order.items) continue
    const seenInOrder = new Set<string>()

    for (const it of order.items) {
      const rawItem = it.item
      const itemId =
        typeof rawItem === 'object' && rawItem !== null ? rawItem.id : String(rawItem || '')
      if (!itemId) continue

      const title =
        typeof rawItem === 'object' && rawItem !== null && rawItem.title
          ? rawItem.title
          : itemId

      let existing = itemMap.get(itemId)
      if (!existing) {
        existing = {
          itemId,
          title,
          units: 0,
          ordersContaining: 0,
          revenue: 0,
        }
        itemMap.set(itemId, existing)
      }

      const qty = it.quantity ?? 1
      existing.units += qty

      if (order.show_prices !== false) {
        existing.revenue += (it.price_at_order ?? 0) * qty
      }

      if (!seenInOrder.has(itemId)) {
        seenInOrder.add(itemId)
        existing.ordersContaining++
      }
    }
  }

  const totalUnits = Array.from(itemMap.values()).reduce((acc, row) => acc + row.units, 0)

  const rows: FnbItemRankingRow[] = Array.from(itemMap.values()).map((acc) => ({
    itemId: acc.itemId,
    title: acc.title,
    units: acc.units,
    ordersContaining: acc.ordersContaining,
    revenue: Math.round(acc.revenue * 100) / 100,
    pctOfUnits: totalUnits > 0 ? Math.round((acc.units / totalUnits) * 1000) / 10 : 0,
  }))

  if (options?.bottom) {
    rows.sort(
      (a, b) =>
        a.units - b.units || a.revenue - b.revenue || a.title.localeCompare(b.title),
    )
  } else {
    rows.sort(
      (a, b) =>
        b.units - a.units || b.revenue - a.revenue || a.title.localeCompare(b.title),
    )
  }

  return {
    rows,
    totalUnits,
    revenueAvailable,
  }
}

// ---------------------------------------------------------------------------
// Report 6: Peak Hours
// ---------------------------------------------------------------------------

export function buildPeakHours(orders: Order[]): FnbPeakHours {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

  for (const order of orders) {
    if (!order.createdAt) continue
    if (isNaN(new Date(order.createdAt).getTime())) continue
    grid[weekday(order.createdAt)][hour(order.createdAt)]++
  }

  const maxCell = Math.max(0, ...grid.flat())
  return {
    grid,
    maxCell,
    totalOrders: orders.length,
  }
}

// ---------------------------------------------------------------------------
// Report 7: Revenue Basket
// ---------------------------------------------------------------------------

export function buildRevenueBasket(
  orders: Order[],
  priceDataComplete: boolean,
  restaurants: FnbReportRestaurantOption[] = [],
): FnbRevenueBasket {
  if (!priceDataComplete) {
    return {
      available: false,
      totalRevenue: 0,
      completedRevenue: 0,
      averageOrderValue: 0,
      averageItemsPerOrder: 0,
      byRestaurant: [],
    }
  }

  let totalRevenue = 0
  let completedRevenue = 0
  let totalUnits = 0
  const completedOrders = orders.filter((o) => o.status === 'completed')

  for (const order of orders) {
    const rev = getOrderRevenue(order)
    totalRevenue += rev
    if (order.status === 'completed') {
      completedRevenue += rev
    }
    for (const it of order.items || []) {
      totalUnits += it.quantity ?? 1
    }
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100
  completedRevenue = Math.round(completedRevenue * 100) / 100

  const averageOrderValue =
    completedOrders.length > 0
      ? Math.round((completedRevenue / completedOrders.length) * 100) / 100
      : 0

  const averageItemsPerOrder =
    orders.length > 0 ? Math.round((totalUnits / orders.length) * 10) / 10 : 0

  const restMap = new Map<string, { restaurantId: string; title: string; revenue: number }>()
  for (const r of restaurants) {
    restMap.set(r.id, { restaurantId: r.id, title: r.title, revenue: 0 })
  }

  for (const order of completedOrders) {
    const restId =
      typeof order.restaurant === 'object' && order.restaurant !== null
        ? order.restaurant.id
        : String(order.restaurant || '')
    if (!restId) continue

    let entry = restMap.get(restId)
    if (!entry) {
      const title =
        typeof order.restaurant === 'object' && order.restaurant !== null
          ? order.restaurant.title
          : restId
      entry = { restaurantId: restId, title: title || restId, revenue: 0 }
      restMap.set(restId, entry)
    }
    const rev = getOrderRevenue(order)
    entry.revenue = Math.round((entry.revenue + rev) * 100) / 100
  }

  const byRestaurant = Array.from(restMap.values())

  return {
    available: true,
    totalRevenue,
    completedRevenue,
    averageOrderValue,
    averageItemsPerOrder,
    byRestaurant,
  }
}

// ---------------------------------------------------------------------------
// Report 8: Engagement Funnel
// ---------------------------------------------------------------------------

export function buildEngagementFunnel({
  pageViews,
  itemClicks,
  ordersPlaced,
  ordersCompleted,
}: {
  pageViews: number
  itemClicks: number
  ordersPlaced: number
  ordersCompleted: number
}): FnbEngagementFunnel {
  const calcPct = (from: number, to: number): number => {
    if (from <= 0) return 0
    return Math.round((to / from) * 1000) / 10
  }

  return {
    pageViews,
    itemClicks,
    ordersPlaced,
    ordersCompleted,
    steps: [
      {
        from: 'Page views',
        to: 'Item clicks',
        conversionPct: calcPct(pageViews, itemClicks),
      },
      {
        from: 'Item clicks',
        to: 'Orders placed',
        conversionPct: calcPct(itemClicks, ordersPlaced),
      },
      {
        from: 'Orders placed',
        to: 'Orders completed',
        conversionPct: calcPct(ordersPlaced, ordersCompleted),
      },
    ],
  }
}
