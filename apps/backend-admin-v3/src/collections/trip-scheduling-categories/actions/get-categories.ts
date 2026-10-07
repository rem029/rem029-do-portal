'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getTripCategoriesAction() {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'trip-scheduling-categories',
      pagination: false,
      overrideAccess: true,
      depth: 0,
      sort: 'name',
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
      `Error fetching trip categories via action: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, data: [] }
  }
}