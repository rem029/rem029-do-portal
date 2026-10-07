import type { Endpoint } from 'payload'
import { buildCorsHeaders, getAllowedOrigins, isOriginAllowed } from '@/utilities/cors'
import { resolveDocuSignCaller } from '@/utilities/docusign-auth'
import {
  createDraftEnvelopeAndSenderView,
  RecipientPayload,
} from '@/services/docusign/envelopes'
import { validateEnvelopeMetadata } from '@/services/docusign/validation'
import { formatDocuSignEndpointError } from './errors'

const MAX_DOCUSIGN_FILE_SIZE = 25 * 1024 * 1024 // 25 MB DocuSign limit

export interface EnvelopeMetadataPayload {
  documentName?: string
  emailSubject?: string
  recipients: RecipientPayload[]
}

export const docusignCreateEnvelopeEndpoint: Endpoint = {
  path: '/docusign/envelopes',
  method: 'post',
  handler: async (req) => {
    const { logger } = req.payload

    const requestOrigin = req.headers.get('Origin') || req.headers.get('origin')
    const allowedOrigins = await getAllowedOrigins(req.payload)
    const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins, 'POST, OPTIONS')

    if (requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
      return Response.json(
        { message: 'Origin not allowed' },
        { status: 403, headers: corsHeaders },
      )
    }

    try {
      const resolved = await resolveDocuSignCaller(req)
      if (!resolved.ok) {
        return Response.json(
          { message: resolved.message },
          { status: resolved.status, headers: corsHeaders },
        )
      }

      const { targetEmail } = resolved.caller

      if (!req.formData) {
        logger.error('at /docusign/envelopes: req.formData is unavailable')
        return Response.json(
          { message: 'Multipart form data is not supported on this request' },
          { status: 400, headers: corsHeaders },
        )
      }

      // Parse multipart form body
      let formData: FormData
      try {
        formData = await req.formData()
      } catch (err) {
        logger.warn(`Failed to parse multipart form data: ${(err as Error)?.message}`)
        return Response.json(
          { message: 'Invalid multipart form data' },
          { status: 400, headers: corsHeaders },
        )
      }

      const file = formData.get('file')
      const metadataStr = formData.get('metadata')
      const rawReturnTo = formData.get('returnTo')

      if (!file || !(file instanceof Blob) || file.size === 0) {
        return Response.json(
          { message: 'Missing or empty document file in form data' },
          { status: 400, headers: corsHeaders },
        )
      }

      if (file.size > MAX_DOCUSIGN_FILE_SIZE) {
        return Response.json(
          { message: 'File size exceeds 25 MB limit' },
          { status: 413, headers: corsHeaders },
        )
      }

      let returnTo: string | undefined = undefined
      if (rawReturnTo && typeof rawReturnTo === 'string' && rawReturnTo.trim()) {
        const trimmedReturnTo = rawReturnTo.trim()
        let returnToOrigin: string
        try {
          const parsedUrl = new URL(trimmedReturnTo)
          returnToOrigin = parsedUrl.origin
        } catch {
          return Response.json(
            { message: 'Invalid returnTo URL format' },
            { status: 400, headers: corsHeaders },
          )
        }

        if (!isOriginAllowed(returnToOrigin, allowedOrigins)) {
          return Response.json(
            { message: 'returnTo origin is not allowed' },
            { status: 400, headers: corsHeaders },
          )
        }
        returnTo = trimmedReturnTo
      }

      if (!metadataStr || typeof metadataStr !== 'string') {
        return Response.json(
          { message: 'Missing or invalid metadata JSON in form data' },
          { status: 400, headers: corsHeaders },
        )
      }

      let parsedMetadata: unknown
      try {
        parsedMetadata = JSON.parse(metadataStr)
      } catch {
        return Response.json(
          { message: 'Failed to parse metadata JSON' },
          { status: 400, headers: corsHeaders },
        )
      }

      const validation = validateEnvelopeMetadata(parsedMetadata)
      if (!validation.ok) {
        return Response.json(
          { message: validation.error },
          { status: 400, headers: corsHeaders },
        )
      }

      const metadata = validation.data
      const fileBytes = Buffer.from(await file.arrayBuffer())
      const documentBase64 = fileBytes.toString('base64')
      const fileName = (file instanceof File ? file.name : null) || metadata.documentName || 'document.pdf'
      const fileExtension = fileName.split('.').pop() || 'pdf'
      const documentName = metadata.documentName || fileName
      const emailSubject = metadata.emailSubject || `Please sign ${documentName}`

      try {
        const result = await createDraftEnvelopeAndSenderView(req.payload, {
          senderEmail: targetEmail,
          documentBase64,
          documentName,
          fileExtension,
          emailSubject,
          recipients: metadata.recipients,
          returnTo,
        })

        return Response.json(
          {
            envelopeId: result.envelopeId,
            senderViewUrl: result.senderViewUrl,
          },
          { status: 200, headers: corsHeaders },
        )
      } catch (err: unknown) {
        return formatDocuSignEndpointError(err, corsHeaders, targetEmail)
      }
    } catch (err: unknown) {
      logger.error(`Unexpected error in /docusign/envelopes endpoint: ${(err as Error)?.message || 'Unknown'}`)
      return Response.json(
        { message: (err as Error)?.message || 'Internal Server Error' },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
