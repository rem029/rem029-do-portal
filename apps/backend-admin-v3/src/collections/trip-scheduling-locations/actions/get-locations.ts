'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getLocationsAction(routeId?: string) {
  const payload = await getPayload({ config })

  try {
    const whereCondition: any = {
      isActive: { equals: true },
    }

    if (routeId) {
      whereCondition.route = { equals: routeId }
    }

    const { docs } = await payload.find({
      collection: 'trip-scheduling-locations',
      pagination: false,
      overrideAccess: true,
      depth: 0,
      sort: 'name',
      where: whereCondition,
    })

    return {
      success: true,
      data: docs.map((doc: any) => ({
        id: doc.id,
        title: doc.name || doc.title,
      })),
    }
  } catch (error) {
    payload.logger.error(
      `Error fetching trip locations via action: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, data: [] }
  }
}