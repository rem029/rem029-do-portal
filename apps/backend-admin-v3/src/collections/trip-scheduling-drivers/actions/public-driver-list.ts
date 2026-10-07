'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getPublicDrivers() {
  const payload = await getPayload({ config })

  try {
    const drivers = await payload.find({
      collection: 'trip-scheduling-drivers',
      overrideAccess: true,
      where: {
        isActive: { equals: true },
      },
      pagination: false,
      depth: 0,
    })

    const cleanPool = drivers.docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
    }))

    return { success: true, docs: cleanPool }
  } catch (err) {
    payload.logger.error(
      `[Public Drivers Action Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { success: false, error: 'Failed to retrieve chauffeur profiles' }
  }
}
