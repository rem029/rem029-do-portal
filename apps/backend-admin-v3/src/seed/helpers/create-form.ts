import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

export const createForm = async (
  payload: Payload,
  data: RequiredDataFromCollectionSlug<'forms'>,
): Promise<void> => {
  const existing = await payload.find({
    collection: 'forms',
    where: { slug: { equals: data.slug } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) {
    payload.logger.info(`Creating form "${data.slug}"...`)
    await payload.create({
      collection: 'forms',
      context: { skipRevalidate: true },
      overrideAccess: true,
      data,
    })
    payload.logger.info(`Form "${data.slug}" created successfully.`)
  } else {
    payload.logger.info(`Form "${data.slug}" already exists — updating.`)
    await payload.update({
      collection: 'forms',
      id: existing.docs[0].id,
      context: { skipRevalidate: true },
      overrideAccess: true,
      data,
    })
    payload.logger.info(`Form "${data.slug}" updated successfully.`)
  }
}
