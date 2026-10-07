'use server'

import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { User } from '@/payload-types'
import { headers } from 'next/headers'

export async function fetchQuickViewDocs({
  collection,
  page = 1,
  limit = 10,
  status,
}: {
  collection: string
  page?: number
  limit?: number
  status?: string
}) {
  try {
    const payload = await getPayload({ config })

    // Retrieve the authenticated user from the request headers
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      throw new Error('Not authenticated')
    }

    // Fetch full user to ensure we have 'access' populated for access control checks
    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1, // Populate 'access' relationship
      overrideAccess: true,
    })

    console.log('fetchQuickViewDocs', 'user', user?.email)
    console.log('fetchQuickViewDocs', 'collection', collection)
    const where: any = {}
    if (status && status !== 'all') {
      where.workflow_status = {
        equals: status,
      }
    }

    const req = await createLocalReq(
      { user: user ? { ...user, collection: 'users' } : undefined },
      payload,
    )
    
    // PENDING TASK REMINDER
    const result = await payload.find({
      collection: collection as any,
      where,
      limit,
      page,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: false,
      req,
    })

    return {
      success: true,
      docs: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        totalPages: result.totalPages,
        page: result.page,
      },
    }
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      docs: [],
      pagination: {
        totalDocs: 0,
        hasPrevPage: false,
        hasNextPage: false,
        totalPages: 0,
        page: 1,
      },
    }
  }
}
