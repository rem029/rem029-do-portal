import { TaskConfig } from 'payload'
import { seedH2ADatabase } from '@/services/h2a-database'

export const h2aOasysSeedDatabase: TaskConfig<'h2a-oasys-seed-database'> = {
  slug: 'h2a-oasys-seed-database',
  retries: 0,
  handler: async ({ req }) => {
    const { payload } = req
    const { logger } = payload

    try {
      logger.info(`h2a-oasys-seed-database started`)

      const result = await seedH2ADatabase(payload)

      logger.info(`h2a-oasys-seed-database completed`)
      return { output: { ...result } }
    } catch (err) {
      payload.logger.error(`h2a-oasys-seed-database error: ${err}`)
      return {
        output: {},
        state: 'failed',
        errorMessage: `${(err as any)?.message || 'Unknown'}`,
      }
    }
  },
}
