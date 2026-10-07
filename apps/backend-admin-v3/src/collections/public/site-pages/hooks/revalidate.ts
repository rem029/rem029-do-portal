import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

export const revalidateSitePage: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    const slug = doc.info?.slug || doc.slug
    if (slug) {
      payload.logger.info(`Revalidating site page: ${slug}`)
      revalidateTag(`site-page-${slug}`)
      revalidateTag('site-page')

      try {
        // Also revalidate the path directly to ensure router cache is cleared
        revalidatePath(`/page/${slug}`, 'page')
        revalidatePath(`/ar/page/${slug}`, 'page')
      } catch (err) {
        payload.logger.error(`Error revalidating path: ${err}`)
      }
    }
  }
  return doc
}

export const revalidateSitePageDelete: CollectionAfterDeleteHook = ({ doc, req: { payload } }) => {
  const slug = doc.info?.slug || doc.slug
  if (slug) {
    payload.logger.info(`Revalidating deleted site page: ${slug}`)
    revalidateTag(`site-page-${slug}`)
  }
}
