import type { FieldHook } from 'payload'

/**
 * Gives a duplicated document the next free numbered slug (`<slug>-1`, `<slug>-2`, ...) instead of
 * copying it as-is (collides on `operator_slug`) or Payload's default `<slug> - Copy` (not a valid slug).
 * Duplicating a copy (`<slug>-2`) numbers from the same base rather than nesting (`<slug>-2-1`).
 */
export const slugBeforeDuplicate: FieldHook = async ({ value, collection, req }) => {
  if (typeof value !== 'string' || !value || !collection) return value

  const base = value.replace(/-\d+$/, '') || value
  const { docs } = await req.payload.find({
    collection: collection.slug,
    where: { slug: { contains: base } },
    limit: 0,
    pagination: false,
    depth: 0,
    req,
  })

  const prefix = `${base}-`
  const highest = docs.reduce((max, doc) => {
    const slug = (doc as { slug?: unknown }).slug
    if (typeof slug !== 'string' || !slug.startsWith(prefix)) return max
    const suffix = slug.slice(prefix.length)
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)

  return `${prefix}${highest + 1}`
}
