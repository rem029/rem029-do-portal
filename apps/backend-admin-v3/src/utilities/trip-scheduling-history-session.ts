// Server-side only: imports next/headers, so Next refuses to bundle it into a client component.
// Deliberately not 'use server' — that would expose every export here as a public action.
import { createHmac } from 'crypto'
import { cookies, headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { hasUserAccess, isCollectionSuperUser } from '@/utilities/access'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'

export const HISTORY_CODES_SLUG = 'trip-scheduling-history-codes'
export const HISTORY_SESSION_COOKIE = 'trip-history-session'
export const HISTORY_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

const SETTINGS_SLUG = 'trip-scheduling-settings'

export type HistoryViewer = { email: string; via: 'otp' | 'admin' }

export const historySessionCookieOptions = {
  httpOnly: true,
  path: '/',
  maxAge: HISTORY_SESSION_MAX_AGE_SECONDS,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

// Returns null when PAYLOAD_SECRET is missing so every caller fails closed.
export function historyHmac(value: string): string | null {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(value).digest('hex')
}

export async function getHistoryAllowlist(payload: Payload): Promise<string[]> {
  const settings = await payload.findGlobal({ slug: SETTINGS_SLUG, depth: 0 })

  const emails = [...(settings.notificationEmails ?? []), ...(settings.historyAccessEmails ?? [])]
    .map((entry) => normalizeEmail(entry?.email))
    .filter(Boolean)

  return Array.from(new Set(emails))
}

async function getOtpViewer(payload: Payload): Promise<HistoryViewer | null> {
  const token = (await cookies()).get(HISTORY_SESSION_COOKIE)?.value
  if (!token) return null

  const tokenHash = historyHmac(token)
  if (!tokenHash) {
    payload.logger.error('[History OTP] PAYLOAD_SECRET is not set; rejecting history session.')
    return null
  }

  const { docs } = await payload.find({
    collection: HISTORY_CODES_SLUG,
    where: {
      and: [
        { sessionTokenHash: { equals: tokenHash } },
        { sessionExpiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  const row = docs[0]
  if (!row || !isTokenMatch(row.sessionTokenHash, tokenHash)) return null

  // Re-checked on every call so removing an email from the settings revokes its session at once.
  const email = normalizeEmail(row.email)
  const allowlist = await getHistoryAllowlist(payload)
  return allowlist.includes(email) ? { email, via: 'otp' } : null
}

export async function getHistoryViewer(): Promise<HistoryViewer | null> {
  const payload = await getPayload({ config })

  try {
    const otpViewer = await getOtpViewer(payload)
    if (otpViewer) return otpViewer

    const { user } = await payload.auth({ headers: await headers() })
    if (
      user &&
      (isCollectionSuperUser(user, SETTINGS_SLUG) || hasUserAccess(user, SETTINGS_SLUG, 'read'))
    ) {
      return { email: normalizeEmail(user.email), via: 'admin' }
    }

    return null
  } catch (err) {
    payload.logger.error(
      `[History OTP] Session check failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}
