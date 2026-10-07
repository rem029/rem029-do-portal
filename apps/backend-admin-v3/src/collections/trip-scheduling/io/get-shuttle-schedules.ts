'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

const getOperationalSortWeight = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes

  const PIVOT_MINUTES = 300 // 05:00 AM
  if (totalMinutes >= PIVOT_MINUTES) {
    return totalMinutes - PIVOT_MINUTES
  } else {
    return totalMinutes + 1440 - PIVOT_MINUTES
  }
}

interface GetShuttleSchedulesParams {
  search?: string
  direction?: string
  route?: string
  vehicle?: string
  classification?: string
  page?: number
}

export async function getShuttleSchedules(params: GetShuttleSchedulesParams = {}) {
  const payload = await getPayload({ config })

  try {
    const search = params.search?.trim() || ''
    const direction = params.direction || 'All'
    const route = params.route || 'All'
    const vehicle = params.vehicle || 'All'
    const classification = params.classification || 'All'
    const page = params.page || 1
    const limit = 10

    const andConditions: any[] = []

    if (search) {
      andConditions.push({
        or: [
          { adminTitle: { like: search } },
          { publicNote: { like: search } },
          { departureTime: { like: search } },
        ],
      })
    }

    if (direction !== 'All') {
      andConditions.push({ direction: { equals: direction } })
    }
    if (route !== 'All') {
      andConditions.push({ route: { equals: route } })
    }
    if (vehicle !== 'All') {
      andConditions.push({ vehicle: { equals: vehicle } })
    }

    if (classification === 'Manager') {
      andConditions.push({ pickupManager: { greater_than: 0 } })
    } else if (classification === 'Male') {
      andConditions.push({ pickupMale: { greater_than: 0 } })
    } else if (classification === 'Female') {
      andConditions.push({ pickupFemale: { greater_than: 0 } })
    } else if (classification === 'General') {
      andConditions.push({ pickupGeneral: { greater_than: 0 } })
    }

    const whereClause = andConditions.length > 0 ? { and: andConditions } : undefined

    const [routesRes, vehiclesRes, shuttlesRes] = await Promise.all([
      payload.find({
        collection: 'trip-scheduling-routes',
        overrideAccess: true,
        pagination: false,
        sort: 'name',
        where: { isActive: { equals: true } },
      }),
      payload.find({
        collection: 'trip-scheduling-vehicles',
        overrideAccess: true,
        pagination: false,
        where: {
          and: [{ category: { equals: 'employee-transport' } }, { isActive: { equals: true } }],
        },
      }),
      payload.find({
        collection: 'trip-scheduling-shuttles',
        overrideAccess: true,
        page,
        limit,
        depth: 1,
        sort: 'departureTime',
        ...(whereClause && { where: whereClause }),
      }),
    ])

    const rawDocs = shuttlesRes.docs || []
    const operationalSortedDocs = [...rawDocs].sort((a: any, b: any) => {
      return getOperationalSortWeight(a.departureTime) - getOperationalSortWeight(b.departureTime)
    })

    return {
      success: true,
      routes: routesRes.docs || [],
      vehicles: vehiclesRes.docs || [],
      shuttles: operationalSortedDocs,
      totalPages: shuttlesRes.totalPages || 1,
      totalDocs: shuttlesRes.totalDocs || 0,
    }
  } catch (err) {
    payload.logger.error(
      `[Shuttle Schedules Server Action Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      success: false,
      error: 'Internal server error processing shuttle schedules.',
      routes: [],
      vehicles: [],
      shuttles: [],
      totalPages: 1,
      totalDocs: 0,
    }
  }
}
