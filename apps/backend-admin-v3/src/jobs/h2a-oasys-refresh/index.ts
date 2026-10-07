import { refreshH2aOasysData } from '@/services/h2a-oasys'
import { TaskConfig } from 'payload'

export const h2aOasysRefresh: TaskConfig<'h2a-oasys-refresh'> = {
  slug: 'h2a-oasys-refresh',
  retries: 3,
  schedule: [
    {
      cron: process.env.NODE_ENV === 'production' ? '0 */12 * * *' : '*/10 * * * *',
      queue: process.env.NODE_ENV === 'production' ? 'h2a-oasys-refresh' : 'dev-sync',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const { logger } = payload

    if (process.env.JOBS_DISABLE_H2A_REFRESH === 'true') {
      logger.warn(`h2a-oasys-refresh skipping`)
      return { state: 'succeeded', output: { refresh: null } }
    }

    try {
      logger.info(`h2a-oasys-refresh started`)

      const status = await refreshH2aOasysData(payload)

      logger.info(`h2a-oasys-refresh completed`)
      return { output: { refresh: status } }
    } catch (err) {
      payload.logger.error(`h2a-oasys-refresh error: ${err}`)
      return {
        output: { deletedCount: 0 },
        state: 'failed',
        errorMessage: `${(err as any)?.message || 'Unknown'}`,
      }
    }
  },
}
