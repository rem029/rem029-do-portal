/**
 * Normalizes a corporate email address to standard lowercase `@dohaoasis.com`.
 */
export function normalizeDohaEmail(email?: string | null): string {
  if (!email) return ''
  const lower = email.trim().toLowerCase()
  return lower.includes('corp.dohaoasis.com')
    ? lower.replace('corp.dohaoasis.com', 'dohaoasis.com')
    : lower
}
