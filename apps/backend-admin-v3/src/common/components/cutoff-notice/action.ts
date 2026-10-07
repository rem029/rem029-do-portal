'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getCutoffSettings(settingsSlug: string) {
  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({
      slug: settingsSlug as any,
      overrideAccess: true,
    })

    return {
      cutoffDay: (settings as any)?.cutoff_day || 15,
    }
  } catch (error) {
    console.error('Error fetching cutoff settings:', error)
    return {
      cutoffDay: 15,
    }
  }
}
