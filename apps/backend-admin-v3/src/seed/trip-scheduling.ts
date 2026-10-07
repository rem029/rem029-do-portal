import type { Payload } from 'payload'
import { seedTripSchedulingCategories } from './trip-scheduling-categories'
import { seedTripSchedulingDrivers } from './trip-scheduling-drivers'
import { seedTripSchedulingVehicles } from './trip-scheduling-vehicles'
import { seedTripSchedulingRoutes } from './trip-scheduling-routes'
import { seedTripSchedulingZones } from './trip-scheduling-zones'
import { seedTripSchedulingShuttles, type ShuttleSeedCount } from './trip-scheduling-shuttles'
import type { SeedCount } from './helpers/create-if-missing'

export type TripSchedulingSeedResult = {
  categories: SeedCount
  drivers: SeedCount
  vehicles: SeedCount
  routes: SeedCount
  zones: SeedCount
  shuttles: ShuttleSeedCount
}

// Adds default records that don't exist yet; existing records are never updated or deleted.
// Errors propagate so callers (the Options button, the startup seed chain) report them.
export const seedTripScheduling = async ({
  payload,
}: {
  payload: Payload
}): Promise<TripSchedulingSeedResult> => {
  payload.logger.info('🚀 Initiating System Master Seed Orchestrator Pipeline...')

  // Sequential: shuttles look up the routes and vehicles created before them.
  const categories = await seedTripSchedulingCategories(payload)
  const drivers = await seedTripSchedulingDrivers(payload)
  const vehicles = await seedTripSchedulingVehicles(payload)
  const routes = await seedTripSchedulingRoutes(payload)
  const zones = await seedTripSchedulingZones(payload)
  const shuttles = await seedTripSchedulingShuttles(payload)

  payload.logger.info('🎉 Trip scheduling defaults seeded (missing records only).')
  return { categories, drivers, vehicles, routes, zones, shuttles }
}

// Seed-chain entry: skips entirely once trip-scheduling data exists, so startup costs one query.
// The Options seed button calls seedTripScheduling directly to add any missing defaults on demand.
export const seedTripSchedulingIfEmpty = async ({ payload }: { payload: Payload }): Promise<void> => {
  const existing = await payload.find({
    collection: 'trip-scheduling-categories',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    payload.logger.info('[seedTripSchedulingIfEmpty] Trip scheduling data already exists — skipping.')
    return
  }

  await seedTripScheduling({ payload })
}
