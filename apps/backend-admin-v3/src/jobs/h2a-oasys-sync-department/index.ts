import { syncH2ADepartment } from '@/services/h2a-oasys'
import { TaskConfig } from 'payload'

export const h2aOasysSyncDepartment: TaskConfig<'h2a-oasys-sync-department'> = {
  slug: 'h2a-oasys-sync-department',
  retries: 3,
  schedule: [
    {
      cron: process.env.NODE_ENV === 'production' ? '0 */13 * * *' : '*/10 * * * *',
      queue: process.env.NODE_ENV === 'production' ? 'h2a-oasys-sync' : 'dev-sync',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const { logger } = payload

    if (process.env.JOBS_DISABLE_H2A_SYNC_DEPT === 'true') {
      logger.warn(`h2a-oasys-sync-department skipping`)
      return { state: 'succeeded', output: { refresh: null } }
    }

    try {
      logger.warn(`h2a-oasys-sync-department started`)

      await syncH2ADepartment({ payload })

      logger.warn(`h2a-oasys-sync-department completed`)
      return { output: { refresh: true } }
    } catch (err) {
      logger.error(`h2a-oasys-sync-department error: ${err}`)
      return {
        output: { deletedCount: 0 },
        state: 'failed',
        errorMessage: `${(err as any)?.message || 'Unknown'}`,
      }
    }
  },
}
