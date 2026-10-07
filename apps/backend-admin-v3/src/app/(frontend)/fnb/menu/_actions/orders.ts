'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { toGuestOrderSnapshot } from '@/collections/public/orders/guest-snapshot'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

export const getTablesAction = async (restaurantId: string) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'tables',
      limit: 0,
      where: {
        restaurant: { equals: restaurantId },
      },
      sort: 'label',
      overrideAccess: true,
    })

    return { success: true, data: docs }
  } catch (error) {
    console.error('Error fetching tables:', error)
    return { success: false, error: 'Failed to fetch tables' }
  }
}

/**
 * Resolves a single table by slug, scoped to a restaurant, for the QR `?table=` flow -
 * a mismatch (wrong restaurant, deleted table) means the picker modal should show instead.
 */
export const resolveTableAction = async (tableSlug: string, restaurantId: string) => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection: 'tables',
      where: {
        and: [{ slug: { equals: tableSlug } }, { restaurant: { equals: restaurantId } }],
      },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    const table = docs[0]

    if (!table) {
      return { success: false as const, error: 'Table not found for this restaurant' }
    }

    return { success: true as const, data: table }
  } catch (error) {
    console.error('Error resolving table:', error)
    return { success: false as const, error: 'Table not found' }
  }
}

/**
 * The single ordering-enabled menu page for a restaurant. Both the table-QR URL
 * builder and the guest order action need it (slug / event-mode flag respectively).
 */
const findOrderingMenuPage = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  restaurantId: string | number | null | undefined,
) => {
  if (!restaurantId) return null
  const { docs } = await payload.find({
    collection: 'menu-pages',
    where: {
      and: [
        { restaurant: { equals: restaurantId } },
        { 'c.ordering_enabled': { equals: true } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

export type OrderingContext = { collection: 'menu-pages' | 'fnb-menu-events'; slug: string }

const resolveOrderingSnapshot = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  {
    restaurantId,
    orderingContext,
  }: {
    restaurantId: string | number | null | undefined
    orderingContext?: OrderingContext
  },
): Promise<{
  eventMode: boolean
  showPrices: boolean
  fulfillment: 'standard' | 'boh_only'
  orderingSlug: string | null
  orderingCollection: 'menu-pages' | 'fnb-menu-events' | null
}> => {
  let handlers: string | null | undefined
  let showPricesRaw: boolean | null | undefined
  let orderingSlug: string | null = null
  let orderingCollection: 'menu-pages' | 'fnb-menu-events' | null = null

  // The client hands us an orderingContext, so it is untrusted: only accept a known
  // collection, and scope the lookup to the table's own restaurant so a guest can't
  // claim another restaurant's complimentary/event context (boh_only, prices hidden,
  // cashier skipped) on a paid table. Anything that doesn't match falls back to the
  // restaurant's own ordering-enabled menu page.
  const contextDoc =
    orderingContext &&
    (orderingContext.collection === 'menu-pages' ||
      orderingContext.collection === 'fnb-menu-events')
      ? (
          await payload.find({
            collection: orderingContext.collection,
            where: {
              and: [
                { 'info.slug': { equals: orderingContext.slug } },
                ...(restaurantId ? [{ restaurant: { equals: restaurantId } }] : []),
              ],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
        ).docs[0]
      : undefined

  // c is typed as unknown-ish across two collections; read defensively
  const contextC = contextDoc
    ? (
        contextDoc as {
          c?: {
            handlers?: string | null
            show_prices?: boolean | null
            ordering_enabled?: boolean | null
          }
        }
      ).c
    : undefined

  if (contextDoc && contextC?.ordering_enabled === true) {
    handlers = contextC.handlers
    showPricesRaw = contextC.show_prices
    orderingSlug = (contextDoc as { info?: { slug?: string | null } }).info?.slug ?? null
    orderingCollection = orderingContext!.collection
  } else {
    const page = await findOrderingMenuPage(payload, restaurantId)
    handlers = page?.c?.handlers
    showPricesRaw = page?.c?.show_prices
    if (page) {
      orderingSlug = page.info?.slug ?? null
      orderingCollection = 'menu-pages'
    }
  }

  return {
    eventMode: !!handlers && handlers !== 'waiter_boh_cashier',
    showPrices: showPricesRaw !== false,
    fulfillment: handlers === 'boh_only' ? 'boh_only' : 'standard',
    orderingSlug,
    orderingCollection,
  }
}

/**
 * Builds the guest-facing ordering URL for a table's QR code - the ordering-enabled
 * menu page for the table's restaurant, deep-linked to pre-select this table.
 */
/**
 * Builds the guest ordering URL (and QR target) for a table. `eventSlug`, when given,
 * is untrusted client input (it's threaded through from an admin-side UI, but this
 * action has no auth of its own) — re-look-up scoped to the table's own restaurant and
 * require ordering_enabled before trusting it, the same boundary resolveOrderingSnapshot
 * applies to its client-supplied orderingContext. An event-only venue (no standalone
 * ordering-enabled menu page - see findOrderingMenuPage) otherwise has no way to ever
 * resolve a table's QR target, so preferring the event here is the actual fix, not a
 * fallback: it's checked first and, if it doesn't match, we fall through to the
 * restaurant's own ordering page exactly as before.
 */
export const getTableOrderingUrlAction = async (tableId: string, eventSlug?: string) => {
  const payload = await getPayload({ config })

  try {
    const table = await payload.findByID({
      collection: 'tables',
      id: tableId,
      depth: 0,
      overrideAccess: true,
    })

    if (!table) {
      return { success: false as const, error: 'Table not found' }
    }

    const restaurantId =
      typeof table.restaurant === 'object' ? table.restaurant?.id : table.restaurant

    if (eventSlug) {
      const { docs } = await payload.find({
        collection: 'fnb-menu-events',
        where: {
          and: [
            { 'info.slug': { equals: eventSlug } },
            ...(restaurantId ? [{ restaurant: { equals: restaurantId } }] : []),
            { 'c.ordering_enabled': { equals: true } },
          ],
        },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
      const event = docs[0]
      if (event) {
        const url = `${BACKEND_URL_WITH_BASE}/fnb/menu/${event.info.slug}?table=${table.slug}`.replace(
          /([^:]\/)\/+/g,
          '$1',
        )
        return { success: true as const, data: { url } }
      }
    }

    const page = await findOrderingMenuPage(payload, restaurantId)

    if (!page) {
      return { success: false as const, error: 'No ordering-enabled menu page for this restaurant' }
    }

    const url = `${BACKEND_URL_WITH_BASE}/fnb/menu/${page.info.slug}?table=${table.slug}`.replace(
      /([^:]\/)\/+/g,
      '$1',
    )

    return { success: true as const, data: { url } }
  } catch (error) {
    console.error('Error building table ordering URL:', error)
    return { success: false as const, error: 'Failed to build ordering URL' }
  }
}

/**
 * Looks up a single table's label for display (e.g. the currently selected
 * table under the cart's order summary) - no restaurant check, since the id
 * only ever gets into the cart store via the picker or resolveTableAction.
 */
export const getTableAction = async (tableId: string) => {
  const payload = await getPayload({ config })

  try {
    const table = await payload.findByID({
      collection: 'tables',
      id: tableId,
      depth: 0,
      overrideAccess: true,
    })

    if (!table) {
      return { success: false as const, error: 'Table not found' }
    }

    return { success: true as const, data: table }
  } catch (error) {
    console.error('Error fetching table:', error)
    return { success: false as const, error: 'Table not found' }
  }
}

export type PlaceOrderItem = {
  itemId: string
  quantity: number
  selectedModifiers?: { groupName: string; selections: string[] }[]
}

export const placeOrderAction = async (
  tableId: string,
  seatNumber: number,
  items: PlaceOrderItem[],
  guestDetails?: { guestName?: string; notes?: string },
  orderingContext?: OrderingContext,
) => {
  const payload = await getPayload({ config })

  try {
    // Server-action args are unvalidated at runtime: guard the type, strip null bytes
    // (Postgres rejects 0x00), trim, cap to the schema limit. Invalid -> undefined, never throws.
    const sanitizeGuestText = (value: unknown, max: number) =>
      typeof value === 'string'
        ? value.replace(/\0/g, '').trim().slice(0, max) || undefined
        : undefined
    const guestName = sanitizeGuestText(guestDetails?.guestName, 120)
    const notes = sanitizeGuestText(guestDetails?.notes, 500)

    if (!tableId) {
      return { success: false, error: 'Table is required' }
    }

    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      return { success: false, error: 'Seat number is required' }
    }

    const validItems = (items || []).filter(
      (i) => i?.itemId && Number.isInteger(i.quantity) && i.quantity > 0,
    )

    if (validItems.length === 0) {
      return { success: false, error: 'Cart is empty' }
    }

    const table = await payload.findByID({
      collection: 'tables',
      id: tableId,
      depth: 0,
      overrideAccess: true,
    })

    if (!table) {
      return { success: false, error: 'Table not found' }
    }

    if (seatNumber < 1 || seatNumber > table.seat_count) {
      return { success: false, error: 'Invalid seat number for this table' }
    }

    const restaurantId =
      typeof table.restaurant === 'object' ? table.restaurant?.id : table.restaurant

    const { eventMode, showPrices, fulfillment, orderingSlug, orderingCollection } =
      await resolveOrderingSnapshot(payload, {
        restaurantId,
        orderingContext,
      })

    const { docs: menuItems } = await payload.find({
      collection: 'menu-items',
      where: {
        and: [
          { id: { in: validItems.map((i) => i.itemId) } },
          { restaurant: { equals: restaurantId } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 0,
      overrideAccess: true,
    })

    const validItemIds = new Set(
      menuItems.filter((i) => i.in_stock !== false).map((i) => i.id),
    )
    const orderItems = validItems
      .filter((i) => validItemIds.has(i.itemId))
      .map((i) => ({
        item: i.itemId,
        quantity: i.quantity,
        // Sent as chosen labels; snapshot-prices' beforeChange hook re-validates
        // each against the menu item's current modifier_groups server-side and
        // rejects the write if a required group is missing a valid selection.
        selected_modifiers: (i.selectedModifiers || []).map((m) => ({
          group_name: m.groupName,
          selections: m.selections,
        })),
      }))

    if (orderItems.length === 0) {
      return { success: false, error: 'None of the items in your cart are available' }
    }

    const order = await payload.create({
      collection: 'orders',
      data: {
        restaurant: restaurantId,
        table: tableId,
        seat_number: seatNumber,
        guest_name: guestName,
        notes,
        status: 'pending',
        event_mode: eventMode,
        show_prices: showPrices,
        fulfillment,
        ordering_slug: orderingSlug,
        ordering_collection: orderingCollection ?? undefined,
        items: orderItems,
      },
      overrideAccess: true,
    })

    return { success: true, data: { id: order.id, orderNumber: order.order_number } }
  } catch (error) {
    console.error('Error placing order:', error)
    return { success: false, error: 'Failed to place order' }
  }
}

/**
 * Minimal, unauthenticated order snapshot for the guest tracker - used for the
 * initial render and as the polling fallback if the tracking socket can't connect.
 * Deliberately returns only what a guest needs (no restaurant/staff data).
 */
export const getOrderStatusAction = async (orderId: string) => {
  const payload = await getPayload({ config })

  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
      overrideAccess: true,
    })

    if (!order) {
      return { success: false as const, error: 'Order not found' }
    }

    return { success: true as const, data: toGuestOrderSnapshot(order) }
  } catch (error) {
    console.error('Error fetching order status:', error)
    return { success: false as const, error: 'Order not found' }
  }
}

/**
 * Guests may only cancel their own order while it's still pending - once a waiter
 * confirms it, cancellation has to go through staff (waiter panel).
 */
export const cancelOrderAction = async (orderId: string) => {
  const payload = await getPayload({ config })

  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })

    if (!order) {
      return { success: false as const, error: 'Order not found' }
    }

    if (order.status !== 'pending') {
      return { success: false as const, error: 'This order can no longer be cancelled here' }
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { status: 'cancelled', cancel_reason: 'Cancelled by guest' },
      overrideAccess: true,
    })

    return { success: true as const }
  } catch (error) {
    console.error('Error cancelling order:', error)
    return { success: false as const, error: 'Failed to cancel order' }
  }
}
