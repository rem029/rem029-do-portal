import { timingSafeEqual } from 'crypto'
import type { FieldAccess, Payload, PayloadRequest } from 'payload'

// Bearer-token fields must never be returned to, or accepted from, API clients (REST, GraphQL,
// admin), including authenticated ones. Local API calls (hooks, server actions, pages) are not affected.
export const TOKEN_FIELD_ACCESS: { read: FieldAccess; create: FieldAccess; update: FieldAccess } = {
  read: () => false,
  create: () => false,
  update: () => false,
}

// Constant-time comparison. Tokens have a fixed length, so comparing lengths first leaks nothing useful.
export function isTokenMatch(
  expected: string | null | undefined,
  provided: string | null | undefined,
): boolean {
  if (!expected || !provided) return false

  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)

  return (
    expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
  )
}

type ApprovalTokenCollection =
  | 'trip-scheduling-adhoc'
  | 'trip-scheduling-bookings'
  | 'trip-scheduling-staff-voice'

type DriverTokenCollection = 'trip-scheduling-adhoc' | 'trip-scheduling-bookings'

// Records saved over the API (REST, GraphQL, admin) reach afterChange hooks without their tokens, because
// read access strips them, so re-read locally. `req` is passed so the read joins the save's still-open
// transaction.
async function rereadToken(
  p: Payload,
  req: PayloadRequest,
  collection: ApprovalTokenCollection,
  id: string,
  field: 'approvalToken' | 'driverToken',
): Promise<string | null> {
  const stored = (await p.findByID({ collection, id, depth: 0, req, overrideAccess: true })) as {
    approvalToken?: string | null
    driverToken?: string | null
  }
  return stored[field] ?? null
}

export async function resolveApprovalToken(
  p: Payload,
  req: PayloadRequest,
  collection: ApprovalTokenCollection,
  doc: { id: string; approvalToken?: string | null },
): Promise<string | null> {
  if (doc.approvalToken) return doc.approvalToken
  return rereadToken(p, req, collection, doc.id, 'approvalToken')
}

export async function resolveDriverToken(
  p: Payload,
  req: PayloadRequest,
  collection: DriverTokenCollection,
  doc: { id: string; driverToken?: string | null },
): Promise<string | null> {
  if (doc.driverToken) return doc.driverToken
  return rereadToken(p, req, collection, doc.id, 'driverToken')
}
