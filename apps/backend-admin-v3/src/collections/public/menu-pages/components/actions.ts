'use server'

import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * Fetches a restaurant by ID to get its slug.
 * Used by the MenuPageSlug custom component.
 */
export async function getRestaurantSlugAction(id: string) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user } = await payload.auth({ headers: headersList })
    const req = await createLocalReq({ user: user ?? undefined }, payload)

    const restaurant = await payload.findByID({
      collection: 'restaurants',
      id,
      depth: 0,
      req,
    })

    return {
      success: true,
      slug: restaurant?.slug || '',
    }
  } catch (error) {
    console.error('Error in getRestaurantSlugAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
