'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  HISTORY_CODES_SLUG,
  HISTORY_SESSION_COOKIE,
  historyHmac,
} from '@/utilities/trip-scheduling-history-session'

export async function signOutHistory(): Promise<{ ok: true }> {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()

  try {
    const token = cookieStore.get(HISTORY_SESSION_COOKIE)?.value
    const tokenHash = token ? historyHmac(token) : null

    if (tokenHash) {
      await payload.delete({
        collection: HISTORY_CODES_SLUG,
        where: { sessionTokenHash: { equals: tokenHash } },
      })
    }
  } catch (err) {
    payload.logger.error(
      `[History OTP] Sign-out cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // Cleared regardless of the row cleanup above.
  cookieStore.set(HISTORY_SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return { ok: true }
}
