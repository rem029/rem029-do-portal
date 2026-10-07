// Client-safe helpers for the Microsoft SSO "return to where you started" flow.
// The return path travels through Microsoft as the OAuth `state` param, so the Azure
// redirect URI (/api/auth/microsoft/callback) never changes.

/** Query param used to report a failed Microsoft login back to a non-admin page. */
export const MICROSOFT_AUTH_ERROR_PARAM = 'auth_error'

const DUMMY_ORIGIN = 'http://return-path.local'

export const MICROSOFT_AUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'Microsoft OAuth authentication failed. Please try again.',
  oauth_denied: 'You denied the Microsoft login request. Please try again.',
  no_code: 'No authorization code received from Microsoft. Please try again.',
  auth_failed: 'Authentication failed. Please check your credentials or try Microsoft login.',
  account_disabled: 'Your account has been disabled. Please contact your administrator.',
  sso_required:
    'This account is configured for Microsoft SSO only. Please use the Microsoft login button.',
  credentials_required: 'This account is configured for username/password login only.',
  auth_method_mismatch:
    'Authentication method does not match your account configuration. Please try the other login method.',
}

export const getMicrosoftAuthErrorMessage = (code: string): string =>
  MICROSOFT_AUTH_ERROR_MESSAGES[code] || 'An authentication error occurred. Please try again.'

/**
 * Normalizes a requested return path to an app-relative path (without the Next basePath),
 * or returns null when it's missing or points off-site (open-redirect guard).
 * Absolute URLs are only accepted when they match `allowedOrigin`.
 */
export const sanitizeReturnPath = (
  value: string | null | undefined,
  { basePath = '', allowedOrigin }: { basePath?: string; allowedOrigin?: string } = {},
): string | null => {
  if (!value || value.includes('\\')) return null

  let url: URL
  try {
    if (value.startsWith('/') && !value.startsWith('//')) {
      url = new URL(value, DUMMY_ORIGIN)
      if (url.origin !== DUMMY_ORIGIN) return null
    } else {
      if (!allowedOrigin) return null
      url = new URL(value)
      if (url.origin !== new URL(allowedOrigin).origin) return null
    }
  } catch {
    return null
  }

  let path = url.pathname
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    path = path.slice(basePath.length) || '/'
  }
  if (!path.startsWith('/') || path.startsWith('//')) return null

  return `${path}${url.search}${url.hash}`
}

/** Sets (or with `null`, removes) a query param on an app-relative path. */
export const setPathSearchParam = (path: string, key: string, value: string | null): string => {
  const url = new URL(path, DUMMY_ORIGIN)
  if (value === null) url.searchParams.delete(key)
  else url.searchParams.set(key, value)
  return `${url.pathname}${url.search}${url.hash}`
}

/** URL of the endpoint that starts the Microsoft login, carrying an optional return path. */
export const getMicrosoftLoginURL = (apiBaseURL: string, returnPath?: string | null): string => {
  const base = `${apiBaseURL}/auth/microsoft`
  return returnPath ? `${base}?redirect=${encodeURIComponent(returnPath)}` : base
}
