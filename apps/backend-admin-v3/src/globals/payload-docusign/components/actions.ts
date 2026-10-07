'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getTokenForDocuSignUser, DocuSignConsentRequiredError } from '@/services/docusign/auth'
import {
  createDraftEnvelopeAndSenderView,
  getEnvelopeStatus,
  listEnvelopesForUser,
  EnvelopeStatusResult,
} from '@/services/docusign/envelopes'
import { listDocuSignUsers, resolveDocuSignUserId } from '@/services/docusign/users'

export const handleTestDocuSignConnection = async (
  statusReaderUserId?: string,
): Promise<{
  success: boolean
  message: string
  response?: Record<string, unknown>
}> => {
  try {
    const payload = await getPayload({ config: configPromise })
    let targetUserId = statusReaderUserId?.trim()

    if (!targetUserId) {
      const settings = await payload.findGlobal({
        slug: 'payload-docusign',
        depth: 0,
        overrideAccess: true,
      })
      targetUserId = settings?.status_reader_user_id?.trim()
    }

    if (!targetUserId) {
      return {
        success: false,
        message:
          'Status Reader User ID is not configured. Please enter or save a Status Reader User ID before testing.',
      }
    }

    const tokenInfo = await getTokenForDocuSignUser(payload, targetUserId)

    return {
      success: true,
      message: 'Successfully connected to DocuSign.',
      response: {
        accountId: tokenInfo.accountId,
        basePath: tokenInfo.basePath,
        expiresAt: new Date(tokenInfo.expiresAt).toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred while connecting to DocuSign',
    }
  }
}

export async function handleListDocuSignUsers(): Promise<{
  success: boolean
  users?: { email: string; userName?: string }[]
  message?: string
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const users = await listDocuSignUsers(payload)
    return {
      success: true,
      users: users.map((u) => ({ email: u.email, userName: u.userName })),
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Failed to list DocuSign users',
    }
  }
}

export async function handleTestCreateEnvelope(input: {
  senderEmail: string
  recipientEmail: string
  recipientName?: string
}): Promise<{
  success: boolean
  message: string
  response?: { envelopeId: string; senderViewUrl: string }
  authorizationUrl?: string
}> {
  try {
    const senderEmail = input?.senderEmail?.trim()
    const recipientEmail = input?.recipientEmail?.trim()
    const recipientName = input?.recipientName?.trim() || recipientEmail

    if (!senderEmail) {
      return {
        success: false,
        message: 'Sender Email is required.',
      }
    }

    if (!recipientEmail) {
      return {
        success: false,
        message: 'Recipient Email is required.',
      }
    }

    // Minimal valid single-page PDF for test envelope creation
    const minimalPdfBase64 = Buffer.from(
      '%PDF-1.4\n' +
        '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
        '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
        'xref\n' +
        '0 4\n' +
        '0000000000 65535 f \n' +
        '0000000010 00000 n \n' +
        '0000000053 00000 n \n' +
        '0000000102 00000 n \n' +
        'trailer<</Size 4/Root 1 0 R>>\n' +
        'startxref\n' +
        '178\n' +
        '%%EOF\n',
    ).toString('base64')

    const payload = await getPayload({ config: configPromise })
    const result = await createDraftEnvelopeAndSenderView(payload, {
      senderEmail,
      documentBase64: minimalPdfBase64,
      documentName: 'DocuSign_Test_Document.pdf',
      fileExtension: 'pdf',
      emailSubject: 'DocuSign Smoke Test Envelope',
      recipients: [
        {
          name: recipientName,
          email: recipientEmail,
          role: 'signer',
          routingOrder: 1,
        },
      ],
    })

    return {
      success: true,
      message: 'Envelope created successfully.',
      response: {
        envelopeId: result.envelopeId,
        senderViewUrl: result.senderViewUrl,
      },
    }
  } catch (error: unknown) {
    if (error instanceof DocuSignConsentRequiredError) {
      return {
        success: false,
        message: 'Consent required for this DocuSign user account.',
        authorizationUrl: error.authorizationUrl,
      }
    }

    return {
      success: false,
      message: (error as Error)?.message || 'Unknown error occurred while creating test envelope',
    }
  }
}

export async function handleGetRecentEnvelopeId(): Promise<{
  envelopeId?: string
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await listEnvelopesForUser(payload, {
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      count: 1,
    })
    return {
      envelopeId: res.envelopes[0]?.envelopeId || undefined,
    }
  } catch {
    return {}
  }
}

export async function handleTestEnvelopeStatus(envelopeId: string): Promise<{
  success: boolean
  message: string
  response?: EnvelopeStatusResult
}> {
  try {
    const cleanEnvelopeId = envelopeId?.trim()
    if (!cleanEnvelopeId) {
      return {
        success: false,
        message: 'Envelope ID is required.',
      }
    }

    const payload = await getPayload({ config: configPromise })
    const statusResult = await getEnvelopeStatus(payload, cleanEnvelopeId)

    return {
      success: true,
      message: 'Successfully retrieved envelope status.',
      response: statusResult,
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || 'Failed to retrieve envelope status',
    }
  }
}
