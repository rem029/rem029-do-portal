import { ArrayFieldValidation } from 'payload'

export const validateDashboardItemSlugs: ArrayFieldValidation = (value, { req }) => {
  const items = value as Array<{ slug?: string }> | null | undefined
  if (!items || items.length === 0) return true

  const slugs = items
    .map((item) => item?.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))

  const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index)
  if (duplicates.length > 0) {
    const uniqueDuplicates = Array.from(new Set(duplicates))
    return `Dashboard item slugs must be unique. Duplicate slug(s): ${uniqueDuplicates.join(', ')}.`
  }

  if (req?.payload?.config) {
    const collectionSlugs = req.payload.config.collections.map((c) => c.slug)
    const globalSlugs = req.payload.config.globals.map((g) => g.slug)
    const validSlugs = new Set<string>([...collectionSlugs, ...globalSlugs])

    const invalidSlugs = slugs.filter((slug) => !validSlugs.has(slug))
    if (invalidSlugs.length > 0) {
      return `Invalid slug(s): ${invalidSlugs.join(', ')}. Must match an existing collection or global slug.`
    }
  }

  return true
}
