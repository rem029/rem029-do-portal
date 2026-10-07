import type { Endpoint } from 'payload'
import { buildCorsHeaders, getAllowedOrigins, isOriginAllowed } from '@/utilities/cors'
import { resolveDocuSignCaller } from '@/utilities/docusign-auth'
import {
  getEnvelopeStatus,
  canUserViewEnvelope,
  EnvelopeStatusResult,
} from '@/services/docusign/envelopes'
import { getDocuSignWebBaseUrl } from '@/services/docusign/config'
import { formatDocuSignEndpointError } from './errors'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const docusignEnvelopeStatusEndpoint: Endpoint = {
  path: '/docusign/envelopes/:envelopeId/status',
  method: 'get',
  handler: async (req) => {
    const { logger } = req.payload

    const requestOrigin = req.headers.get('Origin') || req.headers.get('origin')
    const allowedOrigins = await getAllowedOrigins(req.payload)
    const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins, 'GET, OPTIONS')

    if (requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
      return Response.json(
        { message: 'Origin not allowed' },
        { status: 403, headers: corsHeaders },
      )
    }

    try {
      const envelopeId =
        (req.routeParams?.envelopeId as string | undefined) ||
        (typeof req.url === 'string'
          ? req.url.match(/\/docusign\/envelopes\/([^/?#]+)\/status/)?.[1]
          : undefined)

      if (!envelopeId || !UUID_REGEX.test(envelopeId)) {
        return Response.json(
          { message: 'A valid envelope ID is required' },
          { status: 400, headers: corsHeaders },
        )
      }

      const resolved = await resolveDocuSignCaller(req)
      if (!resolved.ok) {
        return Response.json(
          { message: resolved.message },
          { status: resolved.status, headers: corsHeaders },
        )
      }

      const { targetEmail } = resolved.caller

      // Fetch live status directly from DocuSign using reader account
      let statusResult: EnvelopeStatusResult
      try {
        statusResult = await getEnvelopeStatus(req.payload, envelopeId)
      } catch (err: unknown) {
        return formatDocuSignEndpointError(err, corsHeaders, targetEmail, envelopeId)
      }

      // Shared envelope view-access check: sender OR any recipient OR DocuSign account admin
      const isAuthorized = await canUserViewEnvelope(req.payload, targetEmail, statusResult)

      if (!isAuthorized) {
        logger.warn(
          `at /docusign/envelopes/:id/status: Forbidden - user ${targetEmail} is not authorized for envelope ${envelopeId}`,
        )
        return Response.json(
          { message: 'Forbidden: You do not have permission to view this envelope' },
          { status: 403, headers: corsHeaders },
        )
      }

      const webBase = await getDocuSignWebBaseUrl(req.payload)
      const docusignUrl = `${webBase}/${statusResult.envelopeId}`

      return Response.json(
        {
          envelopeId: statusResult.envelopeId,
          status: statusResult.status,
          statusChangedDateTime: statusResult.statusChangedDateTime || '',
          senderName: statusResult.senderName || '',
          senderEmail: statusResult.senderEmail || '',
          docusignUrl,
          recipients: statusResult.recipients.map((r) => ({
            name: r.name,
            email: r.email,
            status: r.status,
            role: r.role,
            routingOrder: r.routingOrder,
          })),
        },
        { status: 200, headers: corsHeaders },
      )
    } catch (err: unknown) {
      logger.error(
        `Unexpected error in /docusign/envelopes/:id/status endpoint: ${(err as Error)?.message || 'Unknown'}`,
      )
      return Response.json(
        { message: (err as Error)?.message || 'Internal Server Error' },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
