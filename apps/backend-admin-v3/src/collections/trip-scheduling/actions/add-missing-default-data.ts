'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedTripScheduling } from '@/seed/trip-scheduling'
import { isCollectionSuperUser } from '@/utilities/access'

export async function addMissingDefaultData() {
  try {
    const payload = await getPayload({ config })

    // Server actions are public endpoints; seeding creates reference data, so keep it to super users.
    const { user } = await payload.auth({ headers: await headers() })
    if (!isCollectionSuperUser(user, 'trip-scheduling-settings')) {
      return { success: false, error: 'Not authorized' }
    }

    const counts = await seedTripScheduling({ payload })
    const totals = Object.values(counts).reduce(
      (sum, c) => ({ created: sum.created + c.created, skipped: sum.skipped + c.skipped }),
      { created: 0, skipped: 0 },
    )
    // Shuttles skipped for a missing route/vehicle are counted in `skipped` but don't exist yet.
    const { warnings } = counts.shuttles
    const alreadyExist = totals.skipped - warnings.length
    const summary = `Created ${totals.created}, skipped ${alreadyExist} (already exist).`
    const message =
      warnings.length > 0
        ? [`${summary} ${warnings.length} shuttles could not be linked:`, ...warnings].join('\n')
        : summary

    return { success: true, message, counts }
  } catch (err: any) {
    const payload = await getPayload({ config })
    payload.logger.error(`Seed Error: ${err.message}`)
    return { success: false, error: `Seeding failed: ${err.message}` }
  }
}
