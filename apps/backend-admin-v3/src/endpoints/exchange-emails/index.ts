/**
 * Exchange Emails Endpoint
 *
 * Migrated to Node.js/Payload CMS from the original ASP.NET Core ExchangeMiddlewareAPI.
 * Original C# EWS Architecture and Implementation credits to Rejin Ramanan.
 */
import type { Endpoint } from 'payload'
import { getEmailsForUser, type EmailMessage } from '../../services/exchange'
import { buildCorsHeaders, getAllowedOrigins, isOriginAllowed } from '../../utilities/cors'
import { normalizeDohaEmail } from '../../utilities/docusign-email'

interface CacheEntry {
  timestamp: number
  data: EmailMessage[]
}

const emailCache = new Map<string, CacheEntry>()
const CACHE_DURATION_MS = 30 * 1000 // 30 seconds

// Decodes a JWT's claims without verifying its signature - only for diagnostic logging
// (audience/scope/upn), so we can see why Graph rejected a token without needing Graph itself.
const decodeJwtClaims = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export const exchangeEmailsEndpoint: Endpoint = {
  path: '/exchange-emails',
  method: 'get',
  handler: async (req) => {
    const { user } = req
    const { logger } = req.payload

    const requestOrigin = req.headers.get('Origin') || req.headers.get('origin')
    const allowedOrigins = await getAllowedOrigins(req.payload)
    const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins, 'GET, OPTIONS')

    if (requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
      return Response.json(
        { message: 'Origin not allowed' },
        { status: 403, headers: corsHeaders },
      )
    }

    try {
      let targetEmail: string | null = null

      // DEV OVERRIDE: Allow ?email=test@test.com in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        try {
          const urlObj = new URL(req.url as string, 'http://localhost')
          const overrideEmail = urlObj.searchParams.get('email')
          if (overrideEmail) {
            targetEmail = overrideEmail
            logger.info(`DEV MODE: Overriding target email to ${targetEmail}`)
          }
        } catch (e) {
          // ignore parsing errors
        }
      }

      // If no override, proceed with normal auth
      if (!targetEmail) {
        // Strategy 1: Logged in via Payload Admin Panel
        if (user && user.email) {
          targetEmail = user.email
        }
        // Strategy 2: SharePoint passing Microsoft Graph Token
        else {
          const authHeader = req.headers.get('Authorization') || ''
          if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)

            const claims = decodeJwtClaims(token)
            logger.info(
              `at /exchange-emails: Bearer token presented. aud=${claims?.aud} scp=${claims?.scp} roles=${claims?.roles} appid=${claims?.appid} upn=${claims?.upn ?? claims?.unique_name ?? claims?.preferred_username} tid=${claims?.tid} exp=${claims?.exp ? new Date((claims.exp as number) * 1000).toISOString() : undefined}`,
            )

            // Verify token by calling Microsoft Graph API
            const graphResp = await fetch('https://graph.microsoft.com/v1.0/me', {
              headers: { Authorization: `Bearer ${token}` },
            })

            if (graphResp.ok) {
              const graphData = await graphResp.json()
              targetEmail = graphData.mail || graphData.userPrincipalName
              logger.info(`at /exchange-emails: Graph token verified, resolved email=${targetEmail}`)
            } else {
              const graphErrorBody = await graphResp.text()
              logger.warn(
                `Invalid Microsoft token presented at /exchange-emails: ${graphResp.status} - ${graphErrorBody}`,
              )
            }
          } else {
            logger.info(
              `at /exchange-emails: no Payload session and no Bearer token (Authorization header ${authHeader ? 'present but not "Bearer <token>"' : 'missing'})`,
            )
          }
        }
      }

      // If we couldn't resolve an email, they are not authenticated properly
      if (!targetEmail) {
        logger.error('at /exchange-emails endpoint: Unauthenticated access')
        return Response.json({ message: 'Unauthenticated' }, { status: 401, headers: corsHeaders })
      }

      const formattedEmail = normalizeDohaEmail(targetEmail)

      // Parse Optional Pagination
      let limit: number | undefined = undefined
      let offset: number | undefined = undefined
      try {
        const urlObj = new URL(req.url as string, 'http://localhost')
        const limitStr = urlObj.searchParams.get('limit')
        if (limitStr) {
          const parsed = parseInt(limitStr, 10)
          if (!isNaN(parsed) && parsed > 0) limit = parsed
        }

        const offsetStr = urlObj.searchParams.get('offset')
        if (offsetStr) {
          const parsed = parseInt(offsetStr, 10)
          if (!isNaN(parsed) && parsed >= 0) offset = parsed
        }
      } catch (e) {
        // Ignore URL parsing errors
      }

      // --- CACHE CHECK ---
      // We must include limit and offset in the cache key so different pages don't share the same cache!
      const cacheKey = `${formattedEmail}_limit:${limit || 'none'}_offset:${offset || 'none'}`

      const now = Date.now()
      const cached = emailCache.get(cacheKey)

      if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
        logger.info(
          `Returning CACHED EWS emails for user: ${formattedEmail} (Limit: ${limit}, Offset: ${offset})`,
        )
        return Response.json(
          {
            Value: cached.data,
            ErrorMessage: null,
            DebugUser: targetEmail,
            FromCache: true,
          },
          { headers: corsHeaders, status: 200 },
        )
      }

      logger.info(
        `Fetching FRESH EWS emails for verified user: ${formattedEmail}` +
          (limit !== undefined || offset !== undefined
            ? ` (Limit: ${limit}, Offset: ${offset})`
            : ''),
      )

      const emails = await getEmailsForUser(formattedEmail, limit, offset)

      // Update Cache
      emailCache.set(cacheKey, {
        timestamp: Date.now(),
        data: emails,
      })

      return Response.json(
        {
          Value: emails,
          ErrorMessage: null,
          DebugUser: targetEmail,
        },
        { headers: corsHeaders, status: 200 },
      )
    } catch (error: unknown) {
      if (logger) {
        logger.error(`Error in /exchange-emails endpoint: ${(error as Error)?.message || 'Unknown'}`)
      }
      return Response.json(
        {
          Value: [],
          ErrorMessage: (error as Error)?.message || 'Internal Server Error',
          DebugUser: null,
        },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
