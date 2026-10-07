import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

export const revalidateEventPage: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    const slug = doc.info?.slug || doc.slug
    if (slug) {
      payload.logger.info(`Revalidating event page: ${slug}`)
      try {
        revalidateTag(`menu-page-${slug}`)
        revalidateTag('menu-page')
        // Also revalidate the path directly to ensure router cache is cleared
        revalidatePath(`/fnb/menu/${slug}`, 'page')
        revalidatePath(`/ar/fnb/menu/${slug}`, 'page')
      } catch (err) {
        payload.logger.error(`Error revalidating: ${err}`)
      }
    }
  }
  return doc
}

export const revalidateEventPageDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { payload },
}) => {
  const slug = doc.info?.slug || doc.slug
  if (slug) {
    payload.logger.info(`Revalidating deleted event page: ${slug}`)
    try {
      revalidateTag(`menu-page-${slug}`)
    } catch (err) {
      payload.logger.error(`Error revalidating: ${err}`)
    }
  }
}
