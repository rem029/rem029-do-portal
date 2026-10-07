'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { hasUserAccess, isCollectionSuperUser } from '@/utilities/access'
import {
  createDraftEnvelopeAndSenderView,
  createRecipientSigningView,
  isAwaitingSignatureFrom,
  getEnvelopeStatus,
  canUserViewEnvelope,
} from '@/services/docusign/envelopes'
import { listEnvelopesForTab, ListingTab } from '@/services/docusign/listing'
import {
  getDocuSignWebBaseUrl,
  buildDocuSignWebUrl,
  DocuSignNotConfiguredError,
} from '@/services/docusign/config'
import { validateEnvelopeMetadata } from '@/services/docusign/validation'
import { DocuSignConsentRequiredError } from '@/services/docusign/auth'
import { listDocuSignUsers } from '@/services/docusign/users'
import { normalizeDohaEmail } from '@/utilities/docusign-email'
import { getDocuSignFriendlyErrorMessage, type DocuSignApiErrorShape } from '@/endpoints/docusign/errors'

// Access check runs server-side: `users.access` is field-restricted to users-access super
// users, so the client-side useAuth user never has it for regular users.
export async function getDocuSignDashboardAccessAction(): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user: authUser } = await payload.auth({ headers: await headers() })
    if (!authUser) return false

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })

    return (
      user.super_user === true ||
      isCollectionSuperUser(user, 'payload-docusign') ||
      hasUserAccess(user, 'payload-docusign', 'access') ||
      hasUserAccess(user, 'payload-docusign', 'create') ||
      hasUserAccess(user, 'payload-docusign', 'read')
    )
  } catch {
    return false
  }
}

export interface DashboardRecipient {
  name: string
  email: string
  role?: string
  status?: string
}

export interface DashboardEnvelopeItem {
  id: string
  docusignEnvelopeId: string
  docusignUrl: string
  documentName: string
  emailSubject?: string | null
  status: string
  senderName?: string | null
  senderEmail?: string | null
  recipientCount: number
  recipients: DashboardRecipient[]
  canSign: boolean
  createdAt?: string | null
  statusChangedDateTime?: string | null
}

export interface FetchDashboardEnvelopesOptions {
  tab?: 'sent' | 'action' | 'all'
  dateWindow?: '7d' | '1mo' | '3mo'
  count?: number
  startPosition?: number
}

export interface FetchDashboardEnvelopesResponse {
  success: boolean
  error?: string
  docs: DashboardEnvelopeItem[]
  isDocuSignAdmin: boolean
  notDocuSignUser?: boolean
  consentRequired?: boolean
  authorizationUrl?: string
  nextStartPosition?: number
  startPosition?: number
  endPosition?: number
  totalCount?: number
  resultSetSize?: number
}

export async function fetchDashboardEnvelopes(
  options: FetchDashboardEnvelopesOptions = {},
): Promise<FetchDashboardEnvelopesResponse> {
  try {
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      throw new Error('Not authenticated')
    }

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isSuperUser =
      user.super_user === true || isCollectionSuperUser(user, 'payload-docusign')
    const hasAccess =
      isSuperUser ||
      hasUserAccess(user, 'payload-docusign', 'access') ||
      hasUserAccess(user, 'payload-docusign', 'create') ||
      hasUserAccess(user, 'payload-docusign', 'read')

    if (!hasAccess) {
      return {
        success: true,
        docs: [],
        isDocuSignAdmin: false,
      }
    }

    // Determine date range for fromDate
    const dateWindow = options.dateWindow || '7d'
    const now = Date.now()
    let fromDate: string

    if (dateWindow === '1mo') {
      fromDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (dateWindow === '3mo') {
      fromDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      // Default 7 days
      fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Resolve caller email for DocuSign checks
    const normalizedUserEmail = normalizeDohaEmail(user.email)
    const count = options.count ?? 10
    const startPosition = options.startPosition ?? 0

    // Map dashboard tab identifiers to listing tabs:
    // Dashboard 'sent' includes drafts (sent_with_drafts); 'action' maps to 'inbox'; 'all' maps to 'all'
    const tabMapping: Record<'sent' | 'action' | 'all', ListingTab> = {
      sent: 'sent_with_drafts',
      action: 'inbox',
      all: 'all',
    }
    const requestedTab = options.tab || 'sent'
    const listingTab = tabMapping[requestedTab] || 'sent_with_drafts'

    const listResult = await listEnvelopesForTab(payload, normalizedUserEmail, {
      tab: listingTab,
      fromDate,
      count,
      startPosition,
    })

    if (listResult.notDocuSignUser) {
      return {
        success: true,
        docs: [],
        isDocuSignAdmin: listResult.isDocuSignAdmin,
        notDocuSignUser: true,
        totalCount: 0,
      }
    }

    const docusignWebBase = await getDocuSignWebBaseUrl(payload)

    const docs: DashboardEnvelopeItem[] = listResult.envelopes.map((env) => ({
      id: env.envelopeId,
      docusignEnvelopeId: env.envelopeId,
      docusignUrl: `${docusignWebBase}/${env.envelopeId}`,
      documentName: env.documentName,
      emailSubject: env.documentName,
      status: env.status,
      senderName: env.senderName || null,
      senderEmail: env.senderEmail || null,
      recipientCount: env.recipients.length,
      canSign: isAwaitingSignatureFrom(env.recipients, user.email),
      recipients: env.recipients.map((r) => ({
        name: r.name,
        email: r.email,
        role: r.recipientType,
        status: r.status,
      })),
      createdAt: env.createdDateTime || null,
      statusChangedDateTime: env.statusChangedDateTime || null,
    }))

    return {
      success: true,
      docs,
      isDocuSignAdmin: listResult.isDocuSignAdmin,
      nextStartPosition: listResult.nextStartPosition,
      startPosition: listResult.startPosition,
      endPosition: listResult.endPosition,
      totalCount: listResult.totalCount,
      resultSetSize: listResult.resultSetSize,
    }
  } catch (err) {
    if (err instanceof DocuSignConsentRequiredError) {
      return {
        success: false,
        error: 'DocuSign consent required',
        consentRequired: true,
        authorizationUrl: err.authorizationUrl,
        docs: [],
        isDocuSignAdmin: false,
      }
    }
    if (err instanceof DocuSignNotConfiguredError) {
      return {
        success: true,
        docs: [],
        isDocuSignAdmin: false,
        notDocuSignUser: true,
        totalCount: 0,
      }
    }
    console.error('Error in fetchDashboardEnvelopes:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      docs: [],
      isDocuSignAdmin: false,
    }
  }
}

export interface EnvelopeRecipientLiveStatus {
  name: string
  email: string
  role?: string
  status: string
  routingOrder?: number
}

export interface EnvelopeLiveStatusData {
  id: string
  docusignEnvelopeId: string
  documentName: string
  emailSubject?: string | null
  status: string
  statusChangedDateTime?: string
  senderEmail?: string
  senderName?: string
  docusignUrl?: string
  recipients: EnvelopeRecipientLiveStatus[]
}

export interface FetchEnvelopeLiveStatusResponse {
  success: boolean
  message?: string
  envelope?: EnvelopeLiveStatusData
}

export async function fetchEnvelopeLiveStatusAction(
  envelopeId: string,
): Promise<FetchEnvelopeLiveStatusResponse> {
  try {
    const cleanEnvelopeId = envelopeId?.trim()
    if (!cleanEnvelopeId) {
      return { success: false, message: 'Envelope ID is required' }
    }

    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isSuperUser =
      user.super_user === true || isCollectionSuperUser(user, 'payload-docusign')
    const hasAccess =
      isSuperUser ||
      hasUserAccess(user, 'payload-docusign', 'access') ||
      hasUserAccess(user, 'payload-docusign', 'read') ||
      hasUserAccess(user, 'payload-docusign', 'create')

    if (!hasAccess) {
      return { success: false, message: 'Forbidden: Access denied' }
    }

    // Fetch live status directly from DocuSign using reader account
    const statusResult = await getEnvelopeStatus(payload, cleanEnvelopeId)

    // Shared envelope view-access check: sender OR any recipient OR DocuSign account admin
    const isAuthorized = await canUserViewEnvelope(payload, user.email, statusResult)

    if (!isAuthorized) {
      return {
        success: false,
        message: 'Forbidden: You do not have permission to view this envelope',
      }
    }

    const docusignUrl = await buildDocuSignWebUrl(payload, cleanEnvelopeId)

    return {
      success: true,
      envelope: {
        id: cleanEnvelopeId,
        docusignEnvelopeId: cleanEnvelopeId,
        documentName: 'DocuSign Envelope',
        status: statusResult.status,
        statusChangedDateTime: statusResult.statusChangedDateTime,
        senderEmail: statusResult.senderEmail,
        senderName: statusResult.senderName,
        docusignUrl,
        recipients: statusResult.recipients.map((r) => ({
          name: r.name,
          email: r.email,
          role: r.role,
          status: r.status,
          routingOrder: r.routingOrder,
        })),
      },
    }
  } catch (err) {
    if (err instanceof DocuSignConsentRequiredError) {
      return {
        success: false,
        message:
          'DocuSign status reader account requires one-time consent in Settings > DocuSign.',
      }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error fetching envelope status',
    }
  }
}

export async function createDashboardEnvelopeAction(formData: FormData): Promise<{
  success: boolean
  envelopeId?: string
  senderViewUrl?: string
  authorizationUrl?: string
  consentRequired?: boolean
  message?: string
}> {
  let callerEmailForError: string | undefined
  try {
    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })
    callerEmailForError = user?.email ?? undefined

    if (!user || !user.email) {
      return { success: false, message: 'User profile with valid email not found' }
    }

    if (!hasUserAccess(user, 'payload-docusign', 'access')) {
      return {
        success: false,
        message: 'Forbidden: You do not have permission to access DocuSign APIs',
      }
    }

    const file = formData.get('file')
    const metadataStr = formData.get('metadata')

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return { success: false, message: 'Missing or empty document file' }
    }

    if (!metadataStr || typeof metadataStr !== 'string') {
      return { success: false, message: 'Missing or invalid metadata' }
    }

    let parsedMetadata: unknown
    try {
      parsedMetadata = JSON.parse(metadataStr)
    } catch {
      return { success: false, message: 'Failed to parse metadata JSON' }
    }

    const validation = validateEnvelopeMetadata(parsedMetadata)
    if (!validation.ok) {
      return { success: false, message: validation.error }
    }

    const metadata = validation.data
    const fileBytes = Buffer.from(await file.arrayBuffer())
    const documentBase64 = fileBytes.toString('base64')
    const fileName = (file instanceof File ? file.name : null) || metadata.documentName || 'document.pdf'
    const fileExtension = fileName.split('.').pop() || 'pdf'
    const documentName = metadata.documentName || fileName
    const emailSubject = metadata.emailSubject || `Please sign ${documentName}`

    const senderEmail = normalizeDohaEmail(user.email)

    const result = await createDraftEnvelopeAndSenderView(payload, {
      senderEmail,
      documentBase64,
      documentName,
      fileExtension,
      emailSubject,
      recipients: metadata.recipients,
    })

    return {
      success: true,
      envelopeId: result.envelopeId,
      senderViewUrl: result.senderViewUrl,
    }
  } catch (err: unknown) {
    if (err instanceof DocuSignConsentRequiredError) {
      return {
        success: false,
        consentRequired: true,
        authorizationUrl: err.authorizationUrl,
        message: 'Consent required for DocuSign user account.',
      }
    }

    const message = getDocuSignFriendlyErrorMessage(err, callerEmailForError)
    const response = (err as DocuSignApiErrorShape).response
    console.error(
      `createDashboardEnvelopeAction failed: ${message} | responseBody=${JSON.stringify(response?.body ?? response?.data ?? response?.text ?? null)}`,
    )

    return {
      success: false,
      message,
    }
  }
}

export async function createSigningViewAction(envelopeId: string): Promise<{
  success: boolean
  signingUrl?: string
  authorizationUrl?: string
  consentRequired?: boolean
  message?: string
}> {
  let callerEmailForError: string | undefined
  try {
    const cleanEnvelopeId = envelopeId?.trim()
    if (!cleanEnvelopeId) {
      return { success: false, message: 'Envelope ID is required' }
    }

    const payload = await getPayload({ config: configPromise })
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      return { success: false, message: 'Not authenticated' }
    }

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })
    callerEmailForError = user?.email ?? undefined

    if (!user || !user.email) {
      return { success: false, message: 'User profile with valid email not found' }
    }

    const isSuperUser =
      user.super_user === true || isCollectionSuperUser(user, 'payload-docusign')
    const hasAccess =
      isSuperUser ||
      hasUserAccess(user, 'payload-docusign', 'access') ||
      hasUserAccess(user, 'payload-docusign', 'create') ||
      hasUserAccess(user, 'payload-docusign', 'read')

    if (!hasAccess) {
      return {
        success: false,
        message: 'Forbidden: You do not have permission to access DocuSign APIs',
      }
    }

    const signerEmail = normalizeDohaEmail(user.email)

    const result = await createRecipientSigningView(payload, {
      signerEmail,
      envelopeId: cleanEnvelopeId,
    })

    return {
      success: true,
      signingUrl: result.signingUrl,
    }
  } catch (err: unknown) {
    if (err instanceof DocuSignConsentRequiredError) {
      return {
        success: false,
        consentRequired: true,
        authorizationUrl: err.authorizationUrl,
        message: 'Consent required for DocuSign user account.',
      }
    }

    const message = getDocuSignFriendlyErrorMessage(err, callerEmailForError)
    console.error(`createSigningViewAction failed: ${message}`)

    return {
      success: false,
      message,
    }
  }
}

export async function fetchDocuSignSenderSuggestions(): Promise<{
  users: { email: string; userName?: string }[]
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user: authUser } = await payload.auth({ headers: await headers() })
    if (!authUser) return { users: [] }

    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })
    if (!hasUserAccess(user, 'payload-docusign', 'access')) return { users: [] }

    const users = await listDocuSignUsers(payload)
    return {
      users: users.map((u) => ({ email: u.email, userName: u.userName })),
    }
  } catch {
    return { users: [] }
  }
}
