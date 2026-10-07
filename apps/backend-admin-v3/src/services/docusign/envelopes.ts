import docusign from 'docusign-esign'
import type { Payload } from 'payload'
import { resolveDocuSignUserId, isDocuSignAccountAdmin } from './users'
import { getTokenForDocuSignUser } from './auth'
import { DocuSignNotConfiguredError, getDocuSignConfig } from './config'
import { normalizeDohaEmail } from '@/utilities/docusign-email'

export class DocuSignNotActionableError extends Error {
  constructor(message = 'This envelope is not waiting for your signature') {
    super(message)
    this.name = 'DocuSignNotActionableError'
  }
}

export interface RecipientPayload {
  name: string
  email: string
  role: 'signer' | 'approver' | 'cc'
  routingOrder?: number | string
}

export interface EnvelopeViewSettings {
  startingScreen?: 'tagging' | 'prepare' | 'recipient' | string
  sendButtonAction?: 'send' | 'redirect' | string
  showEditRecipients?: 'true' | 'false' | string
}

export interface EnvelopeViewRequest {
  returnUrl: string
  viewAccess?: 'envelope' | 'recipient' | string
  settings?: EnvelopeViewSettings
}

export interface CreateDraftEnvelopeInput {
  senderEmail: string // used to resolve the DocuSign user + impersonation token
  documentBase64: string
  documentName: string
  fileExtension: string
  emailSubject: string
  recipients: RecipientPayload[]
  returnTo?: string
}

export interface CreateDraftEnvelopeResult {
  envelopeId: string
  senderViewUrl: string
}

export interface CreateSigningViewInput {
  signerEmail: string
  envelopeId: string
  returnTo?: string
}

/**
 * Checks whether an envelope has an actionable pending signature for the given email.
 * Returns true if a non-cc recipient matches email (normalized) with status 'sent' or 'delivered'.
 */
export function isAwaitingSignatureFrom(
  recipients: Array<{
    email?: string | null
    status?: string | null
    role?: string | null
    recipientType?: string | null
  }>,
  email?: string | null,
): boolean {
  const normalizedTarget = normalizeDohaEmail(email)
  if (!normalizedTarget || !Array.isArray(recipients)) return false

  return recipients.some((r) => {
    const isCc = r.role === 'cc' || r.recipientType === 'cc'
    if (isCc) return false
    const norm = normalizeDohaEmail(r.email)
    const status = (r.status || '').toLowerCase()
    return norm === normalizedTarget && (status === 'sent' || status === 'delivered')
  })
}

/**
 * Builds an impersonated DocuSign API client for a specific user ID.
 */
async function createImpersonatedApiClient(payload: Payload, docuSignUserId: string) {
  const tokenInfo = await getTokenForDocuSignUser(payload, docuSignUserId)
  const { oAuthBasePath } = await getDocuSignConfig(payload)

  const dsApiClient = new docusign.ApiClient()
  dsApiClient.setBasePath(tokenInfo.basePath)
  dsApiClient.setOAuthBasePath(oAuthBasePath)
  dsApiClient.addDefaultHeader('Authorization', `Bearer ${tokenInfo.accessToken}`)

  const envelopesApi = new docusign.EnvelopesApi(dsApiClient)

  return { envelopesApi, accountId: tokenInfo.accountId }
}

/**
 * Creates a draft DocuSign envelope with the provided document and recipients,
 * then generates an Embedded Sending sender view URL.
 */
export async function createDraftEnvelopeAndSenderView(
  payload: Payload,
  input: CreateDraftEnvelopeInput,
): Promise<CreateDraftEnvelopeResult> {
  const { senderEmail, documentBase64, documentName, fileExtension, emailSubject, recipients } = input

  const docuSignUserId = await resolveDocuSignUserId(payload, senderEmail)
  if (!docuSignUserId) {
    throw new Error(
      `No active DocuSign user account found for ${senderEmail}. Please ensure the user is registered in DocuSign.`,
    )
  }

  // Acquire impersonated DocuSign token (DocuSignConsentRequiredError will propagate to caller)
  const { envelopesApi, accountId } = await createImpersonatedApiClient(payload, docuSignUserId)

  const { returnUrl: baseReturnUrl } = await getDocuSignConfig(payload)
  if (!baseReturnUrl) {
    throw new Error('DocuSign Return URL is not configured in Settings > DocuSign')
  }

  // Recipient role mapping:
  // DocuSign eSignature API has Signer and CarbonCopy recipient types.
  // "approver" is modeled as a Signer without specific SignHere tabs, allowing them to review/approve without a wet signature.
  const signers: docusign.Signer[] = []
  const carbonCopies: docusign.CarbonCopy[] = []

  recipients.forEach((recipient, index) => {
    const recipientId = String(index + 1)
    const routingOrder = String(recipient.routingOrder ?? index + 1)

    if (recipient.role === 'signer' || recipient.role === 'approver') {
      signers.push({
        email: recipient.email.trim(),
        name: recipient.name.trim(),
        recipientId,
        routingOrder,
      })
    } else if (recipient.role === 'cc') {
      carbonCopies.push({
        email: recipient.email.trim(),
        name: recipient.name.trim(),
        recipientId,
        routingOrder,
      })
    }
  })

  const docusignRecipients: docusign.Recipients = {
    signers: signers.length > 0 ? signers : undefined,
    carbonCopies: carbonCopies.length > 0 ? carbonCopies : undefined,
  }

  const document: docusign.Document = {
    documentBase64,
    name: documentName,
    fileExtension,
    documentId: '1',
  }

  const envelopeDefinition: docusign.EnvelopeDefinition = {
    emailSubject,
    documents: [document],
    recipients: docusignRecipients,
    status: 'created', // Must be 'created' (draft), NOT 'sent'
  }

  const createdEnvelope = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition,
  })

  const envelopeId = createdEnvelope?.envelopeId
  if (!envelopeId) {
    throw new Error('DocuSign API createEnvelope did not return an envelope ID')
  }

  // Build the sender view return URL including envelopeId and optional returnTo
  const returnUrlObj = new URL(baseReturnUrl)
  returnUrlObj.searchParams.set('envelopeId', envelopeId)
  if (input.returnTo) {
    returnUrlObj.searchParams.set('returnTo', input.returnTo)
  }
  const returnUrl = returnUrlObj.toString()

  const viewRequest: EnvelopeViewRequest = {
    returnUrl,
    viewAccess: 'envelope',
    settings: {
      startingScreen: 'Tagger',
      sendButtonAction: 'send',
      showEditRecipients: 'false',
    },
  }

  const senderView = await envelopesApi.createSenderView(accountId, envelopeId, {
    envelopeViewRequest: viewRequest,
  })

  const senderViewUrl = senderView?.url
  if (!senderViewUrl) {
    throw new Error('DocuSign API createSenderView did not return a sender view URL')
  }

  return {
    envelopeId,
    senderViewUrl,
  }
}

export interface DocuSignRecipientStatus {
  email: string
  name: string
  status: string
  role?: string
  routingOrder?: number
}

export interface EnvelopeStatusResult {
  envelopeId: string
  status: string
  statusChangedDateTime?: string
  senderEmail?: string
  senderName?: string
  recipients: DocuSignRecipientStatus[]
}

export interface EnvelopeListItem {
  envelopeId: string
  documentName: string
  status: string
  statusChangedDateTime?: string
  senderEmail?: string
  senderName?: string
  recipients: Array<{ name: string; email: string; status: string; recipientType?: string }>
  createdDateTime?: string
}

export interface ListEnvelopesForUserOptions {
  scopeToEmail?: string
  fromDate: string // ISO date, derived from the 7d/1mo/3mo UI selection
  toDate?: string
  count?: number // page size, default 10 per agreed UX
  startPosition?: number
  folderTypes?: string
  status?: string
}

export interface ListEnvelopesResult {
  envelopes: EnvelopeListItem[]
  nextStartPosition?: number
  startPosition?: number
  endPosition?: number
  totalCount?: number
  resultSetSize?: number
  notDocuSignUser?: boolean
}

function mapRecipientsFromEnvelope(recipients?: docusign.Recipients): EnvelopeListItem['recipients'] {
  if (!recipients) return []
  const result: EnvelopeListItem['recipients'] = []

  if (Array.isArray(recipients.signers)) {
    for (const s of recipients.signers) {
      result.push({
        name: s.name || '',
        email: s.email || '',
        status: s.status || '',
        recipientType: 'signer',
      })
    }
  }
  if (Array.isArray(recipients.carbonCopies)) {
    for (const cc of recipients.carbonCopies) {
      result.push({
        name: cc.name || '',
        email: cc.email || '',
        status: cc.status || '',
        recipientType: 'cc',
      })
    }
  }
  if (Array.isArray(recipients.certifiedDeliveries)) {
    for (const cd of recipients.certifiedDeliveries) {
      result.push({
        name: cd.name || '',
        email: cd.email || '',
        status: cd.status || '',
        recipientType: 'approver',
      })
    }
  }

  return result
}

function mapEnvelopeToListItem(env: {
  envelopeId?: string
  emailSubject?: string
  status?: string
  statusChangedDateTime?: string
  deliveredDateTime?: string
  sentDateTime?: string
  createdDateTime?: string
  sender?: { email?: string; userName?: string }
  recipients?: docusign.Recipients
}): EnvelopeListItem {
  const status = (env.status || 'created').toLowerCase()
  const statusChangedDateTime =
    env.statusChangedDateTime ||
    env.deliveredDateTime ||
    env.sentDateTime ||
    env.createdDateTime ||
    undefined

  return {
    envelopeId: env.envelopeId || '',
    documentName: env.emailSubject || 'Untitled Document',
    status,
    statusChangedDateTime,
    senderEmail: env.sender?.email || undefined,
    senderName: env.sender?.userName || undefined,
    recipients: mapRecipientsFromEnvelope(env.recipients),
    createdDateTime: env.createdDateTime || undefined,
  }
}

function buildPaging(params: {
  totalSetSize?: number
  startPosition?: number
  endPosition?: number
  count?: number
}) {
  const { totalSetSize, startPosition = 0, endPosition, count = 10 } = params

  let nextStartPosition: number | undefined = undefined
  if (typeof totalSetSize === 'number' && typeof endPosition === 'number') {
    if (endPosition < totalSetSize - 1) {
      nextStartPosition = endPosition + 1
    }
  } else if (typeof totalSetSize === 'number' && typeof startPosition === 'number') {
    if (startPosition + count < totalSetSize) {
      nextStartPosition = startPosition + count
    }
  }

  return {
    nextStartPosition,
    startPosition,
    endPosition,
    totalCount: totalSetSize,
  }
}

/**
 * Lists envelopes sent by a specific user via DocuSign impersonation.
 * Using `folderTypes: 'sentitems,draft'` without userFilter returns all caller-sent envelopes incl. drafts.
 */
export async function listEnvelopesSentByUser(
  payload: Payload,
  senderEmail: string,
  opts: ListEnvelopesForUserOptions,
): Promise<ListEnvelopesResult> {
  const docuSignUserId = await resolveDocuSignUserId(payload, senderEmail)
  if (!docuSignUserId) {
    return {
      envelopes: [],
      totalCount: 0,
      resultSetSize: 0,
      startPosition: opts.startPosition ?? 0,
      notDocuSignUser: true,
    }
  }

  const { envelopesApi, accountId } = await createImpersonatedApiClient(payload, docuSignUserId)

  const listOpts: docusign.EnvelopesFilters = {
    folderTypes: opts.folderTypes ?? 'sentitems,draft',
    fromDate: opts.fromDate,
    toDate: opts.toDate,
    status: opts.status ?? 'created,sent,delivered,completed,declined,voided',
    include: 'recipients',
    orderBy: 'created',
    order: 'desc',
    count: String(opts.count ?? 10),
    startPosition: String(opts.startPosition ?? 0),
  }

  const response = (await envelopesApi.listStatusChanges(
    accountId,
    listOpts,
  )) as docusign.EnvelopesInformation

  const rawEnvelopes = Array.isArray(response?.envelopes) ? response.envelopes : []
  const envelopes: EnvelopeListItem[] = rawEnvelopes.map(mapEnvelopeToListItem)

  const totalSetSize = response?.totalSetSize ? parseInt(response.totalSetSize, 10) : undefined
  const startPosition = response?.startPosition
    ? parseInt(response.startPosition, 10)
    : (opts.startPosition ?? 0)
  const endPosition = response?.endPosition ? parseInt(response.endPosition, 10) : undefined
  const resultSetSize = response?.resultSetSize
    ? parseInt(response.resultSetSize, 10)
    : envelopes.length

  const paging = buildPaging({
    totalSetSize,
    startPosition,
    endPosition,
    count: opts.count ?? 10,
  })

  return {
    envelopes,
    resultSetSize,
    ...paging,
  }
}

/**
 * Lists envelopes awaiting this user's action/signature via DocuSign impersonation.
 */
export async function listEnvelopesForAction(
  payload: Payload,
  recipientEmail: string,
  opts: ListEnvelopesForUserOptions,
): Promise<ListEnvelopesResult> {
  const docuSignUserId = await resolveDocuSignUserId(payload, recipientEmail)
  if (!docuSignUserId) {
    return {
      envelopes: [],
      totalCount: 0,
      resultSetSize: 0,
      startPosition: opts.startPosition ?? 0,
      notDocuSignUser: true,
    }
  }

  const { envelopesApi, accountId } = await createImpersonatedApiClient(payload, docuSignUserId)

  // Not FoldersApi.search('awaiting_my_signature'): it only covers the Inbox, and DocuSign can
  // file received envelopes into other folders (e.g. a "Spam" folder, type 'normal').
  const response = (await envelopesApi.listStatusChanges(accountId, {
    folderTypes: 'inbox,normal',
    fromDate: opts.fromDate,
    toDate: opts.toDate,
    status: 'sent,delivered',
    include: 'recipients',
    orderBy: 'created',
    order: 'desc',
    count: '100',
  })) as docusign.EnvelopesInformation

  const actionable = (Array.isArray(response?.envelopes) ? response.envelopes : [])
    .map(mapEnvelopeToListItem)
    .filter((env) => isAwaitingSignatureFrom(env.recipients, recipientEmail))

  const startPosition = opts.startPosition ?? 0
  const count = opts.count ?? 10
  const envelopes = actionable.slice(startPosition, startPosition + count)

  return {
    envelopes,
    resultSetSize: envelopes.length,
    startPosition,
    endPosition: startPosition + envelopes.length - 1,
    totalCount: actionable.length,
    nextStartPosition: startPosition + count < actionable.length ? startPosition + count : undefined,
  }
}

/**
 * Helper to build an EnvelopesApi instance authenticated with the status reader account.
 */
async function createStatusReaderApiClient(payload: Payload) {
  const { oAuthBasePath, statusReaderUserId } = await getDocuSignConfig(payload)
  if (!statusReaderUserId) {
    throw new DocuSignNotConfiguredError('Status Reader User ID is not configured in Settings > DocuSign')
  }

  const tokenInfo = await getTokenForDocuSignUser(payload, statusReaderUserId)

  const dsApiClient = new docusign.ApiClient()
  dsApiClient.setBasePath(tokenInfo.basePath)
  dsApiClient.setOAuthBasePath(oAuthBasePath)
  dsApiClient.addDefaultHeader('Authorization', `Bearer ${tokenInfo.accessToken}`)

  const envelopesApi = new docusign.EnvelopesApi(dsApiClient)

  return { envelopesApi, accountId: tokenInfo.accountId }
}

/**
 * Lists envelopes account-wide from DocuSign using the reader account in a single call,
 * with recipients included and optional client-side sender filtering.
 */
export async function listEnvelopesForUser(
  payload: Payload,
  opts: ListEnvelopesForUserOptions,
): Promise<ListEnvelopesResult> {
  const { envelopesApi, accountId } = await createStatusReaderApiClient(payload)

  const listOpts: docusign.EnvelopesFilters = {
    fromDate: opts.fromDate,
    toDate: opts.toDate,
    // Note: DocuSign's email parameter is non-functional (verified in sandbox). We fetch account-wide
    // and filter by env.sender?.email client-side when scopeToEmail is provided.
    status: 'created,sent,delivered,completed,declined,voided',
    include: 'recipients',
    orderBy: 'created',
    order: 'desc',
    count: String(opts.count ?? 10),
    startPosition: String(opts.startPosition ?? 0),
  }

  const response = (await envelopesApi.listStatusChanges(
    accountId,
    listOpts,
  )) as docusign.EnvelopesInformation

  const rawEnvelopes = Array.isArray(response?.envelopes) ? response.envelopes : []
  const mapped: EnvelopeListItem[] = rawEnvelopes.map(mapEnvelopeToListItem)

  const envelopes = opts.scopeToEmail
    ? mapped.filter(
        (env) => env.senderEmail?.toLowerCase() === opts.scopeToEmail!.toLowerCase(),
      )
    : mapped

  const totalSetSize = response?.totalSetSize ? parseInt(response.totalSetSize, 10) : undefined
  const startPosition = response?.startPosition
    ? parseInt(response.startPosition, 10)
    : (opts.startPosition ?? 0)
  const endPosition = response?.endPosition ? parseInt(response.endPosition, 10) : undefined
  const resultSetSize = response?.resultSetSize
    ? parseInt(response.resultSetSize, 10)
    : rawEnvelopes.length

  const paging = buildPaging({
    totalSetSize,
    startPosition,
    endPosition,
    count: opts.count ?? 10,
  })

  return {
    envelopes,
    resultSetSize,
    ...paging,
  }
}

/**
 * Fetches the live status and recipient statuses of an envelope from DocuSign
 * using the fixed status reader account.
 */
export async function getEnvelopeStatus(
  payload: Payload,
  envelopeId: string,
): Promise<EnvelopeStatusResult> {
  if (!envelopeId || !envelopeId.trim()) {
    throw new Error('Envelope ID is required to fetch envelope status')
  }

  const cleanEnvelopeId = envelopeId.trim()
  const { envelopesApi, accountId } = await createStatusReaderApiClient(payload)

  const [envelope, recipientsResult] = await Promise.all([
    envelopesApi.getEnvelope(accountId, cleanEnvelopeId),
    envelopesApi.listRecipients(accountId, cleanEnvelopeId),
  ])

  const recipients: DocuSignRecipientStatus[] = []

  if (recipientsResult) {
    if (Array.isArray(recipientsResult.signers)) {
      for (const s of recipientsResult.signers) {
        recipients.push({
          email: s.email || '',
          name: s.name || '',
          status: s.status || '',
          role: 'signer',
          routingOrder: s.routingOrder ? parseInt(s.routingOrder, 10) : undefined,
        })
      }
    }
    if (Array.isArray(recipientsResult.carbonCopies)) {
      for (const cc of recipientsResult.carbonCopies) {
        recipients.push({
          email: cc.email || '',
          name: cc.name || '',
          status: cc.status || '',
          role: 'cc',
          routingOrder: cc.routingOrder ? parseInt(cc.routingOrder, 10) : undefined,
        })
      }
    }
    if (Array.isArray(recipientsResult.certifiedDeliveries)) {
      for (const cd of recipientsResult.certifiedDeliveries) {
        recipients.push({
          email: cd.email || '',
          name: cd.name || '',
          status: cd.status || '',
          role: 'approver',
          routingOrder: cd.routingOrder ? parseInt(cd.routingOrder, 10) : undefined,
        })
      }
    }
  }

  const status = (envelope?.status || 'created').toLowerCase()
  const statusChangedDateTime =
    envelope?.statusChangedDateTime ||
    envelope?.deliveredDateTime ||
    envelope?.sentDateTime ||
    envelope?.createdDateTime ||
    undefined

  return {
    envelopeId: cleanEnvelopeId,
    status,
    statusChangedDateTime,
    senderEmail: envelope?.sender?.email || undefined,
    senderName: envelope?.sender?.userName || undefined,
    recipients,
  }
}

/**
 * Checks if the given user is authorized to view an envelope's status.
 * Authorized if: caller is sender, OR caller is any recipient, OR caller is DocuSign account admin.
 */
export async function canUserViewEnvelope(
  payload: Payload,
  userEmail: string,
  envelopeStatus: EnvelopeStatusResult,
): Promise<boolean> {
  const normalized = normalizeDohaEmail(userEmail)
  if (!normalized) return false
  const sender = normalizeDohaEmail(envelopeStatus.senderEmail)
  if (sender && sender === normalized) return true
  const isRecipient = envelopeStatus.recipients.some(
    (r) => normalizeDohaEmail(r.email) === normalized,
  )
  if (isRecipient) return true
  return isDocuSignAccountAdmin(payload, normalized)
}

/**
 * Creates an Embedded Signing recipient view URL for a remote recipient.
 */
export async function createRecipientSigningView(
  payload: Payload,
  input: CreateSigningViewInput,
): Promise<{ signingUrl: string }> {
  const { signerEmail, envelopeId, returnTo } = input

  if (!envelopeId || !envelopeId.trim()) {
    throw new Error('Envelope ID is required')
  }
  const cleanEnvelopeId = envelopeId.trim()

  const docuSignUserId = await resolveDocuSignUserId(payload, signerEmail)
  if (!docuSignUserId) {
    throw new Error(
      `No active DocuSign user account found for ${signerEmail}. Please ensure the user is registered in DocuSign.`,
    )
  }

  // Acquire impersonated DocuSign token (DocuSignConsentRequiredError will propagate to caller)
  const { envelopesApi, accountId } = await createImpersonatedApiClient(payload, docuSignUserId)

  const { returnUrl: baseReturnUrl } = await getDocuSignConfig(payload)
  if (!baseReturnUrl) {
    throw new Error('DocuSign Return URL is not configured in Settings > DocuSign')
  }

  const recipientsResult = await envelopesApi.listRecipients(accountId, cleanEnvelopeId)

  const allSigners = [
    ...(Array.isArray(recipientsResult?.signers) ? recipientsResult.signers : []),
    ...(Array.isArray(recipientsResult?.inPersonSigners) ? recipientsResult.inPersonSigners : []),
  ]

  const normalizedSignerEmail = normalizeDohaEmail(signerEmail)
  const targetRecipient = allSigners.find((s) => {
    const norm = normalizeDohaEmail(s.email)
    const status = (s.status || '').toLowerCase()
    return norm === normalizedSignerEmail && (status === 'sent' || status === 'delivered')
  })

  if (!targetRecipient || !targetRecipient.recipientId) {
    throw new DocuSignNotActionableError()
  }

  // Return URL: take returnUrl and add envelopeId, flow=signing, and optional returnTo
  const returnUrlObj = new URL(baseReturnUrl)
  returnUrlObj.searchParams.set('envelopeId', cleanEnvelopeId)
  returnUrlObj.searchParams.set('flow', 'signing')
  if (returnTo) {
    returnUrlObj.searchParams.set('returnTo', returnTo)
  }
  const returnUrl = returnUrlObj.toString()

  const recipientViewRequest: docusign.RecipientViewRequest = {
    returnUrl,
    authenticationMethod: 'none',
    email: targetRecipient.email || signerEmail,
    userName: targetRecipient.name || '',
    recipientId: targetRecipient.recipientId,
  }

  const recipientView = await envelopesApi.createRecipientView(accountId, cleanEnvelopeId, {
    recipientViewRequest,
  })

  const signingUrl = recipientView?.url
  if (!signingUrl) {
    throw new Error('DocuSign API createRecipientView did not return a signing URL')
  }

  return { signingUrl }
}

