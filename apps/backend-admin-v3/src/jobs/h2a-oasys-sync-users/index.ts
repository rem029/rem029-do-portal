import { syncH2AUser } from '@/services/h2a-oasys'
import { TaskConfig } from 'payload'

export const h2aOasysSyncUsers: TaskConfig<'h2a-oasys-sync-users'> = {
  slug: 'h2a-oasys-sync-users',
  retries: 3,
  schedule: [
    {
      cron: process.env.NODE_ENV === 'production' ? '0 */13 * * *' : '*/10 * * * *',
      queue: process.env.NODE_ENV === 'production' ? 'h2a-oasys-sync' : 'dev-sync',
    },
  ],
  inputSchema: [
    {
      name: 'operation',
      type: 'select',
      options: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
      ],
    },
  ],
  handler: async ({ req, input }) => {
    const { payload } = req
    const { logger } = payload

    if (process.env.JOBS_DISABLE_H2A_SYNC_USERS === 'true')
      return { state: 'succeeded', output: { refresh: null } }

    try {
      logger.info(`h2a-oasys-sync-users started. input.operation: ${input?.operation || 'create'}`)

      await syncH2AUser({ payload, operation: input?.operation || 'create' })

      logger.info(`h2a-oasys-sync-users completed.`)
      return { output: { refresh: true }, state: 'succeeded' }
    } catch (err) {
      logger.error(`h2a-oasys-sync-users error: ${err}`)
      return {
        output: { deletedCount: 0 },
        state: 'failed',
        errorMessage: `${(err as any)?.message || 'Unknown'}`,
      }
    }
  },
}
