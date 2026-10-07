import type { CollectionBeforeChangeHook } from 'payload'

const isBlank = (val: unknown): boolean =>
  val === undefined || val === null || (typeof val === 'string' && val.trim() === '')

// Auto-fills blank event title and header label from venue to reduce duplicate typing.
export const fillTitleFromVenue: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  // Structural cast: `data` carries `fnb-menu-events`' `restaurant`, `info`, and `c` fields.
  const incoming = data as unknown as {
    restaurant?: string | { id?: string }
    info?: { title?: string | null }
    c?: { header?: { label?: string | null } }
  }

  const restaurantId =
    typeof incoming.restaurant === 'string'
      ? incoming.restaurant
      : typeof incoming.restaurant === 'object' && incoming.restaurant !== null
        ? incoming.restaurant.id
        : undefined

  if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
    return data
  }

  const infoTitleBlank = isBlank(incoming.info?.title)
  const headerLabelBlank = isBlank(incoming.c?.header?.label)

  if (!infoTitleBlank && !headerLabelBlank) {
    return data
  }

  try {
    const { payload } = req
    const restaurant = await payload.findByID({
      collection: 'restaurants',
      id: restaurantId,
    })

    const title = restaurant?.title?.trim()
    if (title) {
      if (infoTitleBlank) {
        data.info = {
          ...data.info,
          title: restaurant.title,
        }
      }

      if (headerLabelBlank) {
        data.c = {
          ...data.c,
          header: {
            ...data.c?.header,
            label: restaurant.title,
          },
        }
      }
    }
  } catch {
    // Cosmetic fallback only; do not throw or block save on failure.
  }

  return data
}
