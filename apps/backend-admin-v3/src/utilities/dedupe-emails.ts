/**
 * Trims, lowercases, drops blanks, and dedupes an array of raw email strings.
 * Safe for both client and server usage.
 */
export const dedupeEmails = (rawEmails: string[]): string[] => {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const raw of rawEmails) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!trimmed) continue

    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    unique.push(key)
  }

  return unique
}
