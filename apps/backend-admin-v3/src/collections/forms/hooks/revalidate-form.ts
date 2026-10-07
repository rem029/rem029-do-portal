import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const revalidateFormAfterChange: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (context?.skipRevalidate) return doc

  if (doc.slug) {
    payload.logger.info(`Revalidating form: /forms/${doc.slug}`)
    revalidatePath(`/forms/${doc.slug}`)
  }
  return doc
}

export const revalidateFormAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { payload, context },
}) => {
  if (context?.skipRevalidate) return

  if (doc.slug) {
    payload.logger.info(`Revalidating deleted form: /forms/${doc.slug}`)
    revalidatePath(`/forms/${doc.slug}`)
  }
}
