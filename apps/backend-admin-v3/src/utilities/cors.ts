import type { GlobalAfterChangeHook, Payload } from 'payload'

let cachedOrigins: string[] | null = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 60 * 1000

export const normalizeOrigin = (origin: string): string => {
  return origin.trim().replace(/\/+$/, '')
}

export const invalidateAllowedOriginsCache: GlobalAfterChangeHook = ({ doc }) => {
  cachedOrigins = null
  cacheExpiresAt = 0
  return doc
}

export const isOriginAllowed = (
  requestOrigin: string | null | undefined,
  allowedOrigins: string[],
): boolean => {
  if (!requestOrigin) return false
  const cleanRequest = normalizeOrigin(requestOrigin).toLowerCase()
  return allowedOrigins.some(
    (allowed) => normalizeOrigin(allowed).toLowerCase() === cleanRequest,
  )
}

export const getAllowedOrigins = async (payload: Payload): Promise<string[]> => {
  const now = Date.now()
  if (cachedOrigins !== null && now < cacheExpiresAt) {
    return cachedOrigins
  }

  try {
    const settings = await payload.findGlobal({
      slug: 'payload-docusign',
      depth: 0,
      overrideAccess: true,
    })
    const origins = settings?.allowed_origins
    if (Array.isArray(origins)) {
      const filtered = origins
        .filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
        .map(normalizeOrigin)
      cachedOrigins = filtered
      cacheExpiresAt = now + CACHE_TTL_MS
      return cachedOrigins
    }
  } catch {
    // If lookup fails, return empty list (no fallback origin)
  }

  cachedOrigins = []
  cacheExpiresAt = now + CACHE_TTL_MS
  return cachedOrigins
}

export const buildCorsHeaders = (
  requestOrigin: string | null | undefined,
  allowedOrigins: string[],
  methods: string = 'GET, POST, OPTIONS',
): Record<string, string> => {
  if (isOriginAllowed(requestOrigin, allowedOrigins) && requestOrigin) {
    return {
      'Access-Control-Allow-Origin': requestOrigin.trim(),
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-MS-Graph-Token',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    }
  }

  return {
    Vary: 'Origin',
  }
}
