import { Config } from '@/payload-types'
import { Payload, Where } from 'payload'

export type CollectionSlugs = keyof Config['collections']
export interface CreateCollectionIfNotExists<T extends CollectionSlugs> {
  payload: Payload
  collection: T
  where: Where
  data: Partial<Config['collections'][T]>
  overrideAccess?: boolean
  disableVerificationEmail?: boolean
  disableVerificationTransaction?: boolean
}
/**
 * Reusable helper to create a document in a collection if it doesn't already exist.
 *
 * @param payload - The Payload instance
 * @param collection - The slug of the collection
 * @param where - The criteria to check for existence (e.g. { email: { equals: 'test@test.com' } })
 * @param data - The data to create if the document doesn't exist
 * @returns The existing or newly created document
 */
export const createCollectionIfNotExists = async <T extends CollectionSlugs>(
  args: CreateCollectionIfNotExists<T>,
): Promise<Config['collections'][T]> => {
  const {
    collection,
    data,
    payload,
    where,
    overrideAccess,
    disableVerificationEmail,
    disableVerificationTransaction,
  } = args

  const logger = payload.logger
  const existing = await payload.find({
    collection: collection,
    where,
    limit: 1,
    overrideAccess,
  })

  if (existing.totalDocs > 0) {
    return existing.docs[0] as unknown as Config['collections'][T]
  }

  const created = await payload.create({
    collection: collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    overrideAccess,
    // @ts-ignore
    disableVerificationEmail,
    // @ts-ignore
    disableVerificationTransaction,
  })

  logger.info(`✓ Created record in ${collection}`)
  return created as unknown as Config['collections'][T]
}
