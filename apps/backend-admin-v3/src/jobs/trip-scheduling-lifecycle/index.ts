import { TaskConfig } from 'payload'
import { runTripSchedulingLifecycle } from './run-lifecycle'

export const tripSchedulingLifecycle: TaskConfig<'trip-scheduling-lifecycle'> = {
  slug: 'trip-scheduling-lifecycle',
  schedule: [
    {
      cron: process.env.NODE_ENV === 'production' ? '7 * * * *' : '*/2 * * * *',
      queue: process.env.NODE_ENV === 'production' ? 'trip-scheduling' : 'dev-trip-scheduling',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const { logger } = payload
    const none = { settled: 0, expired: 0, skipped: 0, errors: 0 }

    if (process.env.JOBS_DISABLE_TRIP_SCHEDULING_LIFECYCLE === 'true') {
      logger.warn(`trip-scheduling-lifecycle skipping`)
      return { state: 'succeeded', output: none }
    }

    try {
      logger.info(`trip-scheduling-lifecycle started`)
      const counts = await runTripSchedulingLifecycle(payload)
      logger.info(
        `trip-scheduling-lifecycle completed. settled: ${counts.settled}, expired: ${counts.expired}, skipped: ${counts.skipped}, errors: ${counts.errors}`,
      )
      return { output: counts, state: 'succeeded' }
    } catch (err) {
      logger.error(`trip-scheduling-lifecycle error: ${err}`)
      return {
        output: none,
        state: 'failed',
        errorMessage: `${err instanceof Error ? err.message : 'Unknown'}`,
      }
    }
  },
}
