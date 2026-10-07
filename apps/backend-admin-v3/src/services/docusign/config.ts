import type { Payload } from 'payload'

// Missing integration settings - callers can treat this as "DocuSign unavailable" rather than a hard failure.
export class DocuSignNotConfiguredError extends Error {}

export interface DocuSignConfig {
  integrationKey: string
  accountId: string
  privateKey: Buffer
  oAuthBasePath: string
  returnUrl?: string
  statusReaderUserId?: string
}

const ENVIRONMENT_OAUTH_BASE_PATH: Record<string, string> = {
  sandbox: 'account-d.docusign.com',
  production: 'account.docusign.com',
}

/**
 * Reads DocuSign credentials from the `payload-docusign` global (admin-editable,
 * same pattern as h2a-oasys-settings' client_id/secret) rather than env vars.
 * Throws a clear error if something required hasn't been configured yet - never
 * at import/boot time, only when a DocuSign call is actually attempted.
 */
export async function getDocuSignConfig(payload: Payload): Promise<DocuSignConfig> {
  const settings = await payload.findGlobal({
    slug: 'payload-docusign',
    depth: 0,
    overrideAccess: true,
  })

  const integrationKey = settings?.integration_key?.trim()
  const accountId = settings?.account_id?.trim()
  const privateKeyPem = settings?.private_key?.trim()
  const environment = settings?.environment || 'sandbox'

  if (!integrationKey) {
    throw new DocuSignNotConfiguredError('DocuSign Integration Key is not configured (Settings > DocuSign)')
  }
  if (!accountId) {
    throw new DocuSignNotConfiguredError('DocuSign Account ID is not configured (Settings > DocuSign)')
  }
  if (!privateKeyPem) {
    throw new DocuSignNotConfiguredError('DocuSign Private Key is not configured (Settings > DocuSign)')
  }

  return {
    integrationKey,
    accountId,
    privateKey: Buffer.from(privateKeyPem, 'utf8'),
    oAuthBasePath: ENVIRONMENT_OAUTH_BASE_PATH[environment] ?? ENVIRONMENT_OAUTH_BASE_PATH.sandbox,
    returnUrl: settings?.return_url?.trim() || undefined,
    statusReaderUserId: settings?.status_reader_user_id?.trim() || undefined,
  }
}

/**
 * Returns the DocuSign web details base URL based on the environment setting in payload-docusign.
 */
export async function getDocuSignWebBaseUrl(payload: Payload): Promise<string> {
  try {
    const settings = await payload.findGlobal({
      slug: 'payload-docusign',
      depth: 0,
      overrideAccess: true,
    })
    return settings?.environment === 'production'
      ? 'https://app.docusign.com/documents/details'
      : 'https://appdemo.docusign.com/documents/details'
  } catch {
    return 'https://appdemo.docusign.com/documents/details'
  }
}

/**
 * Builds the full DocuSign web document details URL for a given envelope ID.
 */
export async function buildDocuSignWebUrl(payload: Payload, envelopeId: string): Promise<string> {
  const base = await getDocuSignWebBaseUrl(payload)
  return `${base}/${envelopeId}`
}

