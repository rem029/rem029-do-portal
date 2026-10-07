import { CollectionBeforeValidateHook } from 'payload'
import { slugify } from 'payload/shared'

const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const setValueByPath = (obj: any, path: string, value: any) => {
  if (!obj || !path) return
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

const cleanSlugify = (text: string): string => {
  return (slugify(text) || '').replace(/^[^a-z0-9]+/, '')
}

/**
 * Custom operator slug generator for site-pages.
 * If operator is present, follows pattern: {operator-slug}-{page-slug}
 * If operator is NOT present, uses: {page-slug}
 * Also auto-increments if duplicate found on creation or update.
 */
export const setSitePageOperatorSlug: (
  watchPath: string,
  operatorPath?: string,
) => CollectionBeforeValidateHook =
  (watchPath, operatorPath = 'operator') =>
    async ({ req, data, operation, originalDoc }) => {
      const operatorId = getValueByPath(data, operatorPath) as string | undefined
      const watchValue = getValueByPath(data, watchPath)

      if (!data) return data
      if (!watchValue) {
        return data
      }

      let operatorSlugStr = ''
      if (operatorId && data) {
        const { payload } = req
        try {
          const operator = await payload.findByID({
            collection: 'operators',
            id: operatorId,
          })
          operatorSlugStr = operator?.slug || ''
        } catch (err) {
          req.payload.logger.error(`Error fetching operator for slug generation: ${err}`)
        }
      }

      const baseInfoSlug = cleanSlugify(watchValue)

      const getOperatorSlug = (infoSlug: string) => {
        if (operatorSlugStr) {
          return `${cleanSlugify(operatorSlugStr)}-${infoSlug}`
        }
        return infoSlug
      }

      let currentInfoSlug = baseInfoSlug
      let currentOperatorSlug = getOperatorSlug(currentInfoSlug)

      const isCreateOrDuplicate = operation === 'create'
      const hasSlugChanged =
        operation === 'update' && originalDoc && originalDoc.operator_slug !== currentOperatorSlug

      if (isCreateOrDuplicate || hasSlugChanged) {
        const { payload } = req
        let isUnique = false
        let counter = 0

        while (!isUnique) {
          const existingDocs = await payload.find({
            collection: 'site-pages',
            where: {
              or: [
                {
                  operator_slug: {
                    equals: currentOperatorSlug,
                  },
                },
                {
                  'info.slug': {
                    equals: currentInfoSlug,
                  },
                },
              ],
            },
            depth: 0,
            limit: 1,
          })

          if (existingDocs.totalDocs === 0) {
            isUnique = true
          } else {
            // If update and the ONLY matching doc is the one we're updating, it's unique
            if (
              operation === 'update' &&
              existingDocs.totalDocs === 1 &&
              existingDocs.docs[0].id === originalDoc.id
            ) {
              isUnique = true
              break
            }

            counter++
            currentInfoSlug = `${baseInfoSlug}-${counter}`
            currentOperatorSlug = getOperatorSlug(currentInfoSlug)
          }
        }

        data.operator_slug = currentOperatorSlug
        setValueByPath(data, watchPath, currentInfoSlug)
      } else {
        // It's an update and slug hasn't changed its base form. Keep original.
        data.operator_slug = originalDoc.operator_slug
      }

      return data
    }
