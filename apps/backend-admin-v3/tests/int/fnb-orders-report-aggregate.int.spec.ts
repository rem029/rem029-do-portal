import { describe, expect, it } from 'vitest'
import type { Order } from '@/payload-types'
import {
  buildCompletionTime,
  buildEngagementFunnel,
  buildItemRanking,
  buildOrdersPerDay,
  buildPeakHours,
  buildRevenueBasket,
  buildStageTiming,
  buildStatusFunnel,
  dayKey,
  extractMenuPageSlug,
  getOrderRevenue,
  minutesBetween,
} from '@/globals/fnb-orders-report/components/aggregate'

describe('fnb-orders-report aggregate pure functions', () => {
  describe('utility helpers', () => {
    it('extracts menu page slug from various URL paths', () => {
      expect(extractMenuPageSlug('/fnb/menu/twiga')).toBe('twiga')
      expect(extractMenuPageSlug('/fnb/menu/twiga-page/')).toBe('twiga-page')
      expect(extractMenuPageSlug('/fnb/menu/cova?item=coffee-slug')).toBe('cova')
      expect(extractMenuPageSlug('/fnb/menu/planet-hollywood-page#desserts')).toBe(
        'planet-hollywood-page',
      )
      expect(extractMenuPageSlug('/other/url/path')).toBeNull()
      expect(extractMenuPageSlug('')).toBeNull()
    })

    it('computes minutes between ISO strings correctly', () => {
      const start = '2026-09-01T10:00:00.000Z'
      const end = '2026-09-01T10:25:30.000Z'
      expect(minutesBetween(start, end)).toBe(25.5)
      expect(minutesBetween(start, 'invalid')).toBe(0)
    })

    it('formats day key in Doha local time (UTC+3)', () => {
      // 23:30 UTC on the 5th is 02:30 on the 6th in Doha
      expect(dayKey('2026-09-05T23:30:00.000Z')).toBe('2026-09-06')
      // 10:00 UTC stays on the same calendar day in Doha (13:00)
      expect(dayKey('2026-09-05T10:00:00.000Z')).toBe('2026-09-05')
      expect(dayKey('invalid')).toBe('')
    })

    it('calculates order revenue respecting show_prices flag', () => {
      // Hand-built test fixture cast to Order per Unit C int-test spec
      const orderWithPrices = {
        show_prices: true,
        items: [
          { price_at_order: 50, quantity: 2 },
          { price_at_order: 30, quantity: 1 },
        ],
      } as unknown as Order
      expect(getOrderRevenue(orderWithPrices)).toBe(130)

      // Hand-built test fixture cast to Order per Unit C int-test spec
      const orderPricesHidden = {
        show_prices: false,
        items: [{ price_at_order: 50, quantity: 2 }],
      } as unknown as Order
      expect(getOrderRevenue(orderPricesHidden)).toBe(0)
    })
  })

  describe('buildCompletionTime', () => {
    it('computes mean, median, p90, and max with known set and excludes missing timestamps and cancelled orders', () => {
      // 5 completed orders with durations: 10, 20, 30, 40, 50 minutes
      const orders = [
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:10:00.000Z',
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:20:00.000Z',
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:30:00.000Z',
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:40:00.000Z',
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:50:00.000Z',
        } as unknown as Order,
        // Order missing completed_at: must be excluded from sampleSize
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: null,
        } as unknown as Order,
        // Cancelled order: must be excluded from completion times
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'cancelled',
          createdAt: '2026-09-01T10:00:00.000Z',
          completed_at: '2026-09-01T10:30:00.000Z',
        } as unknown as Order,
      ]

      const result = buildCompletionTime(orders)
      expect(result.sampleSize).toBe(5)
      expect(result.meanMinutes).toBe(30)
      expect(result.medianMinutes).toBe(30)
      expect(result.p90Minutes).toBe(46)
      expect(result.maxMinutes).toBe(50)
    })

    it('returns nulls when sample size is empty', () => {
      const result = buildCompletionTime([])
      expect(result).toEqual({
        sampleSize: 0,
        meanMinutes: null,
        medianMinutes: null,
        p90Minutes: null,
        maxMinutes: null,
      })
    })
  })

  describe('buildStageTiming', () => {
    it('calculates average minutes per stage and skips orders missing needed timestamps', () => {
      const orders = [
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z', // placed_to_confirmed: 5m
          preparing_at: '2026-09-01T10:15:00.000Z', // confirmed_to_preparing: 10m
          prepared_at: '2026-09-01T10:35:00.000Z', // preparing_to_prepared: 20m
          served_at: '2026-09-01T10:40:00.000Z', // prepared_to_served: 5m
          completed_at: '2026-09-01T10:50:00.000Z', // served_to_completed: 10m
        } as unknown as Order,
        // Order missing confirmed_at and preparing_at: skips those hops
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: null,
          preparing_at: null,
          prepared_at: '2026-09-01T10:20:00.000Z',
          served_at: '2026-09-01T10:30:00.000Z', // prepared_to_served: 10m
          completed_at: null,
        } as unknown as Order,
      ]

      const result = buildStageTiming(orders)
      expect(result.stages).toEqual([
        {
          key: 'placed_to_confirmed',
          label: 'Placed to Confirmed',
          sampleSize: 1,
          avgMinutes: 5,
        },
        {
          key: 'confirmed_to_preparing',
          label: 'Confirmed to Preparing',
          sampleSize: 1,
          avgMinutes: 10,
        },
        {
          key: 'preparing_to_prepared',
          label: 'Preparing to Prepared',
          sampleSize: 1,
          avgMinutes: 20,
        },
        {
          key: 'prepared_to_served',
          label: 'Prepared to Served',
          sampleSize: 2,
          avgMinutes: 7.5, // (5 + 10) / 2
        },
        {
          key: 'served_to_completed',
          label: 'Served to Completed',
          sampleSize: 1,
          avgMinutes: 10,
        },
      ])
    })
  })

  describe('buildStatusFunnel', () => {
    it('computes reached counts, cancellation rate, and cancelledAtStage buckets', () => {
      const orders = [
        // Completed order (reached all 6 stages)
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
          preparing_at: '2026-09-01T10:10:00.000Z',
          prepared_at: '2026-09-01T10:20:00.000Z',
          served_at: '2026-09-01T10:25:00.000Z',
          completed_at: '2026-09-01T10:30:00.000Z',
        } as unknown as Order,
        // Served order (reached pending, confirmed, preparing, prepared, served)
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'served',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
          preparing_at: '2026-09-01T10:10:00.000Z',
          prepared_at: '2026-09-01T10:20:00.000Z',
          served_at: '2026-09-01T10:25:00.000Z',
        } as unknown as Order,
        // Prepared order
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'prepared',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
          preparing_at: '2026-09-01T10:10:00.000Z',
          prepared_at: '2026-09-01T10:20:00.000Z',
        } as unknown as Order,
        // Preparing order
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'preparing',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
          preparing_at: '2026-09-01T10:10:00.000Z',
        } as unknown as Order,
        // Confirmed order
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'confirmed',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
        } as unknown as Order,
        // Pending order
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'pending',
          createdAt: '2026-09-01T10:00:00.000Z',
        } as unknown as Order,
        // Cancelled order 1: was confirmed before cancellation
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'cancelled',
          createdAt: '2026-09-01T10:00:00.000Z',
          confirmed_at: '2026-09-01T10:05:00.000Z',
          cancelled_at: '2026-09-01T10:06:00.000Z',
        } as unknown as Order,
        // Cancelled order 2: cancelled while still pending
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'cancelled',
          createdAt: '2026-09-01T10:00:00.000Z',
          cancelled_at: '2026-09-01T10:01:00.000Z',
        } as unknown as Order,
      ]

      const funnel = buildStatusFunnel(orders)
      expect(funnel.totalOrders).toBe(8)
      expect(funnel.cancelledCount).toBe(2)
      expect(funnel.cancellationRatePct).toBe(25) // 2 / 8 * 100

      expect(funnel.reached).toEqual([
        { status: 'pending', count: 8 },
        { status: 'confirmed', count: 6 }, // 5 pipeline >= confirmed + 1 cancelled with confirmed_at
        { status: 'preparing', count: 4 }, // completed, served, prepared, preparing
        { status: 'prepared', count: 3 }, // completed, served, prepared
        { status: 'served', count: 2 }, // completed, served
        { status: 'completed', count: 1 }, // completed
      ])

      expect(funnel.cancelledAtStage).toEqual([
        { stage: 'placed', count: 1 },
        { stage: 'confirmed', count: 1 },
      ])
    })
  })

  describe('buildItemRanking', () => {
    it('aggregates item units, orders containing, revenue, and pctOfUnits, and supports bottom toggle', () => {
      const orders = [
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          show_prices: true,
          items: [
            { item: { id: 'i1', title: 'Burger' }, quantity: 2, price_at_order: 50 },
            { item: { id: 'i2', title: 'Fries' }, quantity: 1, price_at_order: 20 },
          ],
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          show_prices: true,
          items: [
            { item: { id: 'i1', title: 'Burger' }, quantity: 1, price_at_order: 50 },
            { item: { id: 'i3', title: 'Drink' }, quantity: 1, price_at_order: 10 },
          ],
        } as unknown as Order,
      ]

      const topRanking = buildItemRanking(orders)
      expect(topRanking.totalUnits).toBe(5) // Burger: 3, Fries: 1, Drink: 1
      expect(topRanking.revenueAvailable).toBe(true)
      expect(topRanking.rows).toHaveLength(3)

      // Top order (descending by units): Burger should be first
      expect(topRanking.rows[0]).toEqual({
        itemId: 'i1',
        title: 'Burger',
        units: 3,
        ordersContaining: 2,
        revenue: 150,
        pctOfUnits: 60, // 3 / 5 * 100
      })

      // Bottom order (ascending by units)
      const bottomRanking = buildItemRanking(orders, { bottom: true })
      expect(bottomRanking.rows[0].units).toBe(1)
      expect(bottomRanking.rows[bottomRanking.rows.length - 1].itemId).toBe('i1')
    })
  })

  describe('buildPeakHours', () => {
    it('populates weekday x hour grid in Doha local time', () => {
      const orders = [
        // 2026-09-06 14:15 UTC = Sunday (day 0) 17:15 Doha
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-06T14:15:00.000Z',
        } as unknown as Order,
        // 2026-09-06 14:45 UTC = Sunday 17:45 Doha
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-06T14:45:00.000Z',
        } as unknown as Order,
        // 2026-09-07 09:00 UTC = Monday (day 1) 12:00 Doha
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-07T09:00:00.000Z',
        } as unknown as Order,
        // 2026-09-06 22:30 UTC = Monday (day 1) 01:30 Doha - crosses midnight
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-06T22:30:00.000Z',
        } as unknown as Order,
      ]

      const peak = buildPeakHours(orders)
      expect(peak.totalOrders).toBe(4)
      expect(peak.grid).toHaveLength(7)
      expect(peak.grid[0]).toHaveLength(24)
      expect(peak.grid[0][17]).toBe(2)
      expect(peak.grid[1][12]).toBe(1)
      expect(peak.grid[1][1]).toBe(1)
      expect(peak.maxCell).toBe(2)
    })
  })

  describe('buildRevenueBasket', () => {
    it('computes AOV, average items per order, and revenue by restaurant when priceDataComplete is true', () => {
      const restaurants = [
        { id: 'r1', title: 'Rest One' },
        { id: 'r2', title: 'Rest Two' },
      ]

      const orders = [
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          show_prices: true,
          restaurant: { id: 'r1', title: 'Rest One' },
          items: [{ quantity: 2, price_at_order: 50 }], // rev: 100, items: 2
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'completed',
          show_prices: true,
          restaurant: { id: 'r2', title: 'Rest Two' },
          items: [{ quantity: 1, price_at_order: 200 }], // rev: 200, items: 1
        } as unknown as Order,
        // Cancelled order: contributes to total items and total revenue, but not completed revenue or AOV
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          status: 'cancelled',
          show_prices: true,
          restaurant: { id: 'r1', title: 'Rest One' },
          items: [{ quantity: 1, price_at_order: 30 }], // rev: 30, items: 1
        } as unknown as Order,
      ]

      const basket = buildRevenueBasket(orders, true, restaurants)
      expect(basket.available).toBe(true)
      expect(basket.completedRevenue).toBe(300)
      expect(basket.totalRevenue).toBe(330)
      expect(basket.averageOrderValue).toBe(150) // 300 / 2 completed
      expect(basket.averageItemsPerOrder).toBe(1.3) // 4 total items / 3 orders = 1.333 -> 1.3
      expect(basket.byRestaurant).toEqual([
        { restaurantId: 'r1', title: 'Rest One', revenue: 100 },
        { restaurantId: 'r2', title: 'Rest Two', revenue: 200 },
      ])
    })

    it('returns available: false when priceDataComplete is false', () => {
      const basket = buildRevenueBasket([], false)
      expect(basket).toEqual({
        available: false,
        totalRevenue: 0,
        completedRevenue: 0,
        averageOrderValue: 0,
        averageItemsPerOrder: 0,
        byRestaurant: [],
      })
    })
  })

  describe('buildEngagementFunnel', () => {
    it('calculates step conversions and handles zero denominators cleanly', () => {
      const normal = buildEngagementFunnel({
        pageViews: 200,
        itemClicks: 50,
        ordersPlaced: 25,
        ordersCompleted: 20,
      })

      expect(normal.steps).toEqual([
        { from: 'Page views', to: 'Item clicks', conversionPct: 25 }, // 50 / 200 * 100
        { from: 'Item clicks', to: 'Orders placed', conversionPct: 50 }, // 25 / 50 * 100
        { from: 'Orders placed', to: 'Orders completed', conversionPct: 80 }, // 20 / 25 * 100
      ])

      const empty = buildEngagementFunnel({
        pageViews: 0,
        itemClicks: 0,
        ordersPlaced: 0,
        ordersCompleted: 0,
      })

      expect(empty.steps.every((s) => s.conversionPct === 0)).toBe(true)
    })
  })

  describe('buildOrdersPerDay', () => {
    it('generates points for each calendar day in date bounds', () => {
      const restaurants = [{ id: 'r1', title: 'Twiga' }]
      const orders = [
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-01T12:00:00.000Z',
          restaurant: { id: 'r1', title: 'Twiga' },
          show_prices: true,
          items: [{ quantity: 1, price_at_order: 100 }],
        } as unknown as Order,
        // Hand-built test fixture cast to Order per Unit C int-test spec
        {
          createdAt: '2026-09-03T15:00:00.000Z',
          restaurant: { id: 'r1', title: 'Twiga' },
          show_prices: true,
          items: [{ quantity: 2, price_at_order: 50 }],
        } as unknown as Order,
      ]

      const result = buildOrdersPerDay(
        orders,
        { from: '2026-09-01', to: '2026-09-03' },
        restaurants,
        true,
      )

      expect(result.revenueAvailable).toBe(true)
      expect(result.days).toHaveLength(3)

      expect(result.days[0].date).toBe('2026-09-01')
      expect(result.days[0].totalCount).toBe(1)
      expect(result.days[0].totalRevenue).toBe(100)
      expect(result.days[0].byRestaurant.r1).toEqual({ count: 1, revenue: 100 })

      expect(result.days[1].date).toBe('2026-09-02')
      expect(result.days[1].totalCount).toBe(0)
      expect(result.days[1].totalRevenue).toBe(0)
      expect(result.days[1].byRestaurant.r1).toEqual({ count: 0, revenue: 0 })

      expect(result.days[2].date).toBe('2026-09-03')
      expect(result.days[2].totalCount).toBe(1)
      expect(result.days[2].totalRevenue).toBe(100)
      expect(result.days[2].byRestaurant.r1).toEqual({ count: 1, revenue: 100 })
    })
  })
})
