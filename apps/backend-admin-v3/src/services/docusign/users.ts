import docusign from 'docusign-esign'
import type { Payload } from 'payload'
import { getTokenForDocuSignUser } from './auth'
import { DocuSignNotConfiguredError, getDocuSignConfig } from './config'

/**
 * Builds a DocuSign API client authorized as the fixed status-reader account -
 * sufficient scope for account-level reads (user lookup/listing) that don't need a
 * specific employee's own impersonation token.
 */
async function getStatusReaderApiClient(payload: Payload): Promise<{
  apiClient: docusign.ApiClient
  accountId: string
}> {
  const { accountId, oAuthBasePath, statusReaderUserId } = await getDocuSignConfig(payload)
  if (!statusReaderUserId) {
    throw new DocuSignNotConfiguredError('DocuSign status reader user ID is not configured in DocuSign settings')
  }

  const tokenInfo = await getTokenForDocuSignUser(payload, statusReaderUserId)

  // ApiClient's constructor opts silently re-derive oAuthBasePath from basePath
  // internally (see deriveOAuthBasePathFromRestBasePath in the SDK) and discard
  // whatever's passed in opts - use the setters instead so the configured value
  // actually takes effect, matching auth.ts's pattern.
  const apiClient = new docusign.ApiClient()
  apiClient.setBasePath(tokenInfo.basePath)
  apiClient.setOAuthBasePath(oAuthBasePath)
  apiClient.addDefaultHeader('Authorization', `Bearer ${tokenInfo.accessToken}`)

  return { apiClient, accountId }
}

// UsersApi.list answers an email that matches no account member with HTTP 400
// USER_LACKS_MEMBERSHIP rather than an empty list.
function isNotAccountMemberError(error: unknown): boolean {
  const err = error as {
    response?: { body?: { errorCode?: string }; data?: { errorCode?: string } }
  }
  const errorCode = err?.response?.data?.errorCode ?? err?.response?.body?.errorCode
  return errorCode === 'USER_LACKS_MEMBERSHIP'
}

async function listActiveUsersByEmail(
  payload: Payload,
  email: string,
  additionalInfo?: boolean,
): Promise<Array<{ userId?: string; email?: string; isAdmin?: string | boolean }>> {
  const { apiClient, accountId } = await getStatusReaderApiClient(payload)
  const usersApi = new docusign.UsersApi(apiClient)
  try {
    const result = (await usersApi.list(accountId, {
      email: email.trim(),
      status: 'Active',
      ...(additionalInfo ? { additionalInfo: 'true' } : {}),
    })) as {
      users?: Array<{ userId?: string; email?: string; isAdmin?: string | boolean }>
    }
    return result?.users ?? []
  } catch (err) {
    if (isNotAccountMemberError(err)) return []
    throw err
  }
}

interface UserCacheEntry {
  userId: string
  expiresAt: number
}

// In-memory module-scope cache keyed by normalized email (10-minute TTL, non-null only)
const userCache = new Map<string, UserCacheEntry>()

/**
 * Resolves a company email to its DocuSign user id within DOCUSIGN_ACCOUNT_ID, using an
 * admin-level token (the status-reader account's token is sufficient scope for this read).
 * Returns null if no matching DocuSign user (distinct from consent_required).
 */
export async function resolveDocuSignUserId(payload: Payload, email: string): Promise<string | null> {
  if (!email) {
    throw new Error('Email is required to resolve DocuSign user ID')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const cached = userCache.get(normalizedEmail)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.userId
  }

  const users = await listActiveUsersByEmail(payload, email)
  if (users.length === 0) {
    return null
  }

  // DocuSign's `email` list filter does not reliably return an exact match only - verify
  // the returned user's email actually matches instead of trusting users[0], otherwise an
  // unrelated account member gets silently impersonated and fails with USER_LACKS_MEMBERSHIP
  // or sends on someone else's behalf.
  const matchedUser = users.find((u) => u.email?.trim().toLowerCase() === normalizedEmail)
  const resolvedId = matchedUser?.userId ?? null

  if (resolvedId) {
    userCache.set(normalizedEmail, {
      userId: resolvedId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })
  }

  return resolvedId
}

interface AdminCacheEntry {
  value: boolean
  expiresAt: number
}

// In-memory module-scope cache keyed by normalized email (5-minute TTL)
const adminCache = new Map<string, AdminCacheEntry>()

export async function isDocuSignAccountAdmin(payload: Payload, email: string): Promise<boolean> {
  if (!email) return false

  const normalizedEmail = email.trim().toLowerCase()
  const cached = adminCache.get(normalizedEmail)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value
  }

  try {
    const users = await listActiveUsersByEmail(payload, email, true)

    const matchedUser = users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail,
    )
    // Sandbox returns "True"/"False" strings; SDK types allow boolean too
    const isAdmin =
      matchedUser?.isAdmin === true ||
      String(matchedUser?.isAdmin).toLowerCase() === 'true'

    adminCache.set(normalizedEmail, {
      value: isAdmin,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })

    return isAdmin
  } catch (err) {
    // Fail closed: on error, treat caller as non-admin so outages narrow visibility
    // Do NOT cache fail-closed false from error
    console.warn(`isDocuSignAccountAdmin(${normalizedEmail}): ${(err as Error)?.message}`)
    return false
  }
}

export interface DocuSignUserSummary {
  userId: string
  email: string
  userName?: string
  userStatus?: string
}

/**
 * Lists Active users in the DocuSign account - only the sender needs to be a real
 * DocuSign user (impersonated via JWT); recipients can be any email, so this is only
 * meant to power sender-email suggestions, not a recipient allowlist.
 */
export async function listDocuSignUsers(payload: Payload): Promise<DocuSignUserSummary[]> {
  const { apiClient, accountId } = await getStatusReaderApiClient(payload)
  const usersApi = new docusign.UsersApi(apiClient)
  const result = (await usersApi.list(accountId, { status: 'Active' })) as {
    users?: Array<{ userId?: string; email?: string; userName?: string; userStatus?: string }>
  }

  return (result?.users ?? [])
    .filter((u): u is { userId: string; email: string; userName?: string; userStatus?: string } =>
      Boolean(u.userId && u.email),
    )
    .map((u) => ({
      userId: u.userId,
      email: u.email,
      userName: u.userName,
      userStatus: u.userStatus,
    }))
}
