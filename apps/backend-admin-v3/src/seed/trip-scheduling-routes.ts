import { Payload } from 'payload'
import { createIfMissing, emptySeedCount, type SeedCount } from './helpers/create-if-missing'

export const seedTripSchedulingRoutes = async (payload: Payload): Promise<SeedCount> => {
  payload.logger.info('  └─ Seeding Routes...')
  const coreRoutes = ['Al Sadd', 'Yasameen']
  const count = emptySeedCount()
  for (const routeName of coreRoutes) {
    count[
      await createIfMissing(payload, 'trip-scheduling-routes', { name: { equals: routeName } }, {
        name: routeName,
        isActive: true,
      })
    ]++
  }
  return count
}
