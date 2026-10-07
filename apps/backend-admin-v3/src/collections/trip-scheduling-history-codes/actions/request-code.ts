'use server'

import { randomInt } from 'crypto'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import {
  HISTORY_CODES_SLUG,
  getHistoryAllowlist,
  historyHmac,
  normalizeEmail,
} from '@/utilities/trip-scheduling-history-session'
import { queueHistoryCodeEmail } from '../emails'

const CODE_TTL_MS = 10 * 60 * 1000
const COOLDOWN_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DAILY_CAP = 10

// Identical for every outcome (allowlisted, not allowlisted, rate-limited, error) so the response never
// reveals whether an email is on the allowlist.
const OK = { ok: true } as const

// Rows younger than a day are kept even when spent: the daily cap counts them.
async function deleteStaleRows(payload: Payload, now: Date): Promise<void> {
  const nowIso = now.toISOString()
  await payload.delete({
    collection: HISTORY_CODES_SLUG,
    where: {
      and: [
        { expiresAt: { less_than: nowIso } },
        { createdAt: { less_than: new Date(now.getTime() - DAY_MS).toISOString() } },
        {
          or: [
            { sessionTokenHash: { exists: false } },
            { sessionExpiresAt: { less_than: nowIso } },
          ],
        },
      ],
    },
  })
}

export async function requestHistoryCode(emailInput: string): Promise<{ ok: true }> {
  const payload = await getPayload({ config })

  try {
    const now = new Date()
    const nowIso = now.toISOString()

    await deleteStaleRows(payload, now)

    const email = normalizeEmail(emailInput)
    if (!email) return OK

    const allowlist = await getHistoryAllowlist(payload)
    if (!allowlist.includes(email)) return OK

    const recent = await payload.find({
      collection: HISTORY_CODES_SLUG,
      where: {
        and: [
          { email: { equals: email } },
          { createdAt: { greater_than: new Date(now.getTime() - DAY_MS).toISOString() } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })

    if (recent.totalDocs >= DAILY_CAP) return OK

    const latest = recent.docs[0]
    if (latest && now.getTime() - new Date(latest.createdAt).getTime() < COOLDOWN_MS) return OK

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const codeHash = historyHmac(code)
    if (!codeHash) {
      payload.logger.error('[History OTP] PAYLOAD_SECRET is not set; no code issued.')
      return OK
    }

    // Retire earlier live codes, but never rows that hold an active session.
    await payload.update({
      collection: HISTORY_CODES_SLUG,
      where: {
        and: [
          { email: { equals: email } },
          { consumedAt: { exists: false } },
          { expiresAt: { greater_than: nowIso } },
          { sessionTokenHash: { exists: false } },
        ],
      },
      data: { consumedAt: nowIso },
    })

    await payload.create({
      collection: HISTORY_CODES_SLUG,
      data: {
        email,
        codeHash,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
        attempts: 0,
      },
    })

    await queueHistoryCodeEmail(payload, email, code)
    return OK
  } catch (err) {
    payload.logger.error(
      `[History OTP] Code request failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    return OK
  }
}
