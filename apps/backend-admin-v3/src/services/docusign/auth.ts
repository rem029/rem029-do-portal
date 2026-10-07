import docusign from 'docusign-esign'
import type { Payload } from 'payload'
import { getDocuSignConfig } from './config'

export class DocuSignConsentRequiredError extends Error {
  constructor(public authorizationUrl: string) {
    super('consent_required')
    this.name = 'DocuSignConsentRequiredError'
  }
}

export interface DocuSignTokenInfo {
  accessToken: string
  accountId: string
  basePath: string // e.g. "https://na3.docusign.net/restapi" — resolved via getUserInfo, never hardcoded
  expiresAt: number // epoch ms
}

// In-memory module-scope cache keyed by DocuSign user id
const tokenCache = new Map<string, DocuSignTokenInfo>()

/**
 * Builds the DocuSign-hosted consent URL for a given redirect_uri.
 */
export async function buildConsentUrl(payload: Payload, redirectUri: string): Promise<string> {
  const { oAuthBasePath, integrationKey } = await getDocuSignConfig(payload)
  return `https://${oAuthBasePath}/oauth/auth?response_type=code&scope=${encodeURIComponent(
    'signature impersonation',
  )}&client_id=${encodeURIComponent(integrationKey)}&redirect_uri=${encodeURIComponent(redirectUri)}`
}

/**
 * Helper to fetch the consent redirect URL configured in the payload-docusign global.
 */
async function getConsentRedirectUri(payload: Payload): Promise<string> {
  try {
    const settings = await payload.findGlobal({
      slug: 'payload-docusign',
      depth: 0,
      overrideAccess: true,
    })
    if (settings?.consent_redirect_url) {
      return settings.consent_redirect_url
    }
  } catch {
    // If payload/global is not yet accessible, fallback
  }
  return process.env.DOCUSIGN_CONSENT_REDIRECT_URL || ''
}

/**
 * Helper to determine if an error returned by the SDK indicates consent_required.
 */
function isConsentRequiredError(error: unknown): boolean {
  if (!error) return false
  const err = error as {
    response?: {
      body?: { error?: string; error_description?: string }
      data?: { error?: string; error_description?: string }
    }
    body?: { error?: string; error_description?: string }
    data?: { error?: string; error_description?: string }
    message?: string
  }

  const errorType =
    err.response?.body?.error ||
    err.response?.data?.error ||
    err.body?.error ||
    err.data?.error

  if (errorType === 'consent_required') {
    return true
  }

  if (typeof err.message === 'string' && err.message.includes('consent_required')) {
    return true
  }

  return false
}

/**
 * Returns a cached token for this DocuSign user id if still valid (>5min left),
 * otherwise requests a fresh JWT user token, resolves basePath via getUserInfo,
 * caches, and returns it. Throws DocuSignConsentRequiredError if DocuSign reports consent_required.
 */
export async function getTokenForDocuSignUser(
  payload: Payload,
  docuSignUserId: string,
): Promise<DocuSignTokenInfo> {
  if (!docuSignUserId) {
    throw new Error('DocuSign user ID is required to acquire a token')
  }

  const cached = tokenCache.get(docuSignUserId)
  // TTL: treat a token as expired 5 minutes before its real expiresAt
  const fiveMinutesMs = 5 * 60 * 1000
  if (cached && Date.now() < cached.expiresAt - fiveMinutesMs) {
    return cached
  }

  const { integrationKey, accountId, privateKey, oAuthBasePath } = await getDocuSignConfig(payload)

  const dsApi = new docusign.ApiClient()
  dsApi.setOAuthBasePath(oAuthBasePath)

  // Short-lived assertion per DocuSign best practices (60-300 seconds)
  const jwtLifeSec = 300
  const scopes = ['signature', 'impersonation']

  let tokenResponse: {
    body?: {
      access_token?: string
      expires_in?: number | string
    }
  }

  try {
    tokenResponse = await dsApi.requestJWTUserToken(
      integrationKey,
      docuSignUserId,
      scopes,
      privateKey,
      jwtLifeSec,
    )
  } catch (error: unknown) {
    if (isConsentRequiredError(error)) {
      const redirectUri = await getConsentRedirectUri(payload)
      const consentUrl = await buildConsentUrl(payload, redirectUri)
      throw new DocuSignConsentRequiredError(consentUrl)
    }
    throw error
  }

  const accessToken = tokenResponse?.body?.access_token
  if (!accessToken) {
    throw new Error('DocuSign token response did not contain an access_token')
  }

  const expiresInSec =
    typeof tokenResponse.body?.expires_in === 'number'
      ? tokenResponse.body.expires_in
      : typeof tokenResponse.body?.expires_in === 'string'
        ? parseInt(tokenResponse.body.expires_in, 10)
        : 3600

  // Resolve account base URI via getUserInfo
  const userInfo = (await dsApi.getUserInfo(accessToken)) as {
    accounts?: Array<{ accountId?: string; baseUri?: string }>
  }
  const accounts = userInfo?.accounts

  const matchedAccount = accounts?.find((a) => a.accountId === accountId)
  if (!matchedAccount || !matchedAccount.baseUri) {
    const foundAccounts = accounts?.map((a) => a.accountId).filter(Boolean).join(', ') || 'none'
    throw new Error(
      `Configured DocuSign account ID "${accountId}" not found in user accounts list (found: ${foundAccounts})`,
    )
  }

  const basePath = `${matchedAccount.baseUri.replace(/\/+$/, '')}/restapi`
  const expiresAt = Date.now() + expiresInSec * 1000

  const tokenInfo: DocuSignTokenInfo = {
    accessToken,
    accountId,
    basePath,
    expiresAt,
  }

  tokenCache.set(docuSignUserId, tokenInfo)
  return tokenInfo
}
