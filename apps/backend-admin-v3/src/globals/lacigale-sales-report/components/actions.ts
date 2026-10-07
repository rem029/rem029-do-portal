'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function fetchLacigaleSalesStats() {
  try {
    const payload = await getPayload({ config })

    const now = new Date()
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))

    // Yesterday Logic
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const endOfYesterday = new Date(startOfToday)
    endOfYesterday.setMilliseconds(-1)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const result = await payload.find({
      collection: 'lacigale-sales',
      where: {
        date: { greater_than_equal: startOfYear.toISOString() },
      },
      limit: 1000,
      sort: '-date',
      overrideAccess: true,
    })

    const docs = result.docs

    const getVal = (doc: any, path: string) =>
      path.split('.').reduce((obj, key) => obj?.[key], doc) || 0

    // Enhanced helper to handle specific date ranges
    const sumFieldRange = (data: any[], path: string, start: Date, end?: Date) =>
      data
        .filter((d) => {
          const dDate = new Date(d.date)
          return end ? dDate >= start && dDate <= end : dDate >= start
        })
        .reduce((acc, d) => acc + (Number(getVal(d, path)) || 0), 0)

    const getOccupancyValue = (data: any[], start: Date, view: 'today' | 'period', end?: Date) => {
      const filtered = data.filter((d) => {
        const dDate = new Date(d.date)
        return end ? dDate >= start && dDate <= end : dDate >= start
      })
      if (filtered.length === 0) return 0

      if (view === 'today') {
        return Number(getVal(filtered[0], 'rooms.occupancy_percentage')) || 0
      }

      const total = filtered.reduce(
        (acc, d) => acc + (Number(getVal(d, 'rooms.occupancy_percentage')) || 0),
        0,
      )
      return Number((total / filtered.length).toFixed(2))
    }

    const FB_KEYS = [
      'sky_view',
      'shisha_garden',
      'sushi_bar',
      'traiteur',
      'odc_special_contracts',
      'di_capri',
      'le_cigalon',
      'lobby_lounge',
      'mini_bar',
      'orangery',
      'room_service',
      'banquets',
      'ramadan_tent',
    ]

    const MISC_KEYS = [
      'telephone',
      'business_center',
      'laundry',
      'spa_and_recreation',
      'hotel_taxi',
      'cigar_shop',
      'space_rental',
      'flower_shop',
      'other_misc',
    ]

    // Map F&B Data with Revenue AND Guests
    const fbData = FB_KEYS.map((key) => ({
      label: key,
      revenue: {
        today: sumFieldRange(docs, `fb_sales.${key}`, startOfToday),
        yesterday: sumFieldRange(docs, `fb_sales.${key}`, startOfYesterday, endOfYesterday),
        month: sumFieldRange(docs, `fb_sales.${key}`, startOfMonth),
        year: sumFieldRange(docs, `fb_sales.${key}`, startOfYear),
      },
      guests: {
        today: sumFieldRange(docs, `fb_sales.${key}_guests`, startOfToday),
        yesterday: sumFieldRange(docs, `fb_sales.${key}_guests`, startOfYesterday, endOfYesterday),
        month: sumFieldRange(docs, `fb_sales.${key}_guests`, startOfMonth),
        year: sumFieldRange(docs, `fb_sales.${key}_guests`, startOfYear),
      },
    }))

    const miscData = MISC_KEYS.map((key) => ({
      label: key,
      today: sumFieldRange(docs, `misc.${key}`, startOfToday),
      yesterday: sumFieldRange(docs, `misc.${key}`, startOfYesterday, endOfYesterday),
      month: sumFieldRange(docs, `misc.${key}`, startOfMonth),
      year: sumFieldRange(docs, `misc.${key}`, startOfYear),
    }))

    const getSubtotal = (
      items: any[],
      horizon: 'today' | 'yesterday' | 'month' | 'year',
      type: 'revenue' | 'guests' = 'revenue',
    ) =>
      items.reduce(
        (acc, item) => acc + (type === 'revenue' ? item.revenue[horizon] : item.guests[horizon]),
        0,
      )

    const fbTotals = {
      revenue: {
        today: getSubtotal(fbData, 'today'),
        yesterday: getSubtotal(fbData, 'yesterday'),
        month: getSubtotal(fbData, 'month'),
        year: getSubtotal(fbData, 'year'),
      },
      guests: {
        today: getSubtotal(fbData, 'today', 'guests'),
        yesterday: getSubtotal(fbData, 'yesterday', 'guests'),
        month: getSubtotal(fbData, 'month', 'guests'),
        year: getSubtotal(fbData, 'year', 'guests'),
      },
    }

    const miscTotals = {
      today: miscData.reduce((acc, i) => acc + i.today, 0),
      yesterday: miscData.reduce((acc, i) => acc + i.yesterday, 0),
      month: miscData.reduce((acc, i) => acc + i.month, 0),
      year: miscData.reduce((acc, i) => acc + i.year, 0),
    }

    // Grand Totals across all horizons for both Revenue and Guests
    const grandTotal = {
      revenue: {
        today:
          sumFieldRange(docs, 'rooms.rooms_revenue', startOfToday) +
          fbTotals.revenue.today +
          miscTotals.today,
        yesterday:
          sumFieldRange(docs, 'rooms.rooms_revenue', startOfYesterday, endOfYesterday) +
          fbTotals.revenue.yesterday +
          miscTotals.yesterday,
        month:
          sumFieldRange(docs, 'rooms.rooms_revenue', startOfMonth) +
          fbTotals.revenue.month +
          miscTotals.month,
        year:
          sumFieldRange(docs, 'rooms.rooms_revenue', startOfYear) +
          fbTotals.revenue.year +
          miscTotals.year,
      },
      guests: {
        today: fbTotals.guests.today,
        yesterday: fbTotals.guests.yesterday,
        month: fbTotals.guests.month,
        year: fbTotals.guests.year,
      },
    }

    return {
      success: true,
      data: {
        rooms: {
          occupied: {
            today: sumFieldRange(docs, 'rooms.no_rooms_occupied', startOfToday),
            yesterday: sumFieldRange(
              docs,
              'rooms.no_rooms_occupied',
              startOfYesterday,
              endOfYesterday,
            ),
            month: sumFieldRange(docs, 'rooms.no_rooms_occupied', startOfMonth),
            year: sumFieldRange(docs, 'rooms.no_rooms_occupied', startOfYear),
          },
          complimentary: {
            today: sumFieldRange(docs, 'rooms.complimentary_house_use', startOfToday),
            yesterday: sumFieldRange(
              docs,
              'rooms.complimentary_house_use',
              startOfYesterday,
              endOfYesterday,
            ),
            month: sumFieldRange(docs, 'rooms.complimentary_house_use', startOfMonth),
            year: sumFieldRange(docs, 'rooms.complimentary_house_use', startOfYear),
          },
          revenue: {
            today: sumFieldRange(docs, 'rooms.rooms_revenue', startOfToday),
            yesterday: sumFieldRange(docs, 'rooms.rooms_revenue', startOfYesterday, endOfYesterday),
            month: sumFieldRange(docs, 'rooms.rooms_revenue', startOfMonth),
            year: sumFieldRange(docs, 'rooms.rooms_revenue', startOfYear),
          },
          occupancy_perc: {
            today: getOccupancyValue(docs, startOfToday, 'today'),
            yesterday: getOccupancyValue(docs, startOfYesterday, 'today', endOfYesterday),
            month: getOccupancyValue(docs, startOfMonth, 'period'),
            year: getOccupancyValue(docs, startOfYear, 'period'),
          },
        },
        fb: fbData,
        fbTotals,
        misc: miscData,
        miscTotals,
        grandTotal,
      },
    }
  } catch (error) {
    console.error('Error fetching sales stats:', error)
    return { success: false, error: 'Failed to fetch data' }
  }
}
