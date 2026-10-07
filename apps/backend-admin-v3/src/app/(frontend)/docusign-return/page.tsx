import config from '@payload-config'
import { getPayload } from 'payload'
import { getAllowedOrigins, isOriginAllowed } from '@/utilities/cors'
import { DocusignReturnClient } from './return-client'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DocusignReturnPage({ searchParams }: PageProps) {
  const params = await searchParams
  // DocuSign appends its own envelopeId (duplicating ours) and a capitalised event, e.g. "Send"
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() || undefined
  const rawEnvelopeId = first(params.envelopeId)
  const rawEvent = first(params.event)?.toLowerCase()
  const rawReturnTo = first(params.returnTo)
  const rawFlow = first(params.flow)?.toLowerCase()

  let returnTo: string | undefined = undefined
  if (rawReturnTo) {
    try {
      const parsedUrl = new URL(rawReturnTo)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        const payload = await getPayload({ config })
        const allowedOrigins = await getAllowedOrigins(payload)
        if (isOriginAllowed(parsedUrl.origin, allowedOrigins)) {
          returnTo = rawReturnTo
        }
      }
    } catch {
      // Invalid URL format - drop returnTo
    }
  }

  return (
    <DocusignReturnClient
      envelopeId={rawEnvelopeId}
      event={rawEvent}
      returnTo={returnTo}
      flow={rawFlow}
    />
  )
}
