'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getDrivers(includeOnlyActive: boolean = true) {
  const payload = await getPayload({ config })

  try {
    const drivers = await payload.find({
      collection: 'trip-scheduling-drivers',
      overrideAccess: true,
      ...(includeOnlyActive && {
        where: {
          isActive: { equals: true },
        },
      }),
      pagination: false,
      depth: 0,
    })

    return {
      success: true,
      docs: drivers.docs.map((d: any) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
      })),
    }
  } catch (err) {
    payload.logger.error(
      `[Get Drivers Action Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { success: false, error: 'Failed to retrieve drivers list', docs: [] }
  }
}
