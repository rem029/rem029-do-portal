import type { FieldHook } from 'payload'

/**
 * Looks up the category title from the relationship.
 * Can be used as a virtual field hook.
 */
export const updateCategoryTitle: FieldHook = async ({ data, req, value }) => {
  const { payload } = req
  const categoryId = typeof data?.category === 'object' ? data?.category?.id : data?.category

  if (categoryId) {
    const category = await payload.findByID({
      id: categoryId,
      collection: 'menu-categories',
      req,
      depth: 0,
    })

    if (category) {
      return category?.title || ''
    }
  }

  return value
}
