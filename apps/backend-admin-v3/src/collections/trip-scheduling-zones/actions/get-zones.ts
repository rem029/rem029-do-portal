'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getZonesAction() {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'trip-scheduling-zones',
      pagination: false,
      overrideAccess: true,
      depth: 0,
      where: {
        isActive: { equals: true },
      },
    })

    const formattedDocs = docs.map((d: any) => ({
      id: d.id,
      title: d.district ? `Zone ${d.zoneNumber} — ${d.district}` : `Zone ${d.zoneNumber}`,
      zoneNumber: d.zoneNumber || '',
    }))

    formattedDocs.sort((a: any, b: any) =>
      a.zoneNumber.localeCompare(b.zoneNumber, undefined, { numeric: true, sensitivity: 'base' }),
    )

    return {
      success: true,
      data: formattedDocs,
    }
  } catch (error) {
    payload.logger.error(
      `Error fetching trip zones via action: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { success: false, data: [] }
  }
}