'use server'

import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * Fetches a menu item by ID for preview.
 * Used by the FnbMenuItemPreview custom component.
 */
export async function getMenuItemAction(id: string) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user } = await payload.auth({ headers: headersList })
    const req = await createLocalReq({ user: user ?? undefined }, payload)

    const item = await payload.findByID({
      collection: 'menu-items',
      id,
      depth: 1,
      req,
    })

    return {
      success: true,
      data: item,
    }
  } catch (error) {
    console.error('Error in getMenuItemAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
