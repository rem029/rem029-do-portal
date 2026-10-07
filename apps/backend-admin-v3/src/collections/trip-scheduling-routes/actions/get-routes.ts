'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getRoutesAction() {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'trip-scheduling-routes',
      pagination: false,
      overrideAccess: true,
      depth: 0,
      sort: 'name',
      where: {
        isActive: { equals: true },
      },
    })

    return {
      success: true,
      data: docs.map((doc: any) => ({
        id: doc.id,
        title: doc.name || doc.id,
      })),
    }
  } catch (error) {
    payload.logger.error(
      `Error fetching trip routes via action: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, data: [] }
  }
}