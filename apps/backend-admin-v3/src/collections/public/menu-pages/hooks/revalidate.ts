import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

export const revalidateMenuPage: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    const slug = doc.info?.slug || doc.slug
    if (slug) {
      payload.logger.info(`Revalidating menu page: ${slug}`)
      try {
        revalidateTag(`menu-page-${slug}`)
        revalidateTag('menu-page')
        // Also revalidate the path directly to ensure router cache is cleared
        revalidatePath(`/fnb/menu/${slug}`, 'page')
        revalidatePath(`/ar/fnb/menu/${slug}`, 'page')
      } catch (err) {
        payload.logger.error(`Error revalidating path: ${err}`)
      }
    }
  }
  return doc
}

export const revalidateMenuPageDelete: CollectionAfterDeleteHook = ({ doc, req: { payload } }) => {
  const slug = doc.info?.slug || doc.slug
  if (slug) {
    payload.logger.info(`Revalidating deleted menu page: ${slug}`)
    try {
      revalidateTag(`menu-page-${slug}`)
    } catch (err) {
      payload.logger.error(`Error revalidating path: ${err}`)
    }
  }
}
