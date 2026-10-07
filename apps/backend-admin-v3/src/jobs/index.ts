import { Payload } from 'payload'

export const initJobs: (payload: Payload) => Promise<void> = async (payload: Payload) => {
  const isProd = process.env.NODE_ENV === 'production'
  const { logger } = payload

  try {
    logger.info(
      `h2a-oasys-refresh Initializing job in  ${isProd ? 'production' : 'development'} environment`,
    )
    await payload.jobs.queue({
      task: 'h2a-oasys-refresh',
      input: {},
      queue: isProd ? 'h2a-oasys-refresh' : 'dev-sync',
    })

    logger.info('h2a-oasys-refresh Successfully queued job on startup.')
  } catch (error) {
    logger.error(`h2a-oasys-refresh Error initializing job ${error}`)
  }

  try {
    logger.info(
      `h2a-oasys-sync-department Initializing job in  ${isProd ? 'production' : 'development'} environment`,
    )
    await payload.jobs.queue({
      task: 'h2a-oasys-sync-department',
      input: {},
      queue: isProd ? 'h2a-oasys-sync' : 'dev-sync',
    })
    logger.info('h2a-oasys-sync-department Successfully job on startup.')
  } catch (error) {
    logger.error(`h2a-oasys-sync-department Error initializing job ${error}`)
  }

  try {
    logger.info(
      `audit-logs-cleanup Initializing job in  ${isProd ? 'production' : 'development'} environment`,
    )
    await payload.jobs.queue({
      task: 'audit-logs-cleanup',
      input: {},
      queue: isProd ? 'cleanup' : 'dev-sync',
    })
    logger.info('audit-logs-cleanup Successfully job on startup.')
  } catch (error) {
    logger.error(`audit-logs-cleanup Error initializing job ${error}`)
  }
}
