'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export const getHomeDashboardBackgroundImageUrlAction = async (): Promise<string | null> => {
  const payload = await getPayload({ config: configPromise })

  const settings = await payload.findGlobal({
    slug: 'home-dashboard-settings',
    overrideAccess: true,
  })

  const image = settings?.background_image
  if (!image || typeof image !== 'object') return null

  return image.url || `${BACKEND_URL_WITH_BASE}/api/internal-media/file/${image.filename}`
}
