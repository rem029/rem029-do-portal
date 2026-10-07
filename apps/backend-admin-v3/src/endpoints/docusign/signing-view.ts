import type { Endpoint } from 'payload'
import { buildCorsHeaders, getAllowedOrigins, isOriginAllowed } from '@/utilities/cors'
import { resolveDocuSignCaller } from '@/utilities/docusign-auth'
import { createRecipientSigningView } from '@/services/docusign/envelopes'
import { formatDocuSignEndpointError } from './errors'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const docusignSigningViewEndpoint: Endpoint = {
  path: '/docusign/envelopes/:envelopeId/signing-view',
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
      const envelopeId =
        (req.routeParams?.envelopeId as string | undefined) ||
        (typeof req.url === 'string'
          ? req.url.match(/\/docusign\/envelopes\/([^/?#]+)\/signing-view/)?.[1]
          : undefined)

      if (!envelopeId) {
        return Response.json(
          { message: 'Envelope ID is required' },
          { status: 400, headers: corsHeaders },
        )
      }

      if (!UUID_REGEX.test(envelopeId)) {
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

      let returnTo: string | undefined = undefined
      if (req.json) {
        try {
          const body = (await req.json()) as { returnTo?: unknown }
          if (body && typeof body === 'object') {
            const rawReturnTo = body.returnTo
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
          }
        } catch {
          // Empty or non-JSON body is tolerated
        }
      }

      try {
        const result = await createRecipientSigningView(req.payload, {
          signerEmail: targetEmail,
          envelopeId,
          returnTo,
        })

        return Response.json(
          {
            envelopeId,
            signingUrl: result.signingUrl,
          },
          { status: 200, headers: corsHeaders },
        )
      } catch (err: unknown) {
        return formatDocuSignEndpointError(err, corsHeaders, targetEmail, envelopeId)
      }
    } catch (err: unknown) {
      logger.error(
        `Unexpected error in /docusign/envelopes/:id/signing-view endpoint: ${(err as Error)?.message || 'Unknown'}`,
      )
      return Response.json(
        { message: (err as Error)?.message || 'Internal Server Error' },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
