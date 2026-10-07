import { CollectionBeforeValidateHook } from 'payload'
import { slugify } from 'payload/shared'

const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const cleanSlugify = (text: string): string => {
  return (slugify(text) || '').replace(/^[^a-z0-9]+/, '')
}

/**
 * Joins slug parts left-to-right, dropping the leading `<accumulated>-` prefix a
 * part shares with everything before it (and skipping a part that fully repeats
 * the accumulated tail). Turns `doha-oasis` + `doha-oasis-events` +
 * `doha-oasis-events-gala` into `doha-oasis-events-gala` instead of the triple.
 */
const joinDeduped = (parts: string[]): string => {
  let acc = ''
  for (const part of parts) {
    if (!part) continue
    if (!acc) {
      acc = part
      continue
    }
    if (part === acc) continue
    acc = part.startsWith(`${acc}-`) ? part : `${acc}-${part}`
  }
  return acc
}

export const setOperatorSlugCollection: (
  watchPath: string,
  operatorPath?: string,
  restaurantPath?: string,
  opts?: { dedupePrefixes?: boolean },
) => CollectionBeforeValidateHook =
  (watchPath, operatorPath = 'operator', restaurantPath, opts) =>
  async ({ req, data }) => {
    const operatorId = getValueByPath(data, operatorPath) as string | undefined
    if (operatorId && data) {
      const { payload } = req
      const operator = await payload.findByID({
        collection: 'operators',
        id: operatorId,
      })
      const { slug: operatorSlug } = operator

      let restaurantSlug = ''
      const restaurantId = restaurantPath ? getValueByPath(data, restaurantPath) : undefined
      if (restaurantId) {
        const restaurant = await payload.findByID({
          collection: 'restaurants',
          id: restaurantId as string,
        })
        restaurantSlug = restaurant?.slug || ''
      }

      const watchValue = getValueByPath(data, watchPath)
      if (watchValue) {
        const parts = [operatorSlug]
        if (restaurantSlug) parts.push(restaurantSlug)
        parts.push(watchValue)

        const cleaned = parts.map((p) => cleanSlugify(p))
        data.operator_slug = opts?.dedupePrefixes ? joinDeduped(cleaned) : cleaned.join('-')
      }
    }

    return data
  }
