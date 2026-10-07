'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getDriver(driverId: string) {
  const payload = await getPayload({ config })

  try {
    const driver = await payload.findByID({
      collection: 'trip-scheduling-drivers',
      id: driverId,
      overrideAccess: true,
      depth: 0,
    })

    if (!driver) {
      return { success: false, error: 'Driver not found' }
    }

    return {
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: (driver as any).phone,
      },
    }
  } catch (err) {
    payload.logger.error(
      `[Get Driver Action Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return { success: false, error: 'Failed to fetch driver details' }
  }
}
