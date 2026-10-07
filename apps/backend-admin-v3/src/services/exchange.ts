/**
 * Exchange Web Services (EWS) Integration
 *
 * Migrated to Node.js/Payload CMS from the original ASP.NET Core ExchangeMiddlewareAPI.
 * Original C# EWS Architecture and Implementation credits to Rejin Ramanan.
 */
// Helper to decode XML entities
const decodeXml = (str: string) => {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

const createBodyPreview = (rawBody: string): string => {
  if (!rawBody) return ''

  let preview = rawBody
  // Remove non-visible blocks
  preview = preview.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
  preview = preview.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
  preview = preview.replace(/<!--[\s\S]*?-->/g, ' ')
  // Remove tags
  preview = preview.replace(/<[^>]*>/g, ' ')
  // Decode HTML entities (rudimentary decode for standard text)
  preview = decodeXml(preview)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&#x20;/g, ' ')

  // Strip remaining loose CSS
  preview = preview.replace(
    /(?:[#.]?[a-z_][\w\\:.*#.-]*(?:\s*,\s*[#.]?[a-z_][\w\\:.*#.-]*)*)\s*\{[^{}]*\}/gi,
    ' ',
  )
  preview = preview.replace(/\/\*[\s\S]*?\*\//g, ' ')
  preview = preview.replace(/\s+/g, ' ').trim()

  if (preview.length > 500) {
    preview = preview.substring(0, 500).trimEnd() + '...'
  }
  return preview
}

export interface EmailMessage {
  Subject: string
  BodyPreview: string
  ReceivedDateTime: string
  IsRead: boolean
  WebLink: string
  From: {
    EmailAddress: {
      Name: string
      Address: string
    }
  }
}

export const getEmailsForUser = async (
  userEmail: string,
  limit?: number,
  offset?: number,
): Promise<EmailMessage[]> => {
  const EWS_URL = process.env.EXCHANGE_EWS_URL || 'https://mail.dohaoasis.com/EWS/Exchange.asmx'
  const OWA_URL = process.env.EXCHANGE_OWA_BASE_URL || 'https://mail.dohaoasis.com/owa'
  const USER = process.env.EXCHANGE_SERVICE_ACCOUNT_USER || ''
  const PASS = process.env.EXCHANGE_SERVICE_ACCOUNT_PASSWORD || ''

  if (!USER || !PASS) {
    throw new Error('Exchange Service Account credentials are not configured in .env')
  }

  const basicAuthToken = Buffer.from(`${USER}:${PASS}`).toString('base64')

  const safeLimit = limit !== undefined ? limit : 10
  const safeOffset = offset !== undefined ? offset : 0
  const paginationXml = `<m:IndexedPageItemView MaxEntriesReturned="${safeLimit}" Offset="${safeOffset}" BasePoint="Beginning" />`

  // 1. FindItem Request
  const findItemXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013_SP1" />
    <t:ExchangeImpersonation>
      <t:ConnectingSID>
        <t:SmtpAddress>${userEmail}</t:SmtpAddress>
      </t:ConnectingSID>
    </t:ExchangeImpersonation>
  </soap:Header>
  <soap:Body>
    <m:FindItem Traversal="Shallow">
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
        <t:AdditionalProperties>
          <t:FieldURI FieldURI="item:Subject" />
          <t:FieldURI FieldURI="item:DateTimeReceived" />
          <t:FieldURI FieldURI="message:From" />
          <t:FieldURI FieldURI="message:IsRead" />
        </t:AdditionalProperties>
      </m:ItemShape>
      ${paginationXml}
      <m:SortOrder>
        <t:FieldOrder Order="Descending">
          <t:FieldURI FieldURI="item:DateTimeReceived" />
        </t:FieldOrder>
      </m:SortOrder>
      <m:ParentFolderIds>
        <t:DistinguishedFolderId Id="inbox" />
      </m:ParentFolderIds>
    </m:FindItem>
  </soap:Body>
</soap:Envelope>`

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      Authorization: `Basic ${basicAuthToken}`,
      Connection: 'close',
    },
  }

  // The on-prem CAS array load-balances across multiple nodes (e.g. EXC01, EXC03) whose
  // Basic Auth / impersonation config is inconsistent, so a 401 is often just the load
  // balancer landing on a misconfigured node rather than a real credential failure. One
  // retry (a fresh connection, likely a different node) usually succeeds.
  const fetchEwsWithRetry = async (bodyXml: string): Promise<Response> => {
    const resp = await fetch(EWS_URL, { ...fetchOptions, body: bodyXml })
    if (resp.status !== 401) return resp
    return fetch(EWS_URL, { ...fetchOptions, body: bodyXml })
  }

  let findResp
  try {
    findResp = await fetchEwsWithRetry(findItemXml)
  } catch (err: any) {
    const cause = err.cause ? ` (Cause: ${err.cause.message || err.cause})` : ''
    throw new Error(
      `Connection to Exchange Server failed: ${err.message}${cause}. Note: If your Exchange server uses a self-signed certificate, Node.js will reject it. The old C# app bypassed SSL validation. You may need to set NODE_TLS_REJECT_UNAUTHORIZED=0 in your .env to replicate that bypass.`,
    )
  }

  if (!findResp.ok) {
    const errText = await findResp.text()
    throw new Error(`EWS FindItem Failed: ${findResp.status} ${findResp.statusText} - ${errText}`)
  }

  const findRespText = await findResp.text()

  // Extract messages using Regex
  const messageRegex = /<t:Message>([\s\S]*?)<\/t:Message>/g
  let match
  const items: any[] = []

  while ((match = messageRegex.exec(findRespText)) !== null) {
    const msgBlock = match[1]
    const idMatch = msgBlock.match(/<t:ItemId Id="([^"]+)"/)
    const subjectMatch = msgBlock.match(/<t:Subject>([\s\S]*?)<\/t:Subject>/)
    const dateMatch = msgBlock.match(/<t:DateTimeReceived>([\s\S]*?)<\/t:DateTimeReceived>/)
    const nameMatch = msgBlock.match(/<t:Name>([\s\S]*?)<\/t:Name>/)
    const emailMatch = msgBlock.match(/<t:EmailAddress>([\s\S]*?)<\/t:EmailAddress>/)
    const readMatch = msgBlock.match(/<t:IsRead>([\s\S]*?)<\/t:IsRead>/)

    if (idMatch) {
      items.push({
        Id: idMatch[1],
        Subject: subjectMatch ? decodeXml(subjectMatch[1]) : '(No Subject)',
        ReceivedDateTime: dateMatch ? dateMatch[1] : '',
        From: {
          Name: nameMatch ? decodeXml(nameMatch[1]) : 'Unknown Sender',
          Address: emailMatch ? decodeXml(emailMatch[1]) : '',
        },
        IsRead: readMatch ? readMatch[1] === 'true' : false,
      })
    }
  }

  if (items.length === 0) return []

  // 2. GetItem Request to fetch Bodies
  const itemIdsXml = items.map((i) => `<t:ItemId Id="${i.Id}" />`).join('\n')
  const getItemXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013_SP1" />
    <t:ExchangeImpersonation>
      <t:ConnectingSID>
        <t:SmtpAddress>${userEmail}</t:SmtpAddress>
      </t:ConnectingSID>
    </t:ExchangeImpersonation>
  </soap:Header>
  <soap:Body>
    <m:GetItem>
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
        <t:AdditionalProperties>
          <t:FieldURI FieldURI="item:Body" />
        </t:AdditionalProperties>
      </m:ItemShape>
      <m:ItemIds>
        ${itemIdsXml}
      </m:ItemIds>
    </m:GetItem>
  </soap:Body>
</soap:Envelope>`

  let getResp
  try {
    getResp = await fetchEwsWithRetry(getItemXml)
  } catch (err: any) {
    const cause = err.cause ? ` (Cause: ${err.cause.message || err.cause})` : ''
    console.error(`GetItem Connection Failed: ${err.message}${cause}`)
    getResp = { ok: false, text: async () => 'Connection failed' }
  }

  if (!getResp.ok) {
    // Graceful fallback if GetItem fails: return items without body preview
    console.error('GetItem failed', await getResp.text())
    return items.map((i) => ({
      Subject: i.Subject,
      BodyPreview: '',
      ReceivedDateTime: i.ReceivedDateTime,
      IsRead: i.IsRead,
      WebLink: `${OWA_URL}/#path=/mail/item/${encodeURIComponent(i.Id)}`,
      From: { EmailAddress: i.From },
    }))
  }

  const getRespText = await getResp.text()

  // Extract bodies
  const bodies: Record<string, string> = {}
  const getMessageRegex = /<m:GetItemResponseMessage[^>]*>([\s\S]*?)<\/m:GetItemResponseMessage>/g
  let gMatch

  while ((gMatch = getMessageRegex.exec(getRespText)) !== null) {
    const rBlock = gMatch[1]
    const idMatch = rBlock.match(/<t:ItemId Id="([^"]+)"/)
    const bodyMatch = rBlock.match(/<t:Body[^>]*>([\s\S]*?)<\/t:Body>/)

    if (idMatch && bodyMatch) {
      // Body is often HTML encoded inside the XML node
      bodies[idMatch[1]] = decodeXml(bodyMatch[1])
    }
  }

  // Map bodies back to items
  return items.map((i) => ({
    Subject: i.Subject,
    BodyPreview: createBodyPreview(bodies[i.Id] || ''),
    ReceivedDateTime: i.ReceivedDateTime,
    IsRead: i.IsRead,
    WebLink: `${OWA_URL}/#path=/mail/item/${encodeURIComponent(i.Id)}`,
    From: {
      EmailAddress: {
        Name: i.From.Name,
        Address: i.From.Address,
      },
    },
  }))
}
