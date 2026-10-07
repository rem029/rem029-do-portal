'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { Menu, MenuItem } from '@/payload-types'

export const getAllergensAction = async (language: string) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'menu-allergens',
      limit: 0,
      locale: language as any,
      where: {
        _status: {
          equals: 'published',
        },
      },
      overrideAccess: true,
    })

    return { success: true, data: docs }
  } catch (error) {
    console.error('Error fetching allergens:', error)
    return { success: false, error: 'Failed to fetch allergens' }
  }
}

export const getMenuItemsByCategoryAction = async (
  restaurantId: string,
  categorySlug: string,
  language: string,
) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'menu',
      locale: language as any,
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { 'category.slug': { equals: categorySlug } },
        ],
      },
      depth: 2,
      limit: 1,
      overrideAccess: true,
    })

    const menu = docs[0] as Menu | undefined
    const items = (menu?.menu_items || [])
      .map((mi) => mi.item as MenuItem)
      .filter(
        (item): item is MenuItem =>
          !!item && typeof item === 'object' && item._status !== 'draft',
      )

    return { success: true, data: items }
  } catch (error) {
    console.error('Error fetching menu items by category:', error)
    return { success: false, error: 'Failed to fetch menu items' }
  }
}

export const searchMenuItemsAction = async (
  restaurantId: string,
  searchText: string,
  language: string,
) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'menu-items',
      locale: language as any,
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { _status: { equals: 'published' } },
          {
            or: [{ title: { like: searchText } }, { description: { like: searchText } }],
          },
        ],
      },
      depth: 1,
      limit: 0,
      overrideAccess: true,
    })

    return { success: true, data: docs }
  } catch (error) {
    console.error('Error searching menu items:', error)
    return { success: false, error: 'Failed to search menu items' }
  }
}

/**
 * Resolves a set of item ids to their current title/price/image - used by the cart bar,
 * whose line items (persisted in localStorage) can outlive the on-demand category fetch
 * cache (e.g. after a page reload, before the user has browsed back into those categories).
 */
export const getMenuItemsByIdsAction = async (
  restaurantId: string,
  itemIds: string[],
  language: string,
) => {
  const payload = await getPayload({ config })

  try {
    if (itemIds.length === 0) {
      return { success: true, data: [] }
    }

    const { docs } = await payload.find({
      collection: 'menu-items',
      locale: language as any,
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { id: { in: itemIds } },
          { _status: { equals: 'published' } },
        ],
      },
      depth: 1,
      limit: 0,
      overrideAccess: true,
    })

    return { success: true, data: docs }
  } catch (error) {
    console.error('Error fetching menu items by id:', error)
    return { success: false, error: 'Failed to fetch menu items' }
  }
}

export const getMenuItemBySlugAction = async (
  restaurantId: string,
  slug: string,
  language: string,
) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'menu-items',
      locale: language as any,
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
        ],
      },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })

    return { success: true, data: docs[0] as MenuItem | undefined }
  } catch (error) {
    console.error('Error fetching menu item by slug:', error)
    return { success: false, error: 'Failed to fetch menu item' }
  }
}

export const getUncategorizedMenuItemsAction = async (
  restaurantId: string,
  language: string,
) => {
  const payload = await getPayload({ config })

  try {
    const { docs: menuDocs } = await payload.find({
      collection: 'menu',
      where: {
        restaurant: { equals: restaurantId },
      },
      depth: 0,
      limit: 0,
      overrideAccess: true,
    })

    const categorizedItemIds = new Set<string>()
    for (const menu of menuDocs) {
      if (Array.isArray(menu.menu_items)) {
        for (const mi of menu.menu_items) {
          if (!mi?.item) continue
          const itemId =
            typeof mi.item === 'object' && mi.item !== null && 'id' in mi.item
              ? String((mi.item as { id: string | number }).id)
              : String(mi.item)
          if (itemId) {
            categorizedItemIds.add(itemId)
          }
        }
      }
    }

    const { docs: allItems } = await payload.find({
      collection: 'menu-items',
      // Structural cast: language string to Payload find locale
      locale: language as unknown as Parameters<typeof payload.find>[0]['locale'],
      where: {
        and: [
          { restaurant: { equals: restaurantId } },
          { _status: { equals: 'published' } },
        ],
      },
      depth: 1,
      limit: 0,
      overrideAccess: true,
    })

    const uncategorizedItems = (allItems as MenuItem[]).filter(
      (item) => !categorizedItemIds.has(String(item.id)),
    )

    return { success: true, data: uncategorizedItems }
  } catch (error) {
    console.error('Error fetching uncategorized menu items:', error)
    return { success: false, error: 'Failed to fetch uncategorized menu items' }
  }
}

