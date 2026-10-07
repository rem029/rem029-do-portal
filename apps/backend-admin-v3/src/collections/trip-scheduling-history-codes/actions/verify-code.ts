'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres/drizzle'
import config from '@payload-config'
import { runAtomicClaim } from '@/utilities/atomic-claim'
import { generateSecureHexToken } from '@/utilities/secure-token-generator'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'
import {
  HISTORY_CODES_SLUG,
  HISTORY_SESSION_COOKIE,
  HISTORY_SESSION_MAX_AGE_SECONDS,
  getHistoryAllowlist,
  historyHmac,
  historySessionCookieOptions,
  normalizeEmail,
} from '@/utilities/trip-scheduling-history-session'

const MAX_ATTEMPTS = 5

type VerifyResult = { ok: true } | { ok: false; error: string }

// One message for every failure (no code, expired, wrong, too many attempts, not allowlisted, error).
const FAILED: VerifyResult = { ok: false, error: 'Invalid or expired code.' }

export async function verifyHistoryCode(emailInput: string, codeInput: string): Promise<VerifyResult> {
  const payload = await getPayload({ config })

  try {
    const email = normalizeEmail(emailInput)
    const code = typeof codeInput === 'string' ? codeInput.trim() : ''
    if (!email || !/^\d{6}$/.test(code)) return FAILED

    const codeHash = historyHmac(code)
    if (!codeHash) {
      payload.logger.error('[History OTP] PAYLOAD_SECRET is not set; rejecting code verification.')
      return FAILED
    }

    const now = new Date()
    const nowIso = now.toISOString()

    const { docs } = await payload.find({
      collection: HISTORY_CODES_SLUG,
      where: {
        and: [
          { email: { equals: email } },
          { consumedAt: { exists: false } },
          { expiresAt: { greater_than: nowIso } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })

    const row = docs[0]
    if (!row) return FAILED

    // The attempt is recorded before comparing, in one atomic statement: it only matches while the code
    // is live, unconsumed and under the limit, so concurrent guesses each spend their own attempt and
    // none can exceed MAX_ATTEMPTS. The attempt that reaches the limit consumes the code.
    const counted = await runAtomicClaim<{ attempts: string | number }>(
      payload,
      sql`
        UPDATE "trip_scheduling_history_codes"
        SET "attempts" = "attempts" + 1,
            "consumed_at" = CASE WHEN "attempts" + 1 >= ${MAX_ATTEMPTS} THEN now() ELSE "consumed_at" END,
            "updated_at" = now()
        WHERE "id" = ${row.id}
          AND "attempts" < ${MAX_ATTEMPTS}
          AND "consumed_at" IS NULL
          AND "expires_at" > now()
        RETURNING "attempts"`,
    )
    if (counted.length !== 1) return FAILED

    if (!isTokenMatch(row.codeHash, codeHash)) return FAILED

    const allowlist = await getHistoryAllowlist(payload)
    if (!allowlist.includes(email)) {
      await payload.update({ collection: HISTORY_CODES_SLUG, id: row.id, data: { consumedAt: nowIso } })
      return FAILED
    }

    const sessionToken = generateSecureHexToken()
    const sessionTokenHash = historyHmac(sessionToken)
    if (!sessionTokenHash) return FAILED

    await payload.update({
      collection: HISTORY_CODES_SLUG,
      id: row.id,
      data: {
        consumedAt: nowIso,
        sessionTokenHash,
        sessionExpiresAt: new Date(now.getTime() + HISTORY_SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(HISTORY_SESSION_COOKIE, sessionToken, historySessionCookieOptions)

    return { ok: true }
  } catch (err) {
    payload.logger.error(
      `[History OTP] Code verification failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    return FAILED
  }
}
