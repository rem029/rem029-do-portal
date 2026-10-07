'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getH2aToken } from '@/services/h2a-oasys'
import { OasysH2ATokenRequest, OasysH2ATokenResponse } from '@/services/h2a-oasys/types'

/**
 * REFRESH ACTIONS
 */

export const handleRefreshH2aOasysData = async (): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const payload = await getPayload({ config: configPromise })

    const existingJobs = await payload.find({
      collection: 'payload-jobs',
      where: {
        and: [{ processing: { equals: true } }, { taskSlug: { equals: 'h2a-oasys-refresh' } }],
      },
      sort: '-createdAt',
      limit: 10,
      overrideAccess: true,
    })

    if (existingJobs.docs.some((j: any) => j.processing)) {
      throw new Error('A Refresh job is already in progress.')
    }

    const job = await payload.jobs.queue({
      task: 'h2a-oasys-refresh',
      input: {},
    })

    payload.logger.info(`Queued h2a-oasys-refresh job with ID: ${job.id}`)

    return {
      success: true,
      message: 'Refresh job has been triggered.',
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred',
    }
  }
}

export const handleSyncH2ADepartment = async (): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const payload = await getPayload({ config: configPromise })

    const existingJobs = await payload.find({
      collection: 'payload-jobs',
      where: {
        and: [
          { processing: { equals: true } },
          { taskSlug: { equals: 'h2a-oasys-sync-department' } },
        ],
      },
      sort: '-createdAt',
      limit: 10,
      overrideAccess: true,
    })

    if (existingJobs.docs.some((j: any) => j.processing)) {
      throw new Error('A Sync Department job is already in progress.')
    }

    const job = await payload.jobs.queue({
      task: 'h2a-oasys-sync-department',
      input: {},
    })

    payload.logger.info(`Queued h2a-oasys-sync-department job with ID: ${job.id}`)

    return {
      success: true,
      message: 'Sync Department job has been triggered.',
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred',
    }
  }
}

export const handleSyncH2AUsers = async (
  operation?: 'create' | 'update',
): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const logger = payload.logger

    logger.info(`Starting Sync H2A Users job with operation: ${operation || 'all'}`)

    const existingJobs = await payload.find({
      collection: 'payload-jobs',
      where: {
        and: [{ processing: { equals: true } }, { taskSlug: { equals: 'h2a-oasys-sync-users' } }],
      },
      sort: '-createdAt',
      limit: 10,
      overrideAccess: true,
    })

    if (existingJobs.docs.some((j) => j.processing)) {
      throw new Error('A Sync Users job is already in progress.')
    }

    const job = await payload.jobs.queue({
      task: 'h2a-oasys-sync-users',
      input: { operation },
    })

    logger.info(`Queued h2a-oasys-sync-users job with ID: ${job.id}`)

    return {
      success: true,
      message: `Sync Users (${operation || 'all'}) job has been triggered.`,
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred',
    }
  }
}

/**
 * SEED ACTIONS
 */

export const handleSeedH2ADatabase = async (): Promise<{
  success: boolean
  message: string
}> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const logger = payload.logger

    const existingJobs = await payload.find({
      collection: 'payload-jobs',
      where: {
        and: [
          { processing: { equals: true } },
          { taskSlug: { equals: 'h2a-oasys-seed-database' } },
        ],
      },
      sort: '-createdAt',
      limit: 10,
      overrideAccess: true,
    })

    if (existingJobs.docs.some((j) => j.processing)) {
      throw new Error('A Seed Database job is already in progress.')
    }

    const job = await payload.jobs.queue({
      task: 'h2a-oasys-seed-database',
      input: {},
    })

    logger.info(`Queued h2a-oasys-seed-database job with ID: ${job.id}`)

    return {
      success: true,
      message: 'Seed Database job has been triggered.',
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred',
    }
  }
}

/**
 * TEST ACTIONS
 */

export const handleTestH2aOasysConnection = async (
  config: OasysH2ATokenRequest,
): Promise<{
  success: boolean
  message: string
  response?: OasysH2ATokenResponse
}> => {
  try {
    const result = await getH2aToken(config)

    if (result && result.access_token) {
      return {
        success: true,
        message: 'Successfully connected to H2A Oasys.',
        response: result,
      }
    } else {
      return {
        success: false,
        message: 'Failed to connect to H2A Oasys. Check settings and try again.',
      }
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred',
    }
  }
}
