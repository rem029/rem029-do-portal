import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Validates that all menu_items belong to the same restaurant as the menu.
 */
export const fnbVerifyMenuItems: CollectionBeforeValidateHook = async ({
  req,
  collection,
  data,
}) => {
  const { payload } = req
  const { logger } = payload

  if (!data?.restaurant || !data?.menu_items) {
    logger.warn(
      `[${collection.slug}].fnbVerifyMenuItems.init: skipping — no restaurant or menu items found`,
    )
    return data
  }

  const restaurantId = data.restaurant as string
  const menuItems = data.menu_items as { item: string | { restaurant?: string; id?: string } }[]

  logger.info(
    `[${collection.slug}].fnbVerifyMenuItems.init: restaurant id: ${restaurantId} has ${menuItems?.length} menu items`,
  )

  for (const menuEntry of menuItems) {
    const itemId = typeof menuEntry.item === 'string' ? menuEntry.item : menuEntry.item?.id
    if (!itemId) continue

    const item = await payload.findByID({
      collection: 'menu-items',
      id: itemId,
      depth: 0,
      req,
    })

    if (item.restaurant !== restaurantId) {
      logger.error(
        `[${collection.slug}].fnbVerifyMenuItems.error: menu item ${itemId} does not belong to restaurant ${restaurantId}`,
      )
      throw new APIError(
        `Menu Item ${itemId} does not belong to the selected restaurant`,
        400,
      )
    }
  }

  return data
}
