import { RecipientPayload } from './envelopes'

export interface ValidatedEnvelopeMetadata {
  documentName?: string
  emailSubject?: string
  recipients: RecipientPayload[]
}

export type MetadataValidationResult =
  | { ok: true; data: ValidatedEnvelopeMetadata }
  | { ok: false; error: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates envelope creation metadata including recipient names, emails, roles, and routing orders.
 */
export function validateEnvelopeMetadata(raw: unknown): MetadataValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Metadata must be an object' }
  }

  const obj = raw as Record<string, unknown>
  if (!obj.recipients || !Array.isArray(obj.recipients) || obj.recipients.length === 0) {
    return { ok: false, error: 'At least one recipient is required' }
  }

  const recipients: RecipientPayload[] = []

  for (let i = 0; i < obj.recipients.length; i++) {
    const r = obj.recipients[i]
    if (!r || typeof r !== 'object') {
      return { ok: false, error: `Recipient #${i + 1} is invalid` }
    }

    const item = r as Record<string, unknown>
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    const email = typeof item.email === 'string' ? item.email.trim() : ''
    const role =
      typeof item.role === 'string' && item.role.trim() ? item.role.trim().toLowerCase() : 'signer'
    const routingOrder =
      typeof item.routingOrder === 'number'
        ? item.routingOrder
        : typeof item.routingOrder === 'string' && /^\d+$/.test(item.routingOrder.trim())
          ? parseInt(item.routingOrder.trim(), 10)
          : undefined

    if (!name) {
      return { ok: false, error: `Recipient #${i + 1} is missing a name` }
    }
    if (!email) {
      return { ok: false, error: `Recipient #${i + 1} is missing an email` }
    }
    if (!EMAIL_REGEX.test(email)) {
      return { ok: false, error: `Recipient #${i + 1} has an invalid email format ("${email}")` }
    }
    if (role !== 'signer' && role !== 'approver' && role !== 'cc') {
      return {
        ok: false,
        error: `Recipient #${i + 1} has invalid role "${item.role}" (must be signer, approver, or cc)`,
      }
    }

    recipients.push({
      name,
      email,
      role: role as 'signer' | 'approver' | 'cc',
      routingOrder,
    })
  }

  const documentName =
    typeof obj.documentName === 'string' && obj.documentName.trim()
      ? obj.documentName.trim()
      : undefined
  const emailSubject =
    typeof obj.emailSubject === 'string' && obj.emailSubject.trim()
      ? obj.emailSubject.trim()
      : undefined

  return {
    ok: true,
    data: {
      documentName,
      emailSubject,
      recipients,
    },
  }
}
