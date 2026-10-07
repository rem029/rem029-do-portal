'use server'

import crypto from 'crypto'
import {
  AuthenticationResult,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
  Configuration,
} from '@azure/msal-node'

import { User, UsersAccess } from '@/payload-types'
import { APIError, PayloadRequest } from 'payload'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

// const MICROSOFT_SCOPES = ['openid', 'profile', 'email']
const MICROSOFT_SCOPES = ['https://graph.microsoft.com/.default']
const DEFAULT_ACCESS_NAME = 'Default Non Admin Access'
const EMAIL_FROM = 'no-reply@dohaoasis.com'

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET_VALUE || '',
  },
}

export const getMsAuthCodeURL = async (callbackURL: string, state?: string): Promise<string> => {
  const msalClient = new ConfidentialClientApplication(msalConfig)
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: MICROSOFT_SCOPES,
    redirectUri: callbackURL,
    ...(state && { state }),
  }
  const url = await msalClient.getAuthCodeUrl(authCodeUrlParameters)
  return url
}

export const getMsTokenByCode = async (
  callbackURL: string,
  code: string,
): Promise<AuthenticationResult> => {
  try {
    const msalClient = new ConfidentialClientApplication(msalConfig)
    const tokenRequest = {
      code: code as string,
      scopes: MICROSOFT_SCOPES,
      redirectUri: callbackURL,
    }

    console.log('Requesting token from Microsoft with:', {
      redirectUri: callbackURL,
      scopes: MICROSOFT_SCOPES,
      clientId: msalConfig.auth.clientId,
      authority: msalConfig.auth.authority,
    })

    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest)
    return tokenResponse as AuthenticationResult
  } catch (error: any) {
    console.error('Error acquiring token from Microsoft:', {
      error: error.message,
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      subError: error.subError,
    })
    throw error
  }
}

export const extractUserFromToken = async (
  token: AuthenticationResult,
): Promise<{ email: string }> => {
  const { account, idTokenClaims } = token
  const email =
    (idTokenClaims as any)?.email || account?.username || (idTokenClaims as any)?.preferred_username

  console.log(`Microsoft OAuth token response:`)
  console.log(`account.username: ${account?.username}`)
  console.log(`(idTokenClaims as any)?.email: ${(idTokenClaims as any)?.email}`)
  console.log(
    `(idTokenClaims as any)?.preferred_username: ${(idTokenClaims as any)?.preferred_username}`,
  )
  console.log('idTokenClaims', idTokenClaims)

  return { email }
}

const generateHashedPassword = async (text: string): Promise<string> => {
  const randomLength = Math.floor(Math.random() * 5) + 12
  return crypto
    .createHash('sha256')
    .update(text + (process.env.PAYLOAD_SECRET || ''))
    .digest('hex')
    .substring(0, randomLength)
}

const getOrCreateUserAccess = async (
  req: PayloadRequest,
  accessName?: string,
): Promise<UsersAccess> => {
  const { payload } = req
  accessName = accessName ? accessName : DEFAULT_ACCESS_NAME

  const existingAccess = await payload.find({
    collection: 'users-access',
    where: { name: { equals: accessName } },
    overrideAccess: true,
    context: { skipAudit: true },
  })

  let access: UsersAccess

  if (existingAccess.docs.length > 0) {
    access = existingAccess.docs[0]
  } else {
    access = await payload.create({
      collection: 'users-access',
      data: { name: accessName },
      overrideAccess: true,
      context: { skipAudit: true },
    })
  }

  return access
}

export const createOrUpdateUserWithMsAuth = async (
  req: PayloadRequest,
  email: string,
): Promise<{ user: User; password: string }> => {
  const { payload } = req
  const { logger } = payload
  const password = await generateHashedPassword(email)
  let user: User
  let operation: 'update' | 'create' = 'create'

  logger.info(`Microsoft OAuth processing user with email: ${email}`)
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    showHiddenFields: true,
    depth: 0,
    overrideAccess: true,
    context: { skipAudit: true },
  })

  user = existingUsers.docs.length > 0 ? existingUsers.docs[0] : (null as any)

  // Check if user is disabled
  if (user && (user as any).disabled) {
    throw new APIError('Your account has been disabled. Please contact your administrator.', 401)
  }

  // Determine operator based on email domain
  let operatorId: string | undefined = undefined
  const emailLower = email.toLowerCase()
  let targetOperatorSlug = ''

  if (emailLower.includes('@dohaoasis.com')) {
    targetOperatorSlug = 'doha-oasis'
  } else if (emailLower.includes('printempsdoha.com')) {
    targetOperatorSlug = 'printemps'
  } else if (emailLower.includes('@dohaquest.com')) {
    targetOperatorSlug = 'doha-quests'
  }

  if (targetOperatorSlug) {
    const operatorDoc = await payload.find({
      collection: 'operators',
      where: { slug: { equals: targetOperatorSlug } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })
    if (operatorDoc.docs.length > 0) {
      operatorId = operatorDoc.docs[0].id
    }
  }

  if (user) {
    logger.info(`Microsoft OAuth updating password for user: ${email}`)
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        ...(operatorId ? { operator: operatorId } : {}),
      },
      overrideAccess: true,
      context: { skipAudit: true },
    })

    user = updatedUser
    operation = 'update'
  } else {
    // User does not exist, create new user with default access
    logger.info(`Microsoft OAuth creating new user access with user: ${email}`)
    const access: UsersAccess = await getOrCreateUserAccess(req, DEFAULT_ACCESS_NAME)

    logger.info(`Microsoft OAuth creating new user with user: ${email}`)
    user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        access: access.id,
        auth_method: 'microsoft',
        _verified: true,
        ...(operatorId ? { operator: operatorId } : {}),
      },
      overrideAccess: true,
      context: { skipAudit: true },
    })

    operation = 'create'
  }

  switch (operation) {
    case 'create':
      payload.logger.info(`User created successfully: ${user.email}`)
      break
    case 'update':
      payload.logger.info(`Existing User updated successfully: ${user.email}`)
      break
    default:
      payload.logger.warn(`Unexpected operation: ${operation} for user ${user.email}`)
      break
  }

  logger.info(`Microsoft OAuth sending email to user: ${email}`)
  await sendWelcomeEmail(req, user, password)
  return { user, password }
}

const sendWelcomeEmail = async (req: PayloadRequest, user: User, password: string) => {
  try {
    await req.payload.sendEmail({
      to: user.email,
      from: EMAIL_FROM,
      subject: 'Doha Oasis Admin Login Information (PV3)',
      text: `
            You have successfully logged in via Microsoft API.\n
            Your credentials are as follows:\n\n
            
            Email: ${user.email}\n
            Password: ${password}\n
            URL: ${BACKEND_URL_WITH_BASE}\n\n

            Logging via Microsoft changes your password by default. Please use Login with Microsoft to access your account.\n
            If you need to change your password, please use the Forgot Password feature.\n
            If you have any questions, please contact support.\n
            `,
      req,
    })
  } catch (error) {
    req.payload.logger.error(`Failed to send welcome email to ${user.email}`)
  }
}
