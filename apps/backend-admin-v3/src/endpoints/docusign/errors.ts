import { DocuSignConsentRequiredError } from '@/services/docusign/auth'
import { DocuSignNotActionableError } from '@/services/docusign/envelopes'

export interface DocuSignApiErrorShape {
  response?: {
    body?: { message?: string; errorCode?: string }
    data?: { message?: string; errorCode?: string }
    status?: number
    statusCode?: number
    text?: string
  }
  status?: number
  statusCode?: number
  message?: string
}

/**
 * Returns the user-friendly error message for when a user is not provisioned as a DocuSign sender.
 */
export function getUserLacksMembershipMessage(email?: string | null): string {
  return `${email ?? 'This user'} is not set up as a DocuSign sender in this account. Ask your DocuSign admin to add this user, or sign in as a user who already sends via DocuSign.`
}

/**
 * Extracts the raw error code from a DocuSign error object if present.
 */
export function getDocuSignErrorCode(err: unknown): string | undefined {
  const docusignError = err as DocuSignApiErrorShape
  return (
    docusignError?.response?.body?.errorCode ||
    docusignError?.response?.data?.errorCode
  )
}

/**
 * Extracts HTTP status code from a DocuSign error object if present.
 */
export function getDocuSignErrorHttpStatus(err: unknown): number | undefined {
  const docusignError = err as DocuSignApiErrorShape
  return (
    docusignError?.response?.status ||
    docusignError?.response?.statusCode ||
    docusignError?.status ||
    docusignError?.statusCode
  )
}

/**
 * Determines whether the error represents an envelope not found / does not exist error.
 */
export function isDocuSignNotFoundError(err: unknown): boolean {
  const errorCode = getDocuSignErrorCode(err)
  const status = getDocuSignErrorHttpStatus(err)
  return (
    errorCode === 'ENVELOPE_DOES_NOT_EXIST' ||
    errorCode === 'INVALID_ENVELOPE_ID' ||
    status === 404
  )
}

/**
 * Determines whether the error indicates the user lacks membership/provisioning in the DocuSign account.
 */
export function isDocuSignUserLacksMembership(err: unknown): boolean {
  const errorCode = getDocuSignErrorCode(err)
  if (errorCode === 'USER_LACKS_MEMBERSHIP') {
    return true
  }
  const message = (err as { message?: string })?.message || ''
  return message.includes('No active DocuSign user account found')
}

/**
 * Formats a friendly error message from any DocuSign error.
 */
export function getDocuSignFriendlyErrorMessage(
  err: unknown,
  callerEmail?: string | null,
): string {
  if (err instanceof DocuSignConsentRequiredError) {
    return 'Consent required for DocuSign user account.'
  }

  if (err instanceof DocuSignNotActionableError) {
    return err.message
  }

  const errorCode = getDocuSignErrorCode(err)
  if (errorCode === 'RECIPIENT_NOT_IN_SEQUENCE') {
    return 'This envelope is not waiting for your signature'
  }

  if (isDocuSignUserLacksMembership(err)) {
    return getUserLacksMembershipMessage(callerEmail)
  }

  const docusignError = err as DocuSignApiErrorShape
  return (
    docusignError?.response?.body?.message ||
    docusignError?.response?.data?.message ||
    docusignError?.message ||
    'DocuSign API error'
  )
}

/**
 * Standard error response formatter for DocuSign REST endpoints.
 */
export function formatDocuSignEndpointError(
  err: unknown,
  corsHeaders: Record<string, string>,
  callerEmail?: string | null,
  envelopeId?: string,
): Response {
  if (err instanceof DocuSignConsentRequiredError) {
    return Response.json(
      {
        error: 'consent_required',
        message: 'Consent required for this DocuSign user account.',
        authorizationUrl: err.authorizationUrl,
      },
      { status: 428, headers: corsHeaders },
    )
  }

  if (err instanceof DocuSignNotActionableError) {
    return Response.json(
      { message: err.message },
      { status: 409, headers: corsHeaders },
    )
  }

  const errorCode = getDocuSignErrorCode(err)
  if (errorCode === 'RECIPIENT_NOT_IN_SEQUENCE') {
    return Response.json(
      { message: 'This envelope is not waiting for your signature' },
      { status: 409, headers: corsHeaders },
    )
  }

  if (isDocuSignNotFoundError(err)) {
    return Response.json(
      { message: `Envelope "${envelopeId || 'unknown'}" not found` },
      { status: 404, headers: corsHeaders },
    )
  }

  if (isDocuSignUserLacksMembership(err)) {
    return Response.json(
      { message: getUserLacksMembershipMessage(callerEmail) },
      { status: 400, headers: corsHeaders },
    )
  }

  const message = getDocuSignFriendlyErrorMessage(err, callerEmail)
  return Response.json(
    { message },
    { status: 502, headers: corsHeaders },
  )
}
