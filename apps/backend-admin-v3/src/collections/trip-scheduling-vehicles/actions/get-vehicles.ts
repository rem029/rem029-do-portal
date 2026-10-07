'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getVehiclesAction(options?: {
  filterMode?: string
  addAll?: boolean
  selectedItems?: string[]
}) {
  const payload = await getPayload({ config })

  try {
    let whereCondition: any = {}

    if (options?.filterMode === 'employee-only') {
      whereCondition = {
        category: {
          equals: 'employee-transport',
        },
      }
    } else if (options?.filterMode === 'exclude-employee') {
      whereCondition = {
        category: {
          not_equals: 'employee-transport',
        },
      }
    }

    if (options?.addAll === false && options?.selectedItems && options.selectedItems.length > 0) {
      whereCondition = {
        ...whereCondition,
        id: {
          in: options.selectedItems,
        },
      }
    }

    const { docs } = await payload.find({
      collection: 'trip-scheduling-vehicles',
      pagination: false,
      overrideAccess: true,
      depth: 0,
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
    })

    return {
      success: true,
      data: docs.map((doc: any) => ({ 
        id: doc.id, 
        title: doc.name || doc.title,
        category: doc.category 
      })),
    }
  } catch (error) {
    payload.logger.error(
      `Error fetching fleet vehicles via dedicated action: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, data: [] }
  }
}