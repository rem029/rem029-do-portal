import type { Endpoint } from 'payload'
import {
  getMsAuthCodeURL,
  getMsTokenByCode,
  extractUserFromToken,
  createOrUpdateUserWithMsAuth,
} from '@/services/microsoft-auth'
import { BASE_PATH } from '@/utilities/constant'
import {
  MICROSOFT_AUTH_ERROR_PARAM,
  sanitizeReturnPath,
  setPathSearchParam,
} from '@/utilities/microsoft-auth-redirect'

const getReturnPath = (value: string | null, serverURL: string) =>
  sanitizeReturnPath(value, { basePath: BASE_PATH, allowedOrigin: serverURL })

const isAdminPath = (path: string, admin: string) =>
  path === admin || path.startsWith(`${admin}/`) || path.startsWith(`${admin}?`)

// Admin-originated (or unknown) logins land back on the admin login page, keeping Payload's
// `redirect` param; logins started from a frontend page go back to that page instead.
const getErrorRedirectPath = (errorCode: string, returnPath: string | null, admin: string) => {
  if (returnPath && !isAdminPath(returnPath, admin)) {
    return setPathSearchParam(returnPath, MICROSOFT_AUTH_ERROR_PARAM, errorCode)
  }
  const loginPath = setPathSearchParam(`${admin}/login`, 'error', errorCode)
  return returnPath ? setPathSearchParam(loginPath, 'redirect', returnPath) : loginPath
}

export const authMicrosoftEndpoint: Endpoint = {
  path: '/auth/microsoft',
  method: 'get',
  handler: async (req) => {
    try {
      const {
        routes: { api },
        serverURL,
      } = req.payload.config

      const authCallBackURL = `${serverURL}${api}/auth/microsoft/callback`
      // The return path rides in OAuth `state`, so the registered redirect URI stays unchanged.
      const returnPath = getReturnPath(
        new URL(req.url || '', serverURL).searchParams.get('redirect'),
        serverURL,
      )
      const url = await getMsAuthCodeURL(authCallBackURL, returnPath ?? undefined)

      req.payload.logger.info(
        `at /auth/microsoft endpoint: Redirecting to Microsoft OAuth with callback URL: ${url}`,
      )

      return Response.redirect(url)
    } catch (error: any) {
      req.payload.logger.error(`Error in /auth/microsoft endpoint: ${error.message || 'Unknown'}`)
      return Response.json({ error: 'Authentication failed' }, { status: 500 })
    }
  },
}

export const authMicrosoftCallBackEndpoint: Endpoint = {
  path: '/auth/microsoft/callback',
  method: 'get',
  handler: async (req) => {
    const {
      routes: { admin, api },
      serverURL,
    } = req.payload.config
    const url = new URL(req.url || '', serverURL)
    const returnPath = getReturnPath(url.searchParams.get('state'), serverURL)
    const redirectTo = (path: string) => Response.redirect(`${serverURL}${BASE_PATH}${path}`)

    try {
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      const error_description = url.searchParams.get('error_description')

      if (error) {
        req.payload.logger.error(`Microsoft OAuth error: ${error} - ${error_description}`)
        return redirectTo(getErrorRedirectPath('oauth_failed', returnPath, admin))
      }

      if (!code) {
        req.payload.logger.error('No authorization code received from Microsoft')
        return redirectTo(getErrorRedirectPath('no_code', returnPath, admin))
      }

      const authCallBackURL = `${serverURL}${api}/auth/microsoft/callback`
      const tokenResponse = await getMsTokenByCode(authCallBackURL, code)

      if (!tokenResponse || !tokenResponse.account) {
        req.payload.logger.error('Failed to acquire token or account information from Microsoft')
        throw new Error('Failed to acquire token or account information')
      }

      // DEV ONLY: this is the same Graph-scoped bearer token SharePoint would send to
      // /exchange-emails. Logged here so it can be copied and replayed with curl to test
      // that endpoint's Strategy 2 (Bearer token) path without a real SharePoint deployment.
      // Never log real access tokens outside of local dev.
      if (process.env.NODE_ENV !== 'production') {
        req.payload.logger.info(
          `[DEV ONLY] Microsoft Graph access token for /exchange-emails testing: ${tokenResponse.accessToken}`,
        )
      }

      let { email } = await extractUserFromToken(tokenResponse)

      if (!email) {
        throw new Error('No email found in Microsoft response')
      }

      // Normalize email (remove @corp. if present)
      email = email.toLowerCase().replace('@corp.', '@')

      req.payload.logger.info(`Microsoft OAuth successful for user: ${email}`)

      const { password } = await createOrUpdateUserWithMsAuth(req, email)

      req.payload.logger.info(`Microsoft OAuth logging in user as ${email}`)
      const loginResult = await req.payload.login({
        collection: 'users',
        data: { email, password },
        req,
        context: { isMicrosoftLogin: true },
      })

      req.payload.logger.info(`Microsoft OAuth setting cookies for user ${email}`)

      const successPath = returnPath
        ? setPathSearchParam(returnPath, MICROSOFT_AUTH_ERROR_PARAM, null)
        : admin
      const redirectUrl = `${serverURL}${BASE_PATH}${successPath}`
      req.payload.logger.info(`Microsoft OAuth redirecting to ${redirectUrl}`)
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          ...(loginResult.token && {
            'Set-Cookie': `payload-token=${loginResult.token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
          }),
        },
      })

      return response
    } catch (error: any) {
      req.payload.logger.error(
        `Error in /auth/microsoft/callback endpoint: ${error.errorCode || 'unknown'}: ${error.message || 'Unknown'}`,
      )

      console.error('Full Microsoft auth error:', {
        message: error.message,
        errorCode: error.errorCode,
        errorMessage: error.errorMessage,
        subError: error.subError,
        stack: error.stack,
      })

      // Determine specific error code based on error message
      let errorCode = 'auth_failed'

      if (error.message?.includes('disabled')) {
        errorCode = 'account_disabled'
      } else if (error.message?.includes('Microsoft SSO only')) {
        errorCode = 'sso_required'
      } else if (error.message?.includes('username/password')) {
        errorCode = 'credentials_required'
      } else if (error.message?.includes('account is configured')) {
        errorCode = 'auth_method_mismatch'
      } else if (error.errorCode === 'AADB2C90091' || error.subError === 'access_denied') {
        errorCode = 'oauth_denied'
      }

      return redirectTo(getErrorRedirectPath(errorCode, returnPath, admin))
    }
  },
}
