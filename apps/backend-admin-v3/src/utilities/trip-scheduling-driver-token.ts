import type { Payload } from 'payload'
import { TIMEZONE } from '@/utilities/constant'

const GRACE_DAYS = 1
const FALLBACK_MS = 24 * 60 * 60 * 1000

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

// Minutes `timeZone` is ahead of UTC at `instant` (Asia/Qatar: 180).
function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone)
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000)
}

function toValidDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

// The travel date's calendar day in TIMEZONE ('YYYY-MM-DD'). Frontend forms store it as 00:00 UTC and the
// admin day picker as 12:00 UTC; both land on the same Qatar day, matching the completion guard.
export function travelDayKey(travelDate: unknown): string | null {
  const date = toValidDate(travelDate)
  if (!date) return null
  const { year, month, day } = zonedParts(date, TIMEZONE)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// The last instant (23:59:59.999 in TIMEZONE) of the travel day plus `days`; null for a missing or
// invalid date. The one definition shared by the driver token, the completion page and the job.
function endOfTravelDayPlus(travelDate: unknown, days: number): Date | null {
  const date = toValidDate(travelDate)
  if (!date) return null

  const { year, month, day } = zonedParts(date, TIMEZONE)
  const endOfDayWallClock = Date.UTC(year, month - 1, day + days, 23, 59, 59, 999)
  const offset = zoneOffsetMinutes(new Date(endOfDayWallClock), TIMEZONE)
  return new Date(endOfDayWallClock - offset * 60 * 1000)
}

// Driver completion links stay valid until the end of the travel day (TIMEZONE) plus GRACE_DAYS.
export function driverTokenExpiry(
  travelDate: unknown,
  logger: Pick<Payload['logger'], 'warn'>,
  now: Date = new Date(),
): string {
  const end = endOfTravelDayPlus(travelDate, GRACE_DAYS)
  if (!end) {
    logger.warn('[Driver Token] Missing or invalid travel date; falling back to a 24h expiry.')
    return new Date(now.getTime() + FALLBACK_MS).toISOString()
  }
  return end.toISOString()
}

// Whether the driver's completion window (end of the travel day + GRACE_DAYS) has closed. Null for a
// missing or invalid date: the caller skips and logs, there is no fallback window here.
export function driverWindowClosed(travelDate: unknown, now: Date = new Date()): boolean | null {
  const end = endOfTravelDayPlus(travelDate, GRACE_DAYS)
  return end ? now.getTime() > end.getTime() : null
}

// Whether the travel day itself (TIMEZONE) has ended. Null for a missing or invalid date.
export function travelDayEnded(travelDate: unknown, now: Date = new Date()): boolean | null {
  const end = endOfTravelDayPlus(travelDate, 0)
  return end ? now.getTime() > end.getTime() : null
}
