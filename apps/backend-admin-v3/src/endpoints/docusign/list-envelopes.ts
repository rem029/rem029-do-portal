import type { Endpoint } from 'payload'
import { buildCorsHeaders, getAllowedOrigins, isOriginAllowed } from '@/utilities/cors'
import { resolveDocuSignCaller } from '@/utilities/docusign-auth'
import { listEnvelopesForTab, ListingTab } from '@/services/docusign/listing'
import { isAwaitingSignatureFrom } from '@/services/docusign/envelopes'
import { getDocuSignWebBaseUrl } from '@/services/docusign/config'
import { formatDocuSignEndpointError } from './errors'

const VALID_TABS: ListingTab[] = ['inbox', 'sent', 'draft', 'all']
const VALID_WINDOWS = ['7d', '1mo', '3mo'] as const
type DateWindow = (typeof VALID_WINDOWS)[number]

export const docusignListEnvelopesEndpoint: Endpoint = {
  path: '/docusign/envelopes',
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
      const requestUrl = new URL(req.url || '', 'http://localhost')

      const rawTab = requestUrl.searchParams.get('tab') || 'inbox'
      const tab = rawTab.toLowerCase() as ListingTab
      if (!VALID_TABS.includes(tab)) {
        return Response.json(
          {
            message: `Invalid tab parameter "${rawTab}". Must be one of: inbox, sent, draft, all`,
          },
          { status: 400, headers: corsHeaders },
        )
      }

      const rawWindow = requestUrl.searchParams.get('window') || '1mo'
      const windowParam = rawWindow.toLowerCase() as DateWindow
      if (!VALID_WINDOWS.includes(windowParam)) {
        return Response.json(
          {
            message: `Invalid window parameter "${rawWindow}". Must be one of: 7d, 1mo, 3mo`,
          },
          { status: 400, headers: corsHeaders },
        )
      }

      const rawCount = requestUrl.searchParams.get('count') || '10'
      const count = parseInt(rawCount, 10)
      if (isNaN(count) || count < 1 || count > 50 || String(count) !== rawCount.trim()) {
        return Response.json(
          { message: `Invalid count parameter "${rawCount}". Must be an integer between 1 and 50` },
          { status: 400, headers: corsHeaders },
        )
      }

      const rawStart = requestUrl.searchParams.get('start') || '0'
      const start = parseInt(rawStart, 10)
      if (isNaN(start) || start < 0 || String(start) !== rawStart.trim()) {
        return Response.json(
          { message: `Invalid start parameter "${rawStart}". Must be an integer greater than or equal to 0` },
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

      const now = Date.now()
      let fromDate: string
      if (windowParam === '7d') {
        fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (windowParam === '3mo') {
        fromDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()
      } else {
        fromDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      let listResult
      try {
        listResult = await listEnvelopesForTab(req.payload, targetEmail, {
          tab,
          fromDate,
          count,
          startPosition: start,
        })
      } catch (err: unknown) {
        return formatDocuSignEndpointError(err, corsHeaders, targetEmail)
      }

      if (listResult.notDocuSignUser) {
        return Response.json(
          {
            items: [],
            paging: {
              start,
              count,
              total: 0,
              nextStart: null,
            },
            isDocuSignAdmin: listResult.isDocuSignAdmin,
            notDocuSignUser: true,
          },
          { status: 200, headers: corsHeaders },
        )
      }

      const webBase = await getDocuSignWebBaseUrl(req.payload)

      const items = listResult.envelopes.map((env) => ({
        envelopeId: env.envelopeId,
        documentName: env.documentName,
        status: env.status,
        statusChangedDateTime: env.statusChangedDateTime || '',
        createdDateTime: env.createdDateTime || '',
        senderName: env.senderName || '',
        senderEmail: env.senderEmail || '',
        canSign: isAwaitingSignatureFrom(env.recipients, targetEmail),
        recipients: env.recipients.map((r) => ({
          name: r.name,
          email: r.email,
          role: r.recipientType || 'signer',
          status: r.status,
        })),
        docusignUrl: `${webBase}/${env.envelopeId}`,
      }))

      return Response.json(
        {
          items,
          paging: {
            start,
            count,
            total: listResult.totalCount ?? items.length,
            nextStart: listResult.nextStartPosition ?? null,
          },
          isDocuSignAdmin: listResult.isDocuSignAdmin,
          notDocuSignUser: false,
        },
        { status: 200, headers: corsHeaders },
      )
    } catch (err: unknown) {
      logger.error(
        `Unexpected error in /docusign/envelopes GET endpoint: ${(err as Error)?.message || 'Unknown'}`,
      )
      return Response.json(
        { message: (err as Error)?.message || 'Internal Server Error' },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
