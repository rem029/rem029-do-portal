'use server'

import { getPayload, type BasePayload, type RequiredDataFromCollectionSlug, type Where } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import { slugify } from 'payload/shared'
import type { User, UsersAccess, MenuMedia, FnbMenuEvent, Menu } from '@/payload-types'
import { hasUserAccess, isCollectionSuperUser } from '@/utilities/access'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

import { relId, menuSlug, resolveLocale, resolveString, type ConfiguredLocale } from './helpers'

export type VenueOption = {
  id: string
  title: string
}

export type ListVenuesResult =
  | { success: true; data: VenueOption[] }
  | { success: false; error: string }

export type CreateVenueResult =
  | { success: true; data: VenueOption }
  | { success: false; error: string }

export type CategoryRow = {
  id: string
  title: string
  hasMenuForVenue: boolean
}

export type ListCategoriesResult =
  | { success: true; data: CategoryRow[] }
  | { success: false; error: string }

export type CreateCategoryResult =
  | { success: true; data: CategoryRow & { menu?: MenuRow } }
  | { success: false; error: string }

export type MenuRow = {
  id: string
  title: string
  itemCount: number
  itemIds: string[]
}

export type ListEventMenusResult =
  | { success: true; data: { allMenus: MenuRow[] } }
  | { success: false; error: string }

export type ModifierGroupRow = {
  id?: string | null
  name: string
  input_type: 'checkbox' | 'radio'
  required: boolean
  options: { id?: string | null; label: string }[]
}

export type MenuItemRow = {
  id: string
  title: string
  description: string
  price: number | null
  inStock: boolean
  status: 'draft' | 'published'
  categoryIds: string[]
  categoryNames: string[]
  allergenIds: string[]
  tagIds: string[]
  imageId: string | null
  imageUrl: string | null
  modifierGroups: ModifierGroupRow[]
}

export type ToggleMenuItemStockResult =
  | { success: true; data: { inStock: boolean } }
  | { success: false; error: string }

export type ListMenuItemsResult =
  | { success: true; data: MenuItemRow[] }
  | { success: false; error: string }

export type OptionRow = { id: string; title: string }

export type ListOptionsResult =
  | { success: true; data: OptionRow[] }
  | { success: false; error: string }

export type CreateMenuItemResult =
  | { success: true; data: MenuItemRow }
  | { success: false; error: string }

export type CreateMenuResult =
  | { success: true; data: MenuRow }
  | { success: false; error: string }

export type UpdateCategoryResult =
  | { success: true; data: { id: string; title: string; menu?: MenuRow } }
  | { success: false; error: string }

export type UpdateMenuItemResult =
  | { success: true; data: MenuItemRow }
  | { success: false; error: string }

export type UpdateMenuItemsResult =
  | { success: true; data: { id: string; itemCount: number; itemIds: string[] } }
  | { success: false; error: string }

/**
 * Asserts that the authenticated user is allowed to create a venue for the given operator.
 * Allowed if super_user OR (hasUserAccess(user, 'fnb-menu-events', 'create') AND relId(user.operator) === String(operatorId)).
 */
async function assertCanCreateEventVenue(
  payload: BasePayload,
  headersList: Headers,
  operatorId: string | number,
): Promise<User> {
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }
  if (!user) {
    throw new Error('Unauthorized')
  }

  const isSuperUser =
    !!user.super_user || !!(user.access as UsersAccess)?.access?.some((a) => a.super_user)
  const userOpId = relId(user.operator)
  const canCreateEvent = hasUserAccess(user, 'fnb-menu-events', 'create')

  if (!isSuperUser && !(canCreateEvent && userOpId === String(operatorId))) {
    throw new Error('Forbidden')
  }

  return user
}

/**
 * Lists event_enabled restaurants for an operator.
 * super_user can query any operator; non-super users only their own operator.
 */
export async function listEventVenuesAction(args: {
  operatorId?: string | number
  query?: string
  selectedId?: string | number
}): Promise<ListVenuesResult> {
  try {
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!args.operatorId) {
      return { success: true, data: [] }
    }

    const isSuperUser =
      !!user.super_user || !!(user.access as UsersAccess)?.access?.some((a) => a.super_user)
    if (!isSuperUser) {
      const userOpId = relId(user.operator)
      if (!userOpId || userOpId !== String(args.operatorId)) {
        return { success: false, error: 'Forbidden: operator mismatch' }
      }
    }

    const trimmedQuery = args.query?.trim()
    const where: Where = {
      and: [
        { operator: { equals: args.operatorId } },
        { event_enabled: { equals: true } },
        ...(trimmedQuery ? [{ title: { like: trimmedQuery } }] : []),
      ],
    }

    const { docs } = await payload.find({
      collection: 'restaurants',
      where,
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })

    const results: VenueOption[] = docs.map((d) => ({
      id: String(d.id),
      title: d.title,
    }))

    // If selectedId was provided and not found in the search results, include it
    if (args.selectedId && !results.some((r) => String(r.id) === String(args.selectedId))) {
      try {
        const selectedDoc = await payload.findByID({
          collection: 'restaurants',
          id: String(args.selectedId),
          depth: 0,
          overrideAccess: true,
        })
        if (selectedDoc && relId(selectedDoc.operator) === String(args.operatorId)) {
          results.unshift({
            id: String(selectedDoc.id),
            title: selectedDoc.title,
          })
        }
      } catch {
        // Ignore if selected restaurant not found
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error in listEventVenuesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list venues',
    }
  }
}

/**
 * Creates a new event-enabled venue (restaurants collection) for the given operator.
 * Sets _status: 'published' and client-safe slug (retrying on unique collision).
 */
export async function createVenueAction(args: {
  title: string
  operatorId: string | number
}): Promise<CreateVenueResult> {
  try {
    const trimmedTitle = args.title?.trim()
    if (!trimmedTitle) {
      return { success: false, error: 'Venue title is required.' }
    }
    if (!args.operatorId) {
      return { success: false, error: 'An operator must be selected first.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })

    await assertCanCreateEventVenue(payload, headersList, args.operatorId)

    let slug = (slugify(trimmedTitle) || '').replace(/^[^a-z0-9]+/, '')
    if (!slug) {
      slug = `venue-${Date.now()}`
    }

    let created
    try {
      created = await payload.create({
        collection: 'restaurants',
        // Structural cast: operator_slug is generated server-side via beforeValidate hook
        data: {
          title: trimmedTitle,
          operator: String(args.operatorId),
          event_enabled: true,
          slug,
          _status: 'published',
        } as unknown as RequiredDataFromCollectionSlug<'restaurants'>,
        overrideAccess: true,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isCollision =
        errMsg.includes('unique') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('Slug') ||
        errMsg.includes('slug') ||
        errMsg.includes('23505')

      if (isCollision) {
        const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
        created = await payload.create({
          collection: 'restaurants',
          // Structural cast: operator_slug is generated server-side via beforeValidate hook
          data: {
            title: trimmedTitle,
            operator: String(args.operatorId),
            event_enabled: true,
            slug: fallbackSlug,
            _status: 'published',
          } as unknown as RequiredDataFromCollectionSlug<'restaurants'>,
          overrideAccess: true,
        })
      } else {
        throw err
      }
    }

    return {
      success: true,
      data: {
        id: String(created.id),
        title: created.title,
      },
    }
  } catch (error) {
    console.error('Error in createVenueAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create venue',
    }
  }
}

/**
 * Asserts that the authenticated user is allowed to edit this event's menu.
 * Requires event to be saved first and to have operator and restaurant (Venue) set.
 * Allowed if super_user OR (hasUserAccess(user, 'fnb-menu-events', 'update') AND relId(user.operator) === operatorId).
 */
export async function assertCanEditEventMenu(
  payload: BasePayload,
  headersList: Headers,
  eventId: string,
): Promise<{ user: User; operatorId: string; restaurantId: string }> {
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }
  if (!user) throw new Error('Unauthorized')
  if (!eventId) throw new Error('An event must be saved first.')

  const event = await payload.findByID({
    collection: 'fnb-menu-events',
    id: eventId,
    depth: 0,
    overrideAccess: true,
  })
  if (!event) throw new Error('Event not found.')

  const operatorId = relId(event.operator)
  const restaurantId = relId(event.restaurant)
  if (!operatorId || !restaurantId) {
    throw new Error('The event needs an operator and a Venue first.')
  }

  const isSuper = isCollectionSuperUser(user, 'fnb-menu-events')
  const canUpdateEvent = hasUserAccess(user, 'fnb-menu-events', 'update')
  const sameOperator = relId(user.operator) === operatorId
  const ownerIds = (event.owners ?? []).map(relId)
  const isOwner = relId(event.created_by) === String(user.id) || ownerIds.includes(String(user.id))

  if (!isSuper && !(canUpdateEvent && sameOperator && isOwner)) {
    throw new Error('Forbidden')
  }
  return { user, operatorId, restaurantId }
}

/**
 * Lists menu-categories for the event's operator, indicating whether a menu exists
 * for the category at this event's venue.
 */
export async function listCategoriesAction(args: {
  eventId: string
  locale?: string
}): Promise<ListCategoriesResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const categories = await payload.find({
      collection: 'menu-categories',
      where: { operator: { equals: operatorId } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      sort: 'title',
      locale: targetLocale,
    })

    const withMenu = new Set<string>()
    if (categories.docs.length > 0) {
      const menus = await payload.find({
        collection: 'menu',
        where: {
          and: [
            { restaurant: { equals: restaurantId } },
            { category: { in: categories.docs.map((c) => c.id) } },
          ],
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
        draft: true,
      })
      for (const m of menus.docs) {
        const catId = relId(m.category)
        if (catId) {
          withMenu.add(catId)
        }
      }
    }

    return {
      success: true,
      data: categories.docs.map((c) => ({
        id: String(c.id),
        title: resolveString(c.title, targetLocale),
        hasMenuForVenue: withMenu.has(String(c.id)),
      })),
    }
  } catch (error) {
    console.error('Error in listCategoriesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list categories',
    }
  }
}

/**
 * Creates a new menu-category for the event's operator.
 * Explicitly generates slug (with collision retry). Rejects duplicate title for the operator.
 */
export async function createCategoryAction(args: {
  eventId: string
  title: string
  locale?: string
  addToVenueMenu?: boolean
}): Promise<CreateCategoryResult> {
  try {
    const trimmedTitle = args.title?.trim()
    if (!trimmedTitle) {
      return { success: false, error: 'Category title is required.' }
    }
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const existing = await payload.find({
      collection: 'menu-categories',
      where: {
        and: [
          { operator: { equals: operatorId } },
          { title: { equals: trimmedTitle } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      locale: targetLocale,
    })

    if (existing.docs.length > 0) {
      return {
        success: false,
        error: `A category called "${trimmedTitle}" already exists.`,
      }
    }

    let slug = (slugify(trimmedTitle) || '').replace(/^[^a-z0-9]+/, '')
    if (!slug) {
      slug = `category-${Date.now()}`
    }

    let created
    try {
      created = await payload.create({
        collection: 'menu-categories',
        // Structural cast: operator_slug is generated server-side via beforeValidate hook
        data: {
          title: trimmedTitle,
          operator: operatorId,
          slug,
        } as unknown as RequiredDataFromCollectionSlug<'menu-categories'>,
        overrideAccess: true,
        locale: targetLocale,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isCollision =
        errMsg.includes('unique') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('Slug') ||
        errMsg.includes('slug') ||
        errMsg.includes('23505')

      if (isCollision) {
        const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
        created = await payload.create({
          collection: 'menu-categories',
          // Structural cast: operator_slug is generated server-side via beforeValidate hook
          data: {
            title: trimmedTitle,
            operator: operatorId,
            slug: fallbackSlug,
          } as unknown as RequiredDataFromCollectionSlug<'menu-categories'>,
          overrideAccess: true,
          locale: targetLocale,
        })
      } else {
        throw err
      }
    }

    const categoryTitle = resolveString(created.title, targetLocale) || trimmedTitle

    let menu: MenuRow | undefined
    if (args.addToVenueMenu) {
      menu = await createMenuDoc(payload, {
        operatorId,
        restaurantId,
        categoryId: String(created.id),
        categoryTitle,
        itemIds: [],
        locale: targetLocale,
      })
    }

    return {
      success: true,
      data: {
        id: String(created.id),
        title: categoryTitle,
        hasMenuForVenue: Boolean(menu),
        menu,
      },
    }
  } catch (error) {
    console.error('Error in createCategoryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    }
  }
}

/**
 * Lists all menus for the event's venue.
 */
export async function listEventMenusAction(args: {
  eventId: string
  locale?: string
}): Promise<ListEventMenusResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const all = await payload.find({
      collection: 'menu',
      where: { restaurant: { equals: restaurantId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
      draft: true,
      locale: targetLocale,
    })

    // Resolve titles: prefer category_title; fall back to looking up category title if empty
    const missingCatIds = Array.from(
      new Set(
        all.docs
          .filter((m) => !m.category_title && relId(m.category))
          .map((m) => relId(m.category)),
      ),
    )

    const catTitleMap = new Map<string, string>()
    if (missingCatIds.length > 0) {
      const cats = await payload.find({
        collection: 'menu-categories',
        where: { id: { in: missingCatIds } },
        limit: missingCatIds.length,
        depth: 0,
        overrideAccess: true,
        locale: targetLocale,
      })
      for (const cat of cats.docs) {
        const title = resolveString(cat.title, targetLocale)
        catTitleMap.set(String(cat.id), title)
      }
    }

    const allMenus: MenuRow[] = all.docs.map((m) => {
      const id = String(m.id)
      const catId = relId(m.category)
      let title = resolveString(m.category_title, targetLocale)
      if (!title && catId) {
        title = catTitleMap.get(catId) || ''
      }
      if (!title) {
        title = m.slug || `Menu ${id.slice(0, 6)}`
      }
      const itemCount = Array.isArray(m.menu_items) ? m.menu_items.length : 0
      const itemIds = Array.isArray(m.menu_items)
        ? m.menu_items.map((mi) => relId(mi.item)).filter(Boolean)
        : []
      return { id, title, itemCount, itemIds }
    })

    return { success: true, data: { allMenus } }
  } catch (error) {
    console.error('Error in listEventMenusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list event menus',
    }
  }
}

export type GetItemCategoriesResult =
  | { success: true; data: string[] }
  | { success: false; error: string }

/**
 * Reverse lookup: which categories is this item currently in, for this venue?
 * `menu-items` carries no category field of its own - an item's categories are
 * derived entirely from which venue Menu doc(s) list it in their menu_items[].
 *
 * Deliberately on-demand only - called once, when a specific item is opened to
 * edit (to seed the category picker's initial selection), never for a whole
 * item list. Fetches all of the venue's Menu docs (same bounded, cheap query
 * listEventMenusAction already uses) and filters in JS rather than a nested
 * array-field `where` query, matching that action's existing pattern.
 */
export async function getItemCategoriesAction(args: {
  eventId: string
  itemId: string
  locale?: string
}): Promise<GetItemCategoriesResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const { docs } = await payload.find({
      collection: 'menu',
      where: { restaurant: { equals: restaurantId } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
      draft: true,
      locale: targetLocale,
    })

    const categoryIds = docs
      .filter((m) =>
        Array.isArray(m.menu_items) && m.menu_items.some((mi) => relId(mi.item) === args.itemId),
      )
      .map((m) => relId(m.category))
      .filter(Boolean)

    return { success: true, data: categoryIds }
  } catch (error) {
    console.error('Error in getItemCategoriesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load item categories',
    }
  }
}

/**
 * Lists menu-items for the event's venue, optionally filtered by search text.
 * Note: menu-items has no category field, so categoryId is ignored.
 */
export async function listMenuItemsAction(args: {
  eventId: string
  categoryId?: string
  search?: string
  locale?: string
}): Promise<ListMenuItemsResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const trimmedSearch = args.search?.trim()
    const where: Where = {
      and: [
        { restaurant: { equals: restaurantId } },
        ...(trimmedSearch
          ? [
              {
                or: [
                  { title: { like: trimmedSearch } },
                  { description: { like: trimmedSearch } },
                ],
              },
            ]
          : []),
      ],
    }

    const [itemsResult, menusResult] = await Promise.all([
      payload.find({
        collection: 'menu-items',
        where,
        limit: 200,
        depth: 1,
        overrideAccess: true,
        sort: 'title',
        locale: targetLocale,
        draft: true,
      }),
      payload.find({
        collection: 'menu',
        where: { restaurant: { equals: restaurantId } },
        limit: 500,
        depth: 0,
        overrideAccess: true,
        draft: true,
        locale: targetLocale,
      }),
    ])

    const missingCatIds = Array.from(
      new Set(
        menusResult.docs
          .filter((m) => !m.category_title && relId(m.category))
          .map((m) => relId(m.category)),
      ),
    )

    const catTitleMap = new Map<string, string>()
    if (missingCatIds.length > 0) {
      const cats = await payload.find({
        collection: 'menu-categories',
        where: { id: { in: missingCatIds } },
        limit: missingCatIds.length,
        depth: 0,
        overrideAccess: true,
        locale: targetLocale,
      })
      for (const cat of cats.docs) {
        const title = resolveString(cat.title, targetLocale)
        catTitleMap.set(String(cat.id), title)
      }
    }

    const itemCategoryIdsMap = new Map<string, string[]>()
    const itemCategoryNamesMap = new Map<string, string[]>()

    for (const m of menusResult.docs) {
      const catId = relId(m.category)
      let title = resolveString(m.category_title, targetLocale)
      if (!title && catId) {
        title = catTitleMap.get(catId) || ''
      }
      if (Array.isArray(m.menu_items)) {
        for (const mi of m.menu_items) {
          const itemId = relId(mi.item)
          if (!itemId) continue

          if (catId) {
            const existingIds = itemCategoryIdsMap.get(itemId) || []
            if (!existingIds.includes(catId)) {
              existingIds.push(catId)
              itemCategoryIdsMap.set(itemId, existingIds)
            }
          }
          if (title) {
            const existingNames = itemCategoryNamesMap.get(itemId) || []
            if (!existingNames.includes(title)) {
              existingNames.push(title)
              itemCategoryNamesMap.set(itemId, existingNames)
            }
          }
        }
      }
    }

    const data: MenuItemRow[] = itemsResult.docs.map((d) => {
      const itemId = String(d.id)
      const imageDoc = d.image && typeof d.image === 'object' ? (d.image as MenuMedia) : null
      return {
        id: itemId,
        title: resolveString(d.title, targetLocale),
        description: resolveString(d.description, targetLocale),
        price: typeof d.price === 'number' ? d.price : null,
        inStock: d.in_stock !== false,
        status: (d._status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
        categoryIds: itemCategoryIdsMap.get(itemId) ?? [],
        categoryNames: itemCategoryNamesMap.get(itemId) ?? [],
        allergenIds: (d.allergen ?? []).map(relId).filter(Boolean),
        tagIds: (d.tags ?? []).map(relId).filter(Boolean),
        imageId: d.image ? String(relId(d.image)) : null,
        imageUrl:
          imageDoc && imageDoc.filename
            ? `${BACKEND_URL_WITH_BASE}/api/menu-media/file/${imageDoc.filename}`
            : null,
        modifierGroups: (d.modifier_groups ?? []).map((g) => ({
          id: g.id ? String(g.id) : undefined,
          name: resolveString(g.name, targetLocale),
          input_type: g.input_type,
          required: !!g.required,
          options: (g.options ?? []).map((o) => ({
            id: o.id ? String(o.id) : undefined,
            label: resolveString(o.label, targetLocale),
          })),
        })),
      }
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error in listMenuItemsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list menu items',
    }
  }
}

/**
 * Toggles an item's in_stock flag directly without touching other fields.
 */
export async function toggleMenuItemStockAction(args: {
  eventId: string
  itemId: string
  inStock: boolean
}): Promise<ToggleMenuItemStockResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }
    if (!args.itemId) {
      return { success: false, error: 'Item ID is required.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    let item
    try {
      item = await payload.findByID({
        collection: 'menu-items',
        id: args.itemId,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      // Handled below
    }

    if (!item) {
      return { success: false, error: 'Menu item not found.' }
    }

    if (relId(item.restaurant) !== restaurantId) {
      return { success: false, error: 'Menu item not found for this venue.' }
    }

    await payload.update({
      collection: 'menu-items',
      id: args.itemId,
      data: {
        in_stock: args.inStock,
      } as unknown as RequiredDataFromCollectionSlug<'menu-items'>,
      overrideAccess: true,
    })

    return { success: true, data: { inStock: args.inStock } }
  } catch (error) {
    console.error('Error in toggleMenuItemStockAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item stock',
    }
  }
}

/**
 * Creates a new menu doc for the event's venue and category with the chosen item IDs.
 * Pre-checks that the category doesn't already have a menu for the venue,
 * verifies items belong to the venue, and generates a deterministic slug.
 */
/**
 * Creates the `menu` doc for a {category, venue} pair (with a collision-retried slug).
 * Shared by `createMenuAction` (explicit item picks) and `createCategoryAction`
 * (creates an empty menu when "add to venue menu" is checked).
 */
async function createMenuDoc(
  payload: BasePayload,
  args: {
    operatorId: string
    restaurantId: string
    categoryId: string
    categoryTitle: string
    itemIds: string[]
    locale: ConfiguredLocale
  },
): Promise<MenuRow> {
  const { operatorId, restaurantId, categoryId, categoryTitle, itemIds, locale } = args

  const restaurant = await payload.findByID({
    collection: 'restaurants',
    id: restaurantId,
    depth: 0,
    overrideAccess: true,
  })
  const restaurantSlug =
    restaurant?.slug || (slugify(restaurant?.title || '') || '').replace(/^[^a-z0-9]+/, '')

  const slug = menuSlug(categoryTitle, restaurantSlug)

  const buildData = (s: string) =>
    ({
      operator: operatorId,
      restaurant: restaurantId,
      category: categoryId,
      slug: s,
      menu_items: itemIds.map((id) => ({ item: id })),
    }) as unknown as RequiredDataFromCollectionSlug<'menu'>

  let created
  try {
    created = await payload.create({
      collection: 'menu',
      // Structural cast: operator_slug, category_title, and restaurant_title are derived server-side
      data: buildData(slug),
      overrideAccess: true,
      locale,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const isCollision =
      errMsg.includes('unique') ||
      errMsg.includes('duplicate') ||
      errMsg.includes('Slug') ||
      errMsg.includes('slug') ||
      errMsg.includes('23505')

    if (!isCollision) throw err

    const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
    created = await payload.create({
      collection: 'menu',
      // Structural cast: operator_slug, category_title, and restaurant_title are derived server-side
      data: buildData(fallbackSlug),
      overrideAccess: true,
      locale,
    })
  }

  return {
    id: String(created.id),
    title: categoryTitle,
    itemCount: itemIds.length,
    itemIds,
  }
}

export async function createMenuAction(args: {
  eventId: string
  categoryId: string
  itemIds: string[]
  locale?: string
}): Promise<CreateMenuResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }
    const trimmedCategoryId = args.categoryId?.trim()
    if (!trimmedCategoryId) {
      return { success: false, error: 'Category is required.' }
    }
    if (!Array.isArray(args.itemIds) || args.itemIds.length === 0) {
      return { success: false, error: 'Pick at least one item.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    // Load the category
    const category = await payload.findByID({
      collection: 'menu-categories',
      id: trimmedCategoryId,
      depth: 0,
      overrideAccess: true,
      locale: targetLocale,
    })
    if (!category) {
      return { success: false, error: 'Category not found.' }
    }

    const categoryTitle = resolveString(category.title, targetLocale)

    // Pre-check unique constraint: one menu per {category, venue}
    const existing = await payload.find({
      collection: 'menu',
      where: {
        and: [
          { category: { equals: trimmedCategoryId } },
          { restaurant: { equals: restaurantId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
      locale: targetLocale,
    })

    if (existing.docs.length > 0) {
      return {
        success: false,
        error:
          'This category already has a menu for this venue. Remove it from the event or edit that menu instead.',
      }
    }

    // Verify every item belongs to the venue
    const foundItems = await payload.find({
      collection: 'menu-items',
      where: {
        and: [
          { id: { in: args.itemIds } },
          { restaurant: { equals: restaurantId } },
        ],
      },
      limit: args.itemIds.length,
      depth: 0,
      overrideAccess: true,
      locale: targetLocale,
    })

    if (foundItems.totalDocs !== args.itemIds.length) {
      return {
        success: false,
        error: 'Some selected items are not available for this venue.',
      }
    }

    const menu = await createMenuDoc(payload, {
      operatorId,
      restaurantId,
      categoryId: trimmedCategoryId,
      categoryTitle,
      itemIds: args.itemIds,
      locale: targetLocale,
    })

    return { success: true, data: menu }
  } catch (error) {
    console.error('Error in createMenuAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create menu',
    }
  }
}

/**
 * Lists menu-allergens for the event's operator.
 */
export async function listAllergensAction(args: {
  eventId: string
  locale?: string
}): Promise<ListOptionsResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const result = await payload.find({
      collection: 'menu-allergens',
      where: { operator: { equals: operatorId } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      sort: 'title',
      locale: targetLocale,
    })

    return {
      success: true,
      data: result.docs.map((d) => ({
        id: String(d.id),
        title: resolveString(d.title, targetLocale),
      })),
    }
  } catch (error) {
    console.error('Error in listAllergensAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list allergens',
    }
  }
}

/**
 * Lists menu-tags for the event's operator.
 */
export async function listTagsAction(args: {
  eventId: string
  locale?: string
}): Promise<ListOptionsResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    const result = await payload.find({
      collection: 'menu-tags',
      where: { operator: { equals: operatorId } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      sort: 'title',
      locale: targetLocale,
    })

    return {
      success: true,
      data: result.docs.map((d) => ({
        id: String(d.id),
        title: resolveString(d.title, targetLocale),
      })),
    }
  } catch (error) {
    console.error('Error in listTagsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tags',
    }
  }
}

function validateModifierGroups(groups?: ModifierGroupRow[]): string | null {
  if (!groups || groups.length === 0) return null
  for (const group of groups) {
    if (!group.name || !group.name.trim()) {
      return 'Modifier group name is required.'
    }
    if (group.input_type !== 'checkbox' && group.input_type !== 'radio') {
      return 'Modifier group input type must be checkbox or radio.'
    }
    if (!group.options || group.options.length === 0) {
      return `Modifier group "${group.name.trim()}" must have at least one option.`
    }
    for (const opt of group.options) {
      if (!opt.label || !opt.label.trim()) {
        return `Option label in modifier group "${group.name.trim()}" cannot be empty.`
      }
    }
  }
  return null
}

/**
 * Uploads an image to menu-media for an event menu item.
 * Gated via assertCanEditEventMenu to ensure operator ownership and event edit permissions.
 */
export async function uploadMenuItemImageAction(
  eventId: string,
  formData: FormData,
): Promise<{ success: true; data: { id: string; url: string } } | { success: false; error: string }> {
  try {
    if (!eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const file = formData.get('file') as File | null
    if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
      return { success: false, error: 'No file provided' }
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Only image files are allowed.' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Image size must be less than 5MB.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId } = await assertCanEditEventMenu(payload, headersList, eventId)

    const media = await payload.create({
      collection: 'menu-media',
      // Structural cast: operator is required on menu-media
      data: {
        operator: operatorId,
      } as unknown as RequiredDataFromCollectionSlug<'menu-media'>,
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        name: file.name,
        mimetype: file.type,
        size: file.size,
      },
      overrideAccess: true,
    })

    return {
      success: true,
      data: {
        id: String(media.id),
        url: `${BACKEND_URL_WITH_BASE}/api/menu-media/file/${media.filename}`,
      },
    }
  } catch (error) {
    console.error('Error in uploadMenuItemImageAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    }
  }
}

/**
 * Syncs menu documents when an item's categories are added or removed.
 * Builder-only: called exclusively from createMenuItemAction/updateMenuItemAction
 * below. Deliberately NOT a menu-items collection hook — category assignment is
 * a one-way flow through the event builder's own actions, not a general
 * Payload-level side effect (2026-09-15 decision, after a collection-hook
 * version caused a request hang and confusing duplicate Menu docs).
 *
 * For each added category:
 * - Finds or creates the venue's Menu doc for {category, restaurant}.
 * - Ensures itemId is present in that Menu's menu_items[].
 * - If the event's c.menus is non-empty, appends the Menu id there.
 *
 * For each removed category:
 * - Finds the venue's Menu doc for {category, restaurant}.
 * - Removes itemId from that Menu's menu_items[].
 * - Leaves the Menu doc in place even if empty.
 */
async function syncMenusForItemCategories(
  payload: BasePayload,
  args: {
    operatorId: string
    restaurantId: string
    itemId: string
    addedCategoryIds: string[]
    removedCategoryIds: string[]
    locale?: ConfiguredLocale
    eventId?: string
  },
): Promise<void> {
  const {
    operatorId,
    restaurantId,
    itemId,
    addedCategoryIds,
    removedCategoryIds,
    locale = 'en',
    eventId,
  } = args

  if (addedCategoryIds.length === 0 && removedCategoryIds.length === 0) {
    return
  }

  // Handle added categories
  const touchedMenuIds: string[] = []
  for (const catId of addedCategoryIds) {
    const trimmedCategoryId = catId.trim()
    if (!trimmedCategoryId) continue

    // Find existing Menu for {category, venue}
    const existing = await payload.find({
      collection: 'menu',
      where: {
        and: [
          { category: { equals: trimmedCategoryId } },
          { restaurant: { equals: restaurantId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
      locale,
    })

    if (existing.docs.length > 0) {
      const menu = existing.docs[0]
      const menuId = String(menu.id)
      touchedMenuIds.push(menuId)
      const currentItems = (menu.menu_items ?? []).map((i) => ({
        ...i,
        item: relId(i.item),
      }))
      const hasItem = currentItems.some((i) => i.item === itemId)
      if (!hasItem) {
        await payload.update({
          collection: 'menu',
          id: menuId,
          // Structural cast: payload Menu update expects typed menu_items array
          data: {
            menu_items: [...currentItems, { item: itemId }],
          } as unknown as Partial<Menu>,
          overrideAccess: true,
          locale,
        })
      }
    } else {
      // Create new Menu for {category, venue}
      const categoryDoc = await payload.findByID({
        collection: 'menu-categories',
        id: trimmedCategoryId,
        depth: 0,
        overrideAccess: true,
        locale,
      })
      const categoryTitle = categoryDoc ? resolveString(categoryDoc.title, locale) : ''

      const restaurant = await payload.findByID({
        collection: 'restaurants',
        id: restaurantId,
        depth: 0,
        overrideAccess: true,
      })
      const restaurantSlug =
        restaurant?.slug || (slugify(restaurant?.title || '') || '').replace(/^[^a-z0-9]+/, '')

      const slug = menuSlug(categoryTitle, restaurantSlug)

      let created
      try {
        created = await payload.create({
          collection: 'menu',
          // Structural cast: operator_slug, category_title, and restaurant_title are derived server-side
          data: {
            operator: operatorId,
            restaurant: restaurantId,
            category: trimmedCategoryId,
            slug,
            menu_items: [{ item: itemId }],
          } as unknown as RequiredDataFromCollectionSlug<'menu'>,
          overrideAccess: true,
          locale,
        })
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        const isCollision =
          errMsg.includes('unique') ||
          errMsg.includes('duplicate') ||
          errMsg.includes('Slug') ||
          errMsg.includes('slug') ||
          errMsg.includes('23505')

        if (isCollision) {
          const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
          created = await payload.create({
            collection: 'menu',
            // Structural cast: operator_slug, category_title, and restaurant_title are derived server-side
            data: {
              operator: operatorId,
              restaurant: restaurantId,
              category: trimmedCategoryId,
              slug: fallbackSlug,
              menu_items: [{ item: itemId }],
            } as unknown as RequiredDataFromCollectionSlug<'menu'>,
            overrideAccess: true,
            locale,
          })
        } else {
          throw err
        }
      }
      touchedMenuIds.push(String(created.id))
    }
  }

  // Handle removed categories
  for (const catId of removedCategoryIds) {
    const trimmedCategoryId = catId.trim()
    if (!trimmedCategoryId) continue

    const existing = await payload.find({
      collection: 'menu',
      where: {
        and: [
          { category: { equals: trimmedCategoryId } },
          { restaurant: { equals: restaurantId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
      locale,
    })

    if (existing.docs.length > 0) {
      const menu = existing.docs[0]
      const menuId = String(menu.id)
      const currentItems = (menu.menu_items ?? []).map((i) => ({
        ...i,
        item: relId(i.item),
      }))
      const filtered = currentItems.filter((i) => i.item !== itemId)
      if (filtered.length !== currentItems.length) {
        await payload.update({
          collection: 'menu',
          id: menuId,
          // Structural cast: payload Menu update expects typed menu_items array
          data: {
            menu_items: filtered,
          } as unknown as Partial<Menu>,
          overrideAccess: true,
          locale,
        })
      }
    }
  }

  // Handle event's c.menus opt-in filter (§2 point 5)
  if (eventId && touchedMenuIds.length > 0) {
    try {
      const event = await payload.findByID({
        collection: 'fnb-menu-events',
        id: eventId,
        depth: 0,
        overrideAccess: true,
      })

      if (event?.c?.menus && Array.isArray(event.c.menus) && event.c.menus.length > 0) {
        const currentMenuIds = event.c.menus.map(relId).filter(Boolean)
        const toAdd = touchedMenuIds.filter((id) => !currentMenuIds.includes(id))
        if (toAdd.length > 0) {
          await payload.update({
            collection: 'fnb-menu-events',
            id: eventId,
            data: {
              c: {
                ...event.c,
                menus: [...currentMenuIds, ...toAdd],
              },
            },
            overrideAccess: true,
          })
        }
      }
    } catch (eventErr) {
      console.error('Error updating event c.menus during item sync:', eventErr)
    }
  }
}

/**
 * Creates a new menu-item for the event's venue.
 * Generates client-safe slug (with collision retry).
 */
export async function createMenuItemAction(args: {
  eventId: string
  title: string
  description?: string
  price: number
  inStock?: boolean
  status?: 'draft' | 'published'
  categoryIds?: string[]
  allergenIds?: string[]
  tagIds?: string[]
  imageId?: string | null
  imageUrl?: string | null
  modifierGroups?: ModifierGroupRow[]
  locale?: string
}): Promise<CreateMenuItemResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }
    const trimmedTitle = args.title?.trim()
    if (!trimmedTitle) {
      return { success: false, error: 'Item title is required.' }
    }
    if (typeof args.price !== 'number' || !Number.isFinite(args.price) || args.price < 0) {
      return { success: false, error: 'Enter a valid price.' }
    }

    const modGroupErr = validateModifierGroups(args.modifierGroups)
    if (modGroupErr) {
      return { success: false, error: modGroupErr }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    let slug = (slugify(trimmedTitle) || '').replace(/^[^a-z0-9]+/, '')
    if (!slug) {
      slug = `item-${Date.now()}`
    }

    const mappedModifierGroups = (args.modifierGroups ?? []).map((g) => ({
      ...(g.id ? { id: g.id } : {}),
      name: g.name.trim(),
      input_type: g.input_type,
      required: Boolean(g.required),
      options: g.options.map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label.trim(),
      })),
    }))

    let created
    try {
      created = await payload.create({
        collection: 'menu-items',
        // Structural cast: operator_slug is generated server-side via beforeValidate hook
        data: {
          operator: operatorId,
          restaurant: restaurantId,
          title: trimmedTitle,
          description: args.description?.trim() || '',
          slug,
          price: args.price,
          in_stock: args.inStock !== false,
          _status: args.status ?? 'published',
          image: args.imageId ?? null,
          allergen: args.allergenIds ?? [],
          tags: args.tagIds ?? [],
          modifier_groups: mappedModifierGroups,
        } as unknown as RequiredDataFromCollectionSlug<'menu-items'>,
        overrideAccess: true,
        locale: targetLocale,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isCollision =
        errMsg.includes('unique') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('Slug') ||
        errMsg.includes('slug') ||
        errMsg.includes('23505')

      if (isCollision) {
        const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
        created = await payload.create({
          collection: 'menu-items',
          // Structural cast: operator_slug is generated server-side via beforeValidate hook
          data: {
            operator: operatorId,
            restaurant: restaurantId,
            title: trimmedTitle,
            description: args.description?.trim() || '',
            slug: fallbackSlug,
            price: args.price,
            in_stock: args.inStock !== false,
            _status: args.status ?? 'published',
            image: args.imageId ?? null,
            allergen: args.allergenIds ?? [],
            tags: args.tagIds ?? [],
            modifier_groups: mappedModifierGroups,
          } as unknown as RequiredDataFromCollectionSlug<'menu-items'>,
          overrideAccess: true,
          locale: targetLocale,
        })
      } else {
        throw err
      }
    }

    const categoryIds = (args.categoryIds ?? []).map((id) => id.trim()).filter(Boolean)
    if (categoryIds.length > 0) {
      try {
        await syncMenusForItemCategories(payload, {
          operatorId,
          restaurantId,
          itemId: String(created.id),
          addedCategoryIds: categoryIds,
          removedCategoryIds: [],
          locale: targetLocale,
          eventId: args.eventId,
        })
      } catch (syncErr) {
        console.error('Failed to sync menus for item categories:', syncErr)
      }
    }

    let categoryNames: string[] = []
    if (categoryIds.length > 0) {
      try {
        const catDocs = await payload.find({
          collection: 'menu-categories',
          where: { id: { in: categoryIds } },
          limit: categoryIds.length,
          depth: 0,
          overrideAccess: true,
          locale: targetLocale,
        })
        categoryNames = catDocs.docs.map((c) => resolveString(c.title, targetLocale)).filter(Boolean)
      } catch {
        // Non-fatal
      }
    }

    let resolvedImageUrl = args.imageUrl ?? null
    if (args.imageId && !resolvedImageUrl) {
      try {
        const mediaDoc = await payload.findByID({
          collection: 'menu-media',
          id: args.imageId,
          depth: 0,
          overrideAccess: true,
        })
        if (mediaDoc?.filename) {
          resolvedImageUrl = `${BACKEND_URL_WITH_BASE}/api/menu-media/file/${mediaDoc.filename}`
        }
      } catch {
        // Non-fatal
      }
    }

    return {
      success: true,
      data: {
        id: String(created.id),
        title: resolveString(created.title, targetLocale) || trimmedTitle,
        description:
          resolveString(created.description, targetLocale) || args.description?.trim() || '',
        price: typeof created.price === 'number' ? created.price : null,
        inStock: created.in_stock !== false,
        status: (created._status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
        categoryIds: args.categoryIds ?? [],
        categoryNames,
        allergenIds: args.allergenIds ?? [],
        tagIds: args.tagIds ?? [],
        imageId: args.imageId ? String(args.imageId) : null,
        imageUrl: resolvedImageUrl,
        modifierGroups: (created.modifier_groups ?? mappedModifierGroups).map((g) => ({
          id: g.id ? String(g.id) : undefined,
          name: resolveString(g.name, targetLocale) || g.name,
          input_type: g.input_type,
          required: Boolean(g.required),
          options: (g.options ?? []).map((o) => ({
            id: o.id ? String(o.id) : undefined,
            label: resolveString(o.label, targetLocale) || o.label,
          })),
        })),
      },
    }
  } catch (error) {
    console.error('Error in createMenuItemAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create menu item',
    }
  }
}

/**
 * Updates a menu-category title for the event's operator.
 * Explicitly rejects empty title, checks tenant operator ownership,
 * verifies duplicate title for operator, and updates title.
 * Preserves slug and operator_slug.
 */
export async function updateCategoryAction(args: {
  eventId: string
  categoryId: string
  title: string
  locale?: string
  addToVenueMenu?: boolean
}): Promise<UpdateCategoryResult> {
  try {
    const trimmedTitle = args.title?.trim()
    if (!trimmedTitle) {
      return { success: false, error: 'Category title is required.' }
    }
    if (!args.categoryId) {
      return { success: false, error: 'Category ID is required.' }
    }
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    let category
    try {
      category = await payload.findByID({
        collection: 'menu-categories',
        id: args.categoryId,
        depth: 0,
        overrideAccess: true,
        locale: targetLocale,
      })
    } catch {
      // Ignored, handled below
    }

    if (!category) {
      return { success: false, error: 'Category not found.' }
    }

    if (relId(category.operator) !== operatorId) {
      return { success: false, error: 'Category not found for this operator.' }
    }

    const existing = await payload.find({
      collection: 'menu-categories',
      where: {
        and: [
          { operator: { equals: operatorId } },
          { title: { equals: trimmedTitle } },
          { id: { not_equals: args.categoryId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      locale: targetLocale,
    })

    if (existing.docs.length > 0) {
      return {
        success: false,
        error: `A category called "${trimmedTitle}" already exists.`,
      }
    }

    const updated = await payload.update({
      collection: 'menu-categories',
      id: args.categoryId,
      data: {
        title: trimmedTitle,
      },
      overrideAccess: true,
      locale: targetLocale,
    })

    const categoryTitle = resolveString(updated.title, targetLocale) || trimmedTitle

    let menu: MenuRow | undefined
    if (args.addToVenueMenu) {
      // Defensive re-check — the UI only offers this checkbox when the category has no
      // menu yet, but guard the unique {category, venue} constraint server-side too.
      const existingMenu = await payload.find({
        collection: 'menu',
        where: {
          and: [
            { category: { equals: args.categoryId } },
            { restaurant: { equals: restaurantId } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        draft: true,
      })

      if (existingMenu.docs.length === 0) {
        menu = await createMenuDoc(payload, {
          operatorId,
          restaurantId,
          categoryId: args.categoryId,
          categoryTitle,
          itemIds: [],
          locale: targetLocale,
        })
      }
    }

    return {
      success: true,
      data: {
        id: String(updated.id),
        title: categoryTitle,
        menu,
      },
    }
  } catch (error) {
    console.error('Error in updateCategoryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    }
  }
}

/**
 * Updates a menu-item (title, price, allergens, tags) for the event's venue.
 * Verifies item belongs to venue's restaurant. No duplicate-title check.
 */
export async function updateMenuItemAction(args: {
  eventId: string
  itemId: string
  title: string
  description?: string
  price: number
  inStock?: boolean
  status?: 'draft' | 'published'
  categoryIds?: string[]
  // The item's categories immediately before this edit, as the client last
  // fetched them (via getItemCategoriesAction when the edit form opened).
  // menu-items has no category field of its own to read this from server-side
  // - see getItemCategoriesAction's doc comment.
  previousCategoryIds?: string[]
  allergenIds?: string[]
  tagIds?: string[]
  imageId?: string | null
  imageUrl?: string | null
  modifierGroups?: ModifierGroupRow[]
  locale?: string
}): Promise<UpdateMenuItemResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }
    if (!args.itemId) {
      return { success: false, error: 'Item ID is required.' }
    }
    const trimmedTitle = args.title?.trim()
    if (!trimmedTitle) {
      return { success: false, error: 'Item title is required.' }
    }
    if (typeof args.price !== 'number' || !Number.isFinite(args.price) || args.price < 0) {
      return { success: false, error: 'Enter a valid price.' }
    }

    const modGroupErr = validateModifierGroups(args.modifierGroups)
    if (modGroupErr) {
      return { success: false, error: modGroupErr }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    let item
    try {
      item = await payload.findByID({
        collection: 'menu-items',
        id: args.itemId,
        depth: 0,
        overrideAccess: true,
        locale: targetLocale,
      })
    } catch {
      // Ignored, handled below
    }

    if (!item) {
      return { success: false, error: 'Menu item not found.' }
    }

    if (relId(item.restaurant) !== restaurantId) {
      return { success: false, error: 'Menu item not found for this venue.' }
    }

    const previousCategoryIds = (args.previousCategoryIds ?? []).map((id) => id.trim()).filter(Boolean)
    const newCategoryIds =
      args.categoryIds !== undefined
        ? args.categoryIds.map((id) => id.trim()).filter(Boolean)
        : previousCategoryIds
    const addedCategoryIds = newCategoryIds.filter((id) => !previousCategoryIds.includes(id))
    const removedCategoryIds = previousCategoryIds.filter((id) => !newCategoryIds.includes(id))

    const mappedModifierGroups = (args.modifierGroups ?? []).map((g) => ({
      ...(g.id ? { id: g.id } : {}),
      name: g.name.trim(),
      input_type: g.input_type,
      required: Boolean(g.required),
      options: g.options.map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label.trim(),
      })),
    }))

    const updated = await payload.update({
      collection: 'menu-items',
      id: args.itemId,
      data: {
        title: trimmedTitle,
        description: args.description?.trim() ?? '',
        price: args.price,
        in_stock: args.inStock !== undefined ? args.inStock : item.in_stock !== false,
        _status: args.status ?? (item._status === 'draft' ? 'draft' : 'published'),
        image: args.imageId ?? null,
        allergen: args.allergenIds ?? [],
        tags: args.tagIds ?? [],
        modifier_groups: mappedModifierGroups,
      } as unknown as RequiredDataFromCollectionSlug<'menu-items'>,
      overrideAccess: true,
      locale: targetLocale,
    })

    if (addedCategoryIds.length > 0 || removedCategoryIds.length > 0) {
      try {
        await syncMenusForItemCategories(payload, {
          operatorId,
          restaurantId,
          itemId: args.itemId,
          addedCategoryIds,
          removedCategoryIds,
          locale: targetLocale,
          eventId: args.eventId,
        })
      } catch (syncErr) {
        console.error('Failed to sync menus for item categories:', syncErr)
      }
    }

    let categoryNames: string[] = []
    if (newCategoryIds.length > 0) {
      try {
        const catDocs = await payload.find({
          collection: 'menu-categories',
          where: { id: { in: newCategoryIds } },
          limit: newCategoryIds.length,
          depth: 0,
          overrideAccess: true,
          locale: targetLocale,
        })
        categoryNames = catDocs.docs.map((c) => resolveString(c.title, targetLocale)).filter(Boolean)
      } catch {
        // Non-fatal
      }
    }

    let resolvedImageUrl = args.imageUrl ?? null
    if (args.imageId && !resolvedImageUrl) {
      try {
        const mediaDoc = await payload.findByID({
          collection: 'menu-media',
          id: args.imageId,
          depth: 0,
          overrideAccess: true,
        })
        if (mediaDoc?.filename) {
          resolvedImageUrl = `${BACKEND_URL_WITH_BASE}/api/menu-media/file/${mediaDoc.filename}`
        }
      } catch {
        // Non-fatal
      }
    }

    return {
      success: true,
      data: {
        id: String(updated.id),
        title: resolveString(updated.title, targetLocale) || trimmedTitle,
        description:
          resolveString(updated.description, targetLocale) || (args.description?.trim() ?? ''),
        price: typeof updated.price === 'number' ? updated.price : null,
        inStock: updated.in_stock !== false,
        status: (updated._status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
        categoryIds: newCategoryIds,
        categoryNames,
        allergenIds: args.allergenIds ?? [],
        tagIds: args.tagIds ?? [],
        imageId: args.imageId ? String(args.imageId) : null,
        imageUrl: resolvedImageUrl,
        modifierGroups: (updated.modifier_groups ?? mappedModifierGroups).map((g) => ({
          id: g.id ? String(g.id) : undefined,
          name: resolveString(g.name, targetLocale) || g.name,
          input_type: g.input_type,
          required: Boolean(g.required),
          options: (g.options ?? []).map((o) => ({
            id: o.id ? String(o.id) : undefined,
            label: resolveString(o.label, targetLocale) || o.label,
          })),
        })),
      },
    }
  } catch (error) {
    console.error('Error in updateMenuItemAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update menu item',
    }
  }
}

/**
 * Updates the items in a menu doc for the event's venue.
 * Verifies menu belongs to venue and every item belongs to the venue.
 */
export async function updateMenuItemsAction(args: {
  eventId: string
  menuId: string
  itemIds: string[]
  locale?: string
}): Promise<UpdateMenuItemsResult> {
  try {
    if (!args.eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }
    if (!args.menuId) {
      return { success: false, error: 'Menu ID is required.' }
    }
    if (!Array.isArray(args.itemIds) || args.itemIds.length === 0) {
      return { success: false, error: 'Pick at least one item.' }
    }

    const targetLocale = resolveLocale(args.locale)
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      args.eventId,
    )

    let menu
    try {
      menu = await payload.findByID({
        collection: 'menu',
        id: args.menuId,
        depth: 0,
        overrideAccess: true,
        locale: targetLocale,
      })
    } catch {
      // Ignored, handled below
    }

    if (!menu) {
      return { success: false, error: 'Menu not found.' }
    }

    if (relId(menu.restaurant) !== restaurantId) {
      return { success: false, error: 'Menu not found for this venue.' }
    }

    // Verify every item belongs to the venue
    const foundItems = await payload.find({
      collection: 'menu-items',
      where: {
        and: [
          { id: { in: args.itemIds } },
          { restaurant: { equals: restaurantId } },
        ],
      },
      limit: args.itemIds.length,
      depth: 0,
      overrideAccess: true,
      locale: targetLocale,
    })

    if (foundItems.totalDocs !== args.itemIds.length) {
      return {
        success: false,
        error: 'Some selected items are not available for this venue.',
      }
    }

    await payload.update({
      collection: 'menu',
      id: args.menuId,
      data: {
        menu_items: args.itemIds.map((id) => ({ item: id })),
      },
      overrideAccess: true,
      locale: targetLocale,
    })

    return {
      success: true,
      data: {
        id: args.menuId,
        itemCount: args.itemIds.length,
        itemIds: args.itemIds,
      },
    }
  } catch (error) {
    console.error('Error in updateMenuItemsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update menu items',
    }
  }
}

/**
 * Generates/refreshes QR code for an event.
 * Encodes the public event URL (<BACKEND_URL_WITH_BASE>/fnb/menu/<info.slug>?src=qr).
 * Creates/replaces PNG and SVG menu-media docs and updates event.qr_png / event.qr_svg.
 */
export async function generateEventQRCodeAction(
  eventId: string | number,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config })

    const event = (await payload.findByID({
      collection: 'fnb-menu-events',
      id: eventId,
      depth: 0,
    })) as unknown as FnbMenuEvent // Structural cast: Payload findByID returns loosely-shaped document

    if (!event) {
      throw new Error('Event not found')
    }

    const slug = event.info?.slug
    if (!slug) {
      throw new Error('Event slug not found — save the event first.')
    }

    const title = event.info?.title || event.title || slug
    const path = `/fnb/menu/${slug}?src=qr`.replace(/\/\/+/g, '/')
    const baseUrl = BACKEND_URL_WITH_BASE.replace(/\/+$/, '')
    const qrUrl = `${baseUrl}${path}`

    // Delete existing media if they exist to avoid orphaned files
    if (event.qr_png) {
      try {
        const pngId =
          typeof event.qr_png === 'object' && event.qr_png !== null
            ? event.qr_png.id
            : event.qr_png
        await payload.delete({
          collection: 'menu-media',
          id: pngId,
        })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error(`Failed to delete old PNG (${event.qr_png}):`, message)
      }
    }

    if (event.qr_svg) {
      try {
        const svgId =
          typeof event.qr_svg === 'object' && event.qr_svg !== null
            ? event.qr_svg.id
            : event.qr_svg
        await payload.delete({
          collection: 'menu-media',
          id: svgId,
        })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error(`Failed to delete old SVG (${event.qr_svg}):`, message)
      }
    }

    // Generate new QR codes
    const qrCodeBufferPNG = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    })

    const svgString = await QRCode.toString(qrUrl, {
      type: 'svg',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    })
    const qrCodeBufferSVG = Buffer.from(svgString)

    // Derive operator ID from the event (menu-media requires operator)
    const operatorId =
      typeof event.operator === 'object' && event.operator !== null
        ? event.operator.id
        : event.operator

    // Create new media records in menu-media
    const png = await payload.create({
      collection: 'menu-media',
      data: {
        alt: `QR Code PNG for ${title}`,
        operator: operatorId,
      },
      file: {
        data: qrCodeBufferPNG,
        mimetype: 'image/png',
        name: `qr-${slug}.png`,
        size: qrCodeBufferPNG.length,
      },
    })

    const svg = await payload.create({
      collection: 'menu-media',
      data: {
        alt: `QR Code SVG for ${title}`,
        operator: operatorId,
      },
      file: {
        data: qrCodeBufferSVG,
        mimetype: 'image/svg+xml',
        name: `qr-${slug}.svg`,
        size: qrCodeBufferSVG.length,
      },
    })

    // Update the event document with the new media IDs
    await payload.update({
      collection: 'fnb-menu-events',
      id: eventId,
      data: {
        qr_png: png.id,
        qr_svg: svg.id,
      },
    })

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in generateEventQRCodeAction:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
