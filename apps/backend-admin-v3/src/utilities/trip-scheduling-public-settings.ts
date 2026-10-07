import { getPayload } from 'payload'
import config from '@payload-config'
import type { InternalMedia } from '@/payload-types'
import { BASE_PATH } from '@/utilities/constant'

const DEFAULT_GENERAL_BACKGROUND = `${BASE_PATH}/backgrounds/bg-02.jpg`
const DEFAULT_LANDING_HEADER_BACKGROUND = `${BASE_PATH}/backgrounds/bg-04.jpg`

export type TripSchedulingFaq = { id: string; question: string; answer: string }

export type TripSchedulingPublicSettings = {
  // CSS background-image layers, ready to follow a page's gradient layer
  generalBackground: string
  landingHeaderBackground: string
  faqs: TripSchedulingFaq[]
}

// Empty field, deleted media (the FK sets it to null) or an unpopulated id all mean "not configured".
const mediaUrl = (image: string | InternalMedia | null | undefined): string | null => {
  if (!image || typeof image !== 'object') return null
  // Payload's `url` omits the basePath (it resolves via a 307 from /api), so build the direct path first.
  if (image.filename)
    return `${BASE_PATH}/api/internal-media/file/${encodeURIComponent(image.filename)}`
  return image.url || null
}

const cssUrl = (url: string): string => `url('${url.replace(/[\\']/g, '\\$&')}')`

// The static default always sits underneath: if the configured file fails to load, the browser shows it instead.
const backgroundLayers = (configured: string | null, fallback: string): string =>
  configured ? `${cssUrl(configured)}, ${cssUrl(fallback)}` : cssUrl(fallback)

export async function getTripSchedulingPublicSettings(): Promise<TripSchedulingPublicSettings> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'trip-scheduling-settings',
      depth: 1,
      overrideAccess: true,
    })

    return {
      generalBackground: backgroundLayers(
        mediaUrl(settings.generalBackgroundImage),
        DEFAULT_GENERAL_BACKGROUND,
      ),
      landingHeaderBackground: backgroundLayers(
        mediaUrl(settings.landingHeaderBackgroundImage),
        DEFAULT_LANDING_HEADER_BACKGROUND,
      ),
      faqs: (settings.faqs ?? []).map((faq, i) => ({
        id: faq.id ?? String(i),
        question: faq.question,
        answer: faq.answer,
      })),
    }
  } catch (err) {
    console.error('Failed to load trip-scheduling public settings:', err)
    return {
      generalBackground: backgroundLayers(null, DEFAULT_GENERAL_BACKGROUND),
      landingHeaderBackground: backgroundLayers(null, DEFAULT_LANDING_HEADER_BACKGROUND),
      faqs: [],
    }
  }
}
