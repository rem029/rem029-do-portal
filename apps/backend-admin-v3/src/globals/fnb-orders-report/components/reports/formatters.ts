/**
 * Shared formatters and timezone helpers for FnB Orders Reporting.
 * Doha operates on UTC+3 year-round with no Daylight Saving Time.
 */

export const DOHA_OFFSET_MS = 3 * 60 * 60 * 1000

/** Returns YYYY-MM-DD in Doha local time for N days ago (0 = today). */
export function dohaDate(daysAgo = 0): string {
  return new Date(Date.now() + DOHA_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

/** Returns the first day of the current month in Doha local time (YYYY-MM-01). */
export function dohaStartOfMonth(): string {
  const d = new Date(Date.now() + DOHA_OFFSET_MS)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/**
 * Format a riyal amount as a whole number with the QAR suffix.
 * e.g. 1250.5 -> "1,251 QAR", 50 -> "50 QAR"
 */
export function formatQar(amount: number): string {
  return `${Math.round(amount).toLocaleString()} QAR`
}

/**
 * Monochrome series ramp, dark -> light, drawn straight from Payload's own
 * elevation scale so every chart stays inside the admin's grayscale world and
 * flips correctly in dark mode. Index past the end clamps to the lightest step.
 */
export const SERIES_RAMP = [
  'var(--theme-elevation-800)',
  'var(--theme-elevation-600)',
  'var(--theme-elevation-400)',
  'var(--theme-elevation-300)',
  'var(--theme-elevation-200)',
] as const

export const seriesColor = (i: number): string =>
  SERIES_RAMP[Math.min(i, SERIES_RAMP.length - 1)]

/**
 * Heatmap cell fill: Payload's Status Blue mixed into the resting cell colour by
 * intensity (0..1). Uses color-mix so a single token drives the whole scale.
 */
export const heatFill = (intensity: number): string => {
  const pct = Math.round(Math.max(0, Math.min(1, intensity)) * 100)
  return `color-mix(in srgb, var(--theme-success-500) ${pct}%, var(--theme-elevation-100))`
}

/**
 * Format a duration in minutes into plain, unambiguous words:
 * - < 1 minute:   "under 1 min"
 * - < 60 minutes: "X min"  (1 decimal only when it isn't whole)
 * - >= 60 minutes: "X hr Y min"
 */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 1) return 'under 1 min'
  if (minutes < 60) {
    const rounded = Math.round(minutes * 10) / 10
    return `${rounded} min`
  }
  const hrs = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`
}
