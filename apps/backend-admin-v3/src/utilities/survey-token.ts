import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Stateless, short-lived proof that a visitor already passed `validateSurveyCodeAction` for a
 * given `survey-invitations` doc. No DB-backed session — the token itself carries the
 * invitation id and an expiry, HMAC-signed with `PAYLOAD_SECRET` (the same secret Payload itself
 * is configured with, see `payload.config.ts`). Anyone holding a valid, unexpired token is
 * allowed to call `submitSurveyAction` for that invitation; the invitation's own claim-first
 * update in `submitSurveyAction` is what actually prevents reuse, not this token.
 */

const SECRET = process.env.PAYLOAD_SECRET || ''

interface SurveyTokenPayload {
  invitationId: string
  expiresAt: number
}

function sign(payloadB64: string): string {
  return createHmac('sha256', SECRET).update(payloadB64).digest('base64url')
}

/** Signs a token for `invitationId` that expires `ttlSeconds` from now (default 2 hours). */
export function signSurveyToken(invitationId: string, ttlSeconds = 7200): string {
  const payload: SurveyTokenPayload = {
    invitationId,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = sign(payloadB64)
  return `${payloadB64}.${signature}`
}

/**
 * Verifies signature and expiry. Returns `null` on any failure (malformed token, bad
 * signature, expired) — callers should treat every failure identically, no enumeration.
 */
export function verifySurveyToken(token: string): { invitationId: string } | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const expectedSignature = sign(payloadB64)
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null
    }

    const decoded = Buffer.from(payloadB64, 'base64url').toString('utf8')
    // JSON.parse returns `any` by nature; the runtime shape checks right below are what actually
    // validate it, this cast just names the shape we're about to check.
    const parsed = JSON.parse(decoded) as Partial<SurveyTokenPayload>

    if (typeof parsed.invitationId !== 'string' || !parsed.invitationId) return null
    if (typeof parsed.expiresAt !== 'number' || Date.now() > parsed.expiresAt) return null

    return { invitationId: parsed.invitationId }
  } catch {
    return null
  }
}
