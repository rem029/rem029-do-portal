import type { CollectionSlug, Payload, RequiredDataFromCollectionSlug, Where } from 'payload'

export type SeedCount = { created: number; skipped: number }

export const emptySeedCount = (): SeedCount => ({ created: 0, skipped: 0 })

// Creates the record only when nothing matches `where`; an existing record is never updated.
export const createIfMissing = async <TSlug extends CollectionSlug>(
  payload: Payload,
  collection: TSlug,
  where: Where,
  data: RequiredDataFromCollectionSlug<TSlug>,
): Promise<'created' | 'skipped'> => {
  const existing = await payload.find({
    collection,
    where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) return 'skipped'

  await payload.create({
    collection,
    data,
    overrideAccess: true,
  })
  return 'created'
}
