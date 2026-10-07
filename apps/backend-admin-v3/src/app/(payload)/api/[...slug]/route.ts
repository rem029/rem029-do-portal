/* THIS FILE WAS ORIGINALLY GENERATED AUTOMATICALLY BY PAYLOAD. */
/* Hand-edited on purpose: wraps OPTIONS to provide settings-driven CORS for external endpoints (/api/docusign/ and /api/exchange-emails). */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import { getPayload } from 'payload'
import { buildCorsHeaders, getAllowedOrigins } from '@/utilities/cors'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)

const defaultOptions = REST_OPTIONS(config)

export const OPTIONS = async (
  req: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<Response> => {
  const url = new URL(req.url)
  const pathname = url.pathname

  if (pathname.includes('/api/docusign/') || pathname.includes('/api/exchange-emails')) {
    const payload = await getPayload({ config })
    const allowedOrigins = await getAllowedOrigins(payload)
    const requestOrigin = req.headers.get('Origin') || req.headers.get('origin')
    const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins)
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  return defaultOptions(req, context)
}
