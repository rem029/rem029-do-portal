import crypto from 'crypto'
import type { PayloadRequest } from 'payload'
import { User, UsersAccess } from '@/payload-types'
import { hasUserAccess } from '@/utilities/access'
import { normalizeDohaEmail } from '@/utilities/docusign-email'

export interface ResolvedDocuSignCaller {
  authUser: User // the Payload user Payload's own auth resolved (service account OR real admin)
  targetEmail: string // whose DocuSign identity to act as/attribute to
  isServiceAccountCall: boolean
}

export type ResolveDocuSignCallerResult =
  | { ok: true; caller: ResolvedDocuSignCaller }
  | { ok: false; status: 401 | 403; message: string }

interface GraphTokenCacheEntry {
  email: string
  expiresAt: number
}

const graphTokenCache = new Map<string, GraphTokenCacheEntry>()
const MAX_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const decodeJwtClaims = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Resolves the authenticated caller and target DocuSign email identity.
 * Supports:
 * 1. SharePoint service account pass-through:
 *    - Authenticated as service account via `Authorization: users API-Key <key>` (Payload resolves req.user)
 *    - Caller identity provided via `X-MS-Graph-Token: <raw MS Graph token>`
 * 2. Payload Admin session / direct API key caller:
 *    - Authenticated via session cookie or API key (Payload resolves req.user)
 *    - `X-MS-Graph-Token` absent -> targetEmail is the authenticated user's own email.
 */
export async function resolveDocuSignCaller(req: PayloadRequest): Promise<ResolveDocuSignCallerResult> {
  const { user, payload } = req
  const { logger } = payload

  // 1. Must be authenticated by Payload (via session cookie or API key)
  if (!user) {
    logger.warn('resolveDocuSignCaller: No authenticated Payload user on request')
    return { ok: false, status: 401, message: 'Unauthenticated' }
  }

  // 2. Populate access if it's a string ID
  let resolvedUser = user as User
  if (typeof resolvedUser.access === 'string') {
    try {
      const accessDoc = await payload.findByID({
        collection: 'users-access',
        id: resolvedUser.access,
        overrideAccess: true,
      })
      resolvedUser = { ...resolvedUser, access: accessDoc as UsersAccess }
    } catch (err) {
      logger.error(`resolveDocuSignCaller: Failed to load access doc: ${(err as Error)?.message}`)
    }
  }

  // 3. Check for payload-docusign API access grant
  if (!hasUserAccess(resolvedUser, 'payload-docusign', 'access')) {
    logger.warn(
      `resolveDocuSignCaller: Forbidden - user ${resolvedUser.email} lacks 'payload-docusign' access grant`,
    )
    return {
      ok: false,
      status: 403,
      message: 'Forbidden: You do not have permission to access DocuSign APIs',
    }
  }

  // 4. Check for X-MS-Graph-Token header
  const graphTokenHeader = req.headers.get('X-MS-Graph-Token') || req.headers.get('x-ms-graph-token')
  if (graphTokenHeader && graphTokenHeader.trim()) {
    const token = graphTokenHeader.trim()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const now = Date.now()
    const cached = graphTokenCache.get(tokenHash)

    if (cached && now < cached.expiresAt) {
      logger.info(
        `resolveDocuSignCaller: Graph token cache HIT (hash=${tokenHash.substring(0, 8)}), targetEmail=${cached.email}`,
      )
      return {
        ok: true,
        caller: {
          authUser: resolvedUser,
          targetEmail: cached.email,
          isServiceAccountCall: true,
        },
      }
    }

    logger.info(
      `resolveDocuSignCaller: Graph token cache MISS (hash=${tokenHash.substring(0, 8)}), calling Microsoft Graph /me`,
    )

    // Verify token with Microsoft Graph
    let graphResp: globalThis.Response
    try {
      graphResp = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (fetchErr) {
      logger.error(`resolveDocuSignCaller: Error calling Microsoft Graph API: ${(fetchErr as Error)?.message}`)
      return { ok: false, status: 401, message: 'Invalid Microsoft Graph token' }
    }

    if (!graphResp.ok) {
      const graphErrorBody = await graphResp.text()
      logger.warn(
        `resolveDocuSignCaller: Invalid Microsoft Graph token: ${graphResp.status} - ${graphErrorBody}`,
      )
      return { ok: false, status: 401, message: 'Invalid Microsoft Graph token' }
    }

    const expectedTenantId = process.env.MICROSOFT_TENANT_ID
    if (!expectedTenantId) {
      logger.error('resolveDocuSignCaller: MICROSOFT_TENANT_ID environment variable is not configured')
      return { ok: false, status: 401, message: 'Microsoft Graph token is not from the company tenant' }
    }

    const claims = decodeJwtClaims(token)
    // Decoding claims without verifying signature is safe because Microsoft Graph already validated the token.
    if (typeof claims?.tid !== 'string' || claims.tid.toLowerCase() !== expectedTenantId.trim().toLowerCase()) {
      logger.warn(
        `resolveDocuSignCaller: Token tenant (${claims?.tid}) does not match expected tenant (${expectedTenantId})`,
      )
      return { ok: false, status: 401, message: 'Microsoft Graph token is not from the company tenant' }
    }

    const graphData = (await graphResp.json()) as { mail?: string; userPrincipalName?: string }
    const rawEmail = graphData.mail || graphData.userPrincipalName || null

    if (!rawEmail) {
      logger.warn('resolveDocuSignCaller: Microsoft Graph /me response contained no mail or userPrincipalName')
      return { ok: false, status: 401, message: 'Invalid Microsoft Graph token' }
    }

    const targetEmail = normalizeDohaEmail(rawEmail)
    if (!targetEmail) {
      logger.warn('resolveDocuSignCaller: Normalized email is empty')
      return { ok: false, status: 401, message: 'Invalid Microsoft Graph token' }
    }

    const tokenExpMs = typeof claims?.exp === 'number' ? claims.exp * 1000 : now + MAX_CACHE_TTL_MS
    const expiresAt = Math.min(tokenExpMs, now + MAX_CACHE_TTL_MS)
    for (const [key, entry] of graphTokenCache) {
      if (entry.expiresAt <= now) graphTokenCache.delete(key)
    }
    graphTokenCache.set(tokenHash, { email: targetEmail, expiresAt })

    logger.info(
      `resolveDocuSignCaller: Graph token verified and cached until ${new Date(expiresAt).toISOString()}, targetEmail=${targetEmail} (via authUser=${resolvedUser.email})`,
    )

    return {
      ok: true,
      caller: {
        authUser: resolvedUser,
        targetEmail,
        isServiceAccountCall: true,
      },
    }
  }

  // Fallback: Direct user / Payload admin session without X-MS-Graph-Token
  if (!resolvedUser.email) {
    logger.error('resolveDocuSignCaller: Authenticated user has no email')
    return { ok: false, status: 401, message: 'Unauthenticated' }
  }

  const targetEmail = normalizeDohaEmail(resolvedUser.email)
  if (!targetEmail) {
    logger.error('resolveDocuSignCaller: Normalized user email is empty')
    return { ok: false, status: 401, message: 'Unauthenticated' }
  }

  return {
    ok: true,
    caller: {
      authUser: resolvedUser,
      targetEmail,
      isServiceAccountCall: false,
    },
  }
}
