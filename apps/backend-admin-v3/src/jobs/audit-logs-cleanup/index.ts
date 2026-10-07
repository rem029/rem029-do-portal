import { TaskConfig } from 'payload'
import { subMonths } from 'date-fns'

export const auditLogsCleanup: TaskConfig<'audit-logs-cleanup'> = {
  slug: 'audit-logs-cleanup',
  schedule: [
    {
      cron: process.env.NODE_ENV === 'production' ? '0 0 * * *' : '*/10 * * * *',
      queue: process.env.NODE_ENV === 'production' ? 'cleanup' : 'dev-sync',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const { logger } = payload

    if (process.env.JOBS_DISABLE_AUDIT_CLEANUP === 'true') {
      logger.warn(`audit-logs-cleanup skipping`)
      return { state: 'succeeded', output: { deletedCount: 0 } }
    }

    try {
      logger.info(`audit-logs-cleanup started`)

      const settings = await payload.findGlobal({
        slug: 'audit-log-settings',
      })

      const retentionMonths = (settings as any)?.retentionMonths || 1
      const cutoffDate = subMonths(new Date(), retentionMonths)

      const result = await payload.delete({
        collection: 'audit-logs',
        where: {
          createdAt: {
            less_than: cutoffDate.toISOString(),
          },
        },
      })

      logger.info(
        `audit-logs-cleanup completed retention: ${retentionMonths} month(s). Records deleted: ${result.docs.length}`,
      )
      return { output: { deletedCount: result.docs.length }, state: 'succeeded' }
    } catch (err) {
      logger.error(`audit-logs-cleanup error: ${err}`)
      return {
        output: { deletedCount: 0 },
        state: 'failed',
        errorMessage: `${(err as any)?.message || 'Unknown'}`,
      }
    }
  },
}
