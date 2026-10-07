'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'

export type AnalyticsEventType =
  | 'page_view'
  | 'click'
  | 'form_submission'
  | 'error'
  | 'video_started'
  | 'video_ended'
  | 'search'

export interface AnalyticsData {
  eventType: AnalyticsEventType
  path: string
  elementId?: string
  referrer?: string
  additionalData?: any
}

export const addAnalyticsAction = async (data: AnalyticsData) => {
  const payload = await getPayload({ config })
  const headerList = await headers()

  const userAgent = headerList.get('user-agent') || 'unknown'
  const referrer = data.referrer || headerList.get('referer') || 'unknown'
  
  // IP is handled by the collection hook if not provided, 
  // but we can also extract it here if we want to be explicit.
  const ipAddress =
    headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  try {
    await payload.create({
      collection: 'analytics',
      data: {
        ...data,
        userAgent,
        referrer,
        ipAddress,
      },
      overrideAccess: true,
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding analytics:', error)
    return { success: false, error: 'Failed to add analytics' }
  }
}
