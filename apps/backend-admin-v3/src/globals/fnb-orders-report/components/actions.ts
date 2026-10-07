'use server'

import { getPayload, type Payload, type Where } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { Analytics, FnbMenuEvent, Order, User } from '@/payload-types'
import { hasUserAccess, isCollectionSuperUser } from '@/utilities/access'
import {
  findEventSlugs,
  getOwnedEventSlugs,
  resolveStaffEventScope,
} from '@/utilities/fnb-staff-access'
import type {
  FnbOrdersReportResult,
  FnbPriceMode,
  FnbReportContext,
  FnbReportFilters,
  FnbReportMode,
  FnbReportRestaurantOption,
} from './types'
import {
  buildCompletionTime,
  buildEngagementFunnel,
  buildItemRanking,
  buildOrdersPerDay,
  buildPeakHours,
  buildRevenueBasket,
  buildStageTiming,
  buildStatusFunnel,
  extractMenuPageSlug,
} from './aggregate'

export type FnbReportType = 'restaurant' | 'event'

/**
 * Which `fnb-menu-events` slugs a user's `fnb-event-orders-report` may show data for:
 *   - account-wide `user.super_user` → every published event, any operator
 *   - row-level `super_user: true` on the `fnb-event-orders-report` access entry →
 *     every published event under the user's own `operator` (operator-wide manager)
 *   - everyone else → events they hold a `fnb-order-panel:<slug>:<role>` staff grant on,
 *     plus any event they created or were added to `owners` on
 */
async function resolveEventReportScope(payload: Payload, user: User): Promise<string[]> {
  if (user.super_user) {
    return findEventSlugs(payload)
  }

  if (isCollectionSuperUser(user, 'fnb-event-orders-report')) {
    const userOperatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator
    return userOperatorId ? findEventSlugs(payload, { operatorId: userOperatorId }) : []
  }

  const [staffSlugs, ownedSlugs] = await Promise.all([
    resolveStaffEventScope(payload, user),
    getOwnedEventSlugs(payload, user),
  ])
  return Array.from(new Set([...staffSlugs, ...ownedSlugs]))
}

/**
 * Shared internal helper to resolve a user's access rights and restaurant/event scope
 * for the FnB orders report. Both fetchFnbReportContext and fetchFnbOrdersReport
 * call this to guarantee consistent, tamper-proof server-side gating.
 */
async function resolveReportAccess(
  payload: Payload,
  user: User | null,
  reportType: FnbReportType = 'restaurant',
): Promise<{
  mode: FnbReportMode
  allowedRestaurantIds: string[]
  lockedRestaurantId: string | null
  restaurants: FnbReportRestaurantOption[]
}> {
  if (!user) {
    return {
      mode: 'forbidden',
      allowedRestaurantIds: [],
      lockedRestaurantId: null,
      restaurants: [],
    }
  }

  if (reportType === 'event') {
    if (
      !user.super_user &&
      !isCollectionSuperUser(user, 'fnb-event-orders-report') &&
      !hasUserAccess(user, 'fnb-event-orders-report', 'read')
    ) {
      return {
        mode: 'forbidden',
        allowedRestaurantIds: [],
        lockedRestaurantId: null,
        restaurants: [],
      }
    }

    const allowedSlugs = await resolveEventReportScope(payload, user)
    if (allowedSlugs.length === 0) {
      return {
        mode: 'none',
        allowedRestaurantIds: [],
        lockedRestaurantId: null,
        restaurants: [],
      }
    }

    const { docs: eventDocs } = await payload.find({
      collection: 'fnb-menu-events',
      where: { 'info.slug': { in: allowedSlugs } },
      depth: 0,
      limit: 500,
      overrideAccess: true,
    })

    const eventMap = new Map<string, string>()
    for (const doc of eventDocs as FnbMenuEvent[]) {
      if (doc.info?.slug) {
        eventMap.set(doc.info.slug, doc.info.title || doc.info.slug)
      }
    }

    const events: FnbReportRestaurantOption[] = allowedSlugs.map((slug) => ({
      id: slug,
      title: eventMap.get(slug) || slug,
    }))
    events.sort((a, b) => a.title.localeCompare(b.title))

    if (events.length === 1) {
      return {
        mode: 'locked',
        allowedRestaurantIds: [events[0].id],
        lockedRestaurantId: events[0].id,
        restaurants: events,
      }
    }

    return {
      mode: 'all',
      allowedRestaurantIds: events.map((e) => e.id),
      lockedRestaurantId: null,
      restaurants: events,
    }
  }

  if (!hasUserAccess(user, 'fnb-orders-report', 'read')) {
    return {
      mode: 'forbidden',
      allowedRestaurantIds: [],
      lockedRestaurantId: null,
      restaurants: [],
    }
  }

  if (user.super_user || isCollectionSuperUser(user, 'fnb-orders-report')) {
    const { docs } = await payload.find({
      collection: 'restaurants',
      limit: 500,
      sort: 'title',
      overrideAccess: true,
    })

    const restaurants = docs.map((r) => ({ id: r.id, title: r.title }))
    return {
      mode: 'all',
      allowedRestaurantIds: restaurants.map((r) => r.id),
      lockedRestaurantId: null,
      restaurants,
    }
  }

  const userRestaurantId =
    typeof user.restaurant === 'object' && user.restaurant !== null
      ? user.restaurant.id
      : user.restaurant

  if (userRestaurantId) {
    try {
      // findByID throws if the assigned restaurant was deleted
      const restaurant = await payload.findByID({
        collection: 'restaurants',
        id: userRestaurantId,
        depth: 0,
        overrideAccess: true,
      })

      const restaurants = [{ id: restaurant.id, title: restaurant.title }]
      return {
        mode: 'locked',
        allowedRestaurantIds: [restaurant.id],
        lockedRestaurantId: userRestaurantId,
        restaurants,
      }
    } catch {
      return {
        mode: 'forbidden',
        allowedRestaurantIds: [],
        lockedRestaurantId: null,
        restaurants: [],
      }
    }
  }

  return {
    mode: 'none',
    allowedRestaurantIds: [],
    lockedRestaurantId: null,
    restaurants: [],
  }
}

/**
 * Returns initial context for the report page view (mode, allowed restaurants list, locked id).
 */
export async function fetchFnbReportContext(
  reportType: FnbReportType = 'restaurant',
): Promise<FnbReportContext> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    // payload.auth's user carries an extra `collection` prop - narrow to our User (matches fnb-order-board/actions.ts)
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    const { mode, restaurants, lockedRestaurantId } = await resolveReportAccess(
      payload,
      user,
      reportType,
    )
    return { mode, restaurants, lockedRestaurantId }
  } catch (error) {
    console.error('Error fetching FnB report context:', error)
    return {
      mode: 'forbidden',
      restaurants: [],
      lockedRestaurantId: null,
    }
  }
}

/**
 * Returns menu-items for the item filter picker for a given restaurant or event.
 * Re-verifies access server-side.
 */
export async function fetchFnbReportItems(
  restaurantIdOrEventSlug: string,
  reportType: FnbReportType = 'restaurant',
): Promise<{ id: string; title: string }[]> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    const { allowedRestaurantIds } = await resolveReportAccess(payload, user, reportType)
    if (!allowedRestaurantIds.includes(restaurantIdOrEventSlug)) {
      return []
    }

    if (reportType === 'event') {
      const { docs: eventDocs } = await payload.find({
        collection: 'fnb-menu-events',
        where: { 'info.slug': { equals: restaurantIdOrEventSlug } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
      const eventDoc = eventDocs[0] as FnbMenuEvent | undefined
      if (!eventDoc) return []
      const restId =
        typeof eventDoc.restaurant === 'object' && eventDoc.restaurant !== null
          ? eventDoc.restaurant.id
          : eventDoc.restaurant
      if (!restId) return []

      const { docs } = await payload.find({
        collection: 'menu-items',
        where: {
          restaurant: { equals: restId },
        },
        limit: 500,
        sort: 'title',
        depth: 0,
        overrideAccess: true,
      })

      return docs.map((item) => ({ id: item.id, title: item.title }))
    }

    const { docs } = await payload.find({
      collection: 'menu-items',
      where: {
        restaurant: { equals: restaurantIdOrEventSlug },
      },
      limit: 500,
      sort: 'title',
      depth: 0,
      overrideAccess: true,
    })

    return docs.map((item) => ({ id: item.id, title: item.title }))
  } catch (error) {
    console.error('Error fetching FnB report items:', error)
    return []
  }
}

/**
 * Server-side aggregator returning all 8 FnB report widgets given the applied filters.
 */
export async function fetchFnbOrdersReport(
  filters: FnbReportFilters,
  reportType: FnbReportType = 'restaurant',
): Promise<FnbOrdersReportResult> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    const { mode, allowedRestaurantIds, lockedRestaurantId, restaurants } =
      await resolveReportAccess(payload, user, reportType)

    if (mode === 'forbidden') {
      return { success: false, error: 'forbidden' }
    }

    if (reportType === 'event') {
      // Empty scope -> empty report, not an error
      if (mode === 'none' || allowedRestaurantIds.length === 0) {
        return {
          success: true,
          data: {
            ordersPerDay: { days: [], restaurants: [], revenueAvailable: false },
            completionTime: {
              sampleSize: 0,
              meanMinutes: null,
              medianMinutes: null,
              p90Minutes: null,
              maxMinutes: null,
            },
            stageTiming: { stages: [] },
            statusFunnel: {
              reached: [],
              totalOrders: 0,
              cancelledCount: 0,
              cancellationRatePct: 0,
              cancelledAtStage: [],
            },
            itemRanking: { rows: [], totalUnits: 0, revenueAvailable: false },
            peakHours: {
              grid: Array.from({ length: 7 }, () => Array(24).fill(0)),
              maxCell: 0,
              totalOrders: 0,
            },
            revenueBasket: {
              available: false,
              totalRevenue: 0,
              completedRevenue: 0,
              averageOrderValue: 0,
              averageItemsPerOrder: 0,
              byRestaurant: [],
            },
            engagementFunnel: {
              pageViews: 0,
              itemClicks: 0,
              ordersPlaced: 0,
              ordersCompleted: 0,
              steps: [],
            },
            meta: {
              priceDataComplete: false,
              priceMode: filters.priceMode ?? 'all',
              restaurantMode: mode,
              appliedFilters: filters,
              resolvedRestaurantIds: [],
              ordersInRange: 0,
              ordersInRangeAllPrices: 0,
              generatedAt: new Date().toISOString(),
            },
          },
        }
      }

      let resolvedEventSlugs: string[] = []
      if (mode === 'locked' && lockedRestaurantId) {
        resolvedEventSlugs = [lockedRestaurantId]
      } else if (
        filters.restaurantId &&
        typeof filters.restaurantId === 'string' &&
        allowedRestaurantIds.includes(filters.restaurantId)
      ) {
        resolvedEventSlugs = [filters.restaurantId]
      } else {
        resolvedEventSlugs = [...allowedRestaurantIds]
      }

      const reportEvents = restaurants.filter((r) => resolvedEventSlugs.includes(r.id))

      const fromDate = filters.from ? new Date(`${filters.from}T00:00:00.000+03:00`) : null
      const toDate = filters.to ? new Date(`${filters.to}T23:59:59.999+03:00`) : new Date()

      // 1. Fetch orders in range with safety-capped pagination
      const orderWhere: Where[] = [
        { ordering_collection: { equals: 'fnb-menu-events' } },
        { ordering_slug: { in: resolvedEventSlugs } },
      ]
      if (fromDate) {
        orderWhere.push({ createdAt: { greater_than_equal: fromDate.toISOString() } })
      }
      orderWhere.push({ createdAt: { less_than_equal: toDate.toISOString() } })

      const MAX_PAGES = 20
      let orderPage = 1
      let orderHasNextPage = true
      const allOrders: Order[] = []

      while (orderHasNextPage && orderPage <= MAX_PAGES) {
        const result = await payload.find({
          collection: 'orders',
          where: {
            and: orderWhere,
          },
          depth: 2,
          limit: 1000,
          page: orderPage,
          pagination: true,
          sort: '-createdAt',
          overrideAccess: true,
        })

        allOrders.push(...(result.docs as Order[]))
        orderHasNextPage = result.hasNextPage
        if (orderHasNextPage && orderPage === MAX_PAGES) {
          payload.logger.warn(
            `[fnb-event-orders-report] Orders query hit safety cap of ${MAX_PAGES} pages (20,000 orders).`,
          )
          break
        }
        orderPage++
      }

      // 2. Filter orders by item if itemId is set
      let targetItemSlug: string | undefined = undefined
      if (filters.itemId) {
        try {
          const itemDoc = await payload.findByID({
            collection: 'menu-items',
            id: filters.itemId,
            depth: 0,
            overrideAccess: true,
          })
          targetItemSlug = itemDoc?.slug
        } catch (err) {
          payload.logger.warn(
            `[fnb-event-orders-report] Could not find menu item ${filters.itemId}: ${err}`,
          )
        }
      }

      const itemFilteredOrders = filters.itemId
        ? allOrders.filter((order) =>
            order.items?.some((it) => {
              const itId =
                typeof it.item === 'object' && it.item !== null ? it.item.id : String(it.item || '')
              return itId === filters.itemId
            }),
          )
        : allOrders

      // 3. Price-mode filter
      const priceMode: FnbPriceMode = filters.priceMode ?? 'all'
      const filteredOrders =
        priceMode === 'priced'
          ? itemFilteredOrders.filter((o) => o.show_prices !== false)
          : priceMode === 'event'
            ? itemFilteredOrders.filter((o) => o.show_prices === false)
            : itemFilteredOrders

      const priceDataComplete =
        priceMode === 'priced' ||
        (priceMode === 'all' &&
          filteredOrders.length > 0 &&
          filteredOrders.every((o) => o.show_prices !== false))

      // 4. Fetch analytics rows in range
      const analyticsWhere: Where[] = [{ path: { like: '/fnb/menu/' } }]
      if (fromDate) {
        analyticsWhere.push({ createdAt: { greater_than_equal: fromDate.toISOString() } })
      }
      analyticsWhere.push({ createdAt: { less_than_equal: toDate.toISOString() } })

      let analyticsPage = 1
      let analyticsHasNextPage = true
      const allAnalytics: Analytics[] = []

      while (analyticsHasNextPage && analyticsPage <= MAX_PAGES) {
        const result = await payload.find({
          collection: 'analytics',
          where: {
            and: analyticsWhere,
          },
          depth: 0,
          limit: 1000,
          page: analyticsPage,
          pagination: true,
          overrideAccess: true,
        })

        allAnalytics.push(...(result.docs as Analytics[]))
        analyticsHasNextPage = result.hasNextPage
        if (analyticsHasNextPage && analyticsPage === MAX_PAGES) {
          payload.logger.warn(
            `[fnb-event-orders-report] Analytics query hit safety cap of ${MAX_PAGES} pages.`,
          )
          break
        }
        analyticsPage++
      }

      // 5. Filter analytics by resolvedEventSlugs
      let pageViews = 0
      let itemClicks = 0

      for (const row of allAnalytics) {
        const pageSlug = extractMenuPageSlug(row.path)
        if (!pageSlug || !resolvedEventSlugs.includes(pageSlug)) continue

        if (row.eventType === 'page_view') {
          pageViews++
        } else if (row.eventType === 'click' && row.elementId === 'select_item') {
          if (filters.itemId) {
            if (targetItemSlug) {
              const additionalData = row.additionalData as unknown as {
                slug?: string
                selectedItemSlug?: string
                searchText?: string
              } | null

              if (additionalData?.slug === targetItemSlug) {
                itemClicks++
              }
            }
          } else {
            itemClicks++
          }
        }
      }

      const ordersPlaced = filteredOrders.length
      const ordersCompleted = filteredOrders.filter(
        (o) => o.status === 'completed' || Boolean(o.completed_at),
      ).length

      // 6. Group the pure builders by event: they bucket on `order.restaurant`,
      //    so swap in the event's ordering_slug (always set here - orders are
      //    pre-filtered to `ordering_slug in resolvedEventSlugs`).
      const aggregatedOrders: Order[] = filteredOrders.map((o) => ({
        ...o,
        restaurant:
          o.ordering_slug ||
          (typeof o.restaurant === 'object' ? o.restaurant?.id : o.restaurant) ||
          '',
      }))

      // 7. Compute reports via pure builders
      const ordersPerDay = buildOrdersPerDay(
        aggregatedOrders,
        filters,
        reportEvents,
        priceDataComplete,
      )
      const completionTime = buildCompletionTime(filteredOrders)
      const stageTiming = buildStageTiming(filteredOrders)
      const statusFunnel = buildStatusFunnel(filteredOrders)
      const itemRanking = buildItemRanking(filteredOrders, { priceDataComplete })
      const peakHours = buildPeakHours(filteredOrders)
      const revenueBasket = buildRevenueBasket(aggregatedOrders, priceDataComplete, reportEvents)
      const engagementFunnel = buildEngagementFunnel({
        pageViews,
        itemClicks,
        ordersPlaced,
        ordersCompleted,
      })

      return {
        success: true,
        data: {
          ordersPerDay,
          completionTime,
          stageTiming,
          statusFunnel,
          itemRanking,
          peakHours,
          revenueBasket,
          engagementFunnel,
          meta: {
            priceDataComplete,
            priceMode,
            restaurantMode: mode,
            appliedFilters: filters,
            resolvedRestaurantIds: resolvedEventSlugs,
            ordersInRange: filteredOrders.length,
            ordersInRangeAllPrices: itemFilteredOrders.length,
            generatedAt: new Date().toISOString(),
          },
        },
      }
    }

    if (mode === 'none') {
      return { success: false, error: 'no-restaurant' }
    }

    // Determine resolved restaurants based on mode and user filter
    let resolvedRestaurantIds: string[] = []
    if (mode === 'locked' && lockedRestaurantId) {
      resolvedRestaurantIds = [lockedRestaurantId]
    } else if (
      filters.restaurantId &&
      typeof filters.restaurantId === 'string' &&
      allowedRestaurantIds.includes(filters.restaurantId)
    ) {
      resolvedRestaurantIds = [filters.restaurantId]
    } else {
      resolvedRestaurantIds = [...allowedRestaurantIds]
    }

    if (resolvedRestaurantIds.length === 0) {
      return { success: false, error: 'no-restaurant' }
    }

    const reportRestaurants = restaurants.filter((r) =>
      resolvedRestaurantIds.includes(r.id),
    )

    // Date bounds are Doha-local calendar days (UTC+3, no DST) so the range
    // filter lines up with the day/hour bucketing in aggregate.ts.
    const fromDate = filters.from ? new Date(`${filters.from}T00:00:00.000+03:00`) : null
    const toDate = filters.to ? new Date(`${filters.to}T23:59:59.999+03:00`) : new Date()

    // 1. Fetch orders in range with safety-capped pagination
    const orderWhere: Where[] = [
      { restaurant: { in: resolvedRestaurantIds } },
      {
        or: [
          { ordering_collection: { not_equals: 'fnb-menu-events' } },
          { ordering_collection: { equals: null } },
        ],
      },
    ]
    if (fromDate) {
      orderWhere.push({ createdAt: { greater_than_equal: fromDate.toISOString() } })
    }
    orderWhere.push({ createdAt: { less_than_equal: toDate.toISOString() } })

    const MAX_PAGES = 20
    let orderPage = 1
    let orderHasNextPage = true
    const allOrders: Order[] = []

    while (orderHasNextPage && orderPage <= MAX_PAGES) {
      const result = await payload.find({
        collection: 'orders',
        where: {
          and: orderWhere,
        },
        depth: 2,
        limit: 1000,
        page: orderPage,
        pagination: true,
        sort: '-createdAt',
        overrideAccess: true,
      })

      allOrders.push(...(result.docs as Order[]))
      orderHasNextPage = result.hasNextPage
      if (orderHasNextPage && orderPage === MAX_PAGES) {
        payload.logger.warn(
          `[fnb-orders-report] Orders query hit safety cap of ${MAX_PAGES} pages (20,000 orders).`,
        )
        break
      }
      orderPage++
    }

    // 2. Filter orders by item if itemId is set
    let targetItemSlug: string | undefined = undefined
    if (filters.itemId) {
      try {
        const itemDoc = await payload.findByID({
          collection: 'menu-items',
          id: filters.itemId,
          depth: 0,
          overrideAccess: true,
        })
        targetItemSlug = itemDoc?.slug
      } catch (err) {
        payload.logger.warn(`[fnb-orders-report] Could not find menu item ${filters.itemId}: ${err}`)
      }
    }

    const itemFilteredOrders = filters.itemId
      ? allOrders.filter((order) =>
          order.items?.some((it) => {
            const itId =
              typeof it.item === 'object' && it.item !== null ? it.item.id : String(it.item || '')
            return itId === filters.itemId
          }),
        )
      : allOrders

    // 3. Price-mode filter — scopes the whole report to priced / event / all orders
    const priceMode: FnbPriceMode = filters.priceMode ?? 'all'
    const filteredOrders =
      priceMode === 'priced'
        ? itemFilteredOrders.filter((o) => o.show_prices !== false)
        : priceMode === 'event'
          ? itemFilteredOrders.filter((o) => o.show_prices === false)
          : itemFilteredOrders

    // Revenue is exact only in 'priced' mode, or in 'all' mode when the whole
    // in-range slice happens to show prices. Never shown in 'event' mode.
    const priceDataComplete =
      priceMode === 'priced' ||
      (priceMode === 'all' &&
        filteredOrders.length > 0 &&
        filteredOrders.every((o) => o.show_prices !== false))

    // 4. Fetch analytics rows in range
    const analyticsWhere: Where[] = [
      { path: { like: '/fnb/menu/' } },
    ]
    if (fromDate) {
      analyticsWhere.push({ createdAt: { greater_than_equal: fromDate.toISOString() } })
    }
    analyticsWhere.push({ createdAt: { less_than_equal: toDate.toISOString() } })

    let analyticsPage = 1
    let analyticsHasNextPage = true
    const allAnalytics: Analytics[] = []

    while (analyticsHasNextPage && analyticsPage <= MAX_PAGES) {
      const result = await payload.find({
        collection: 'analytics',
        where: {
          and: analyticsWhere,
        },
        depth: 0,
        limit: 1000,
        page: analyticsPage,
        pagination: true,
        overrideAccess: true,
      })

      allAnalytics.push(...(result.docs as Analytics[]))
      analyticsHasNextPage = result.hasNextPage
      if (analyticsHasNextPage && analyticsPage === MAX_PAGES) {
        payload.logger.warn(
          `[fnb-orders-report] Analytics query hit safety cap of ${MAX_PAGES} pages.`,
        )
        break
      }
      analyticsPage++
    }

    // 5. Build slug -> restaurant map from menu-pages
    const { docs: menuPages } = await payload.find({
      collection: 'menu-pages',
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })

    const slugToRestaurantId = new Map<string, string>()
    for (const p of menuPages) {
      const pageSlug = p.info?.slug
      const rId =
        typeof p.restaurant === 'object' && p.restaurant !== null
          ? p.restaurant.id
          : String(p.restaurant || '')
      if (pageSlug && rId) {
        slugToRestaurantId.set(pageSlug, rId)
      }
    }

    // 6. Attribute analytics to restaurants and filter by resolvedRestaurantIds
    let pageViews = 0
    let itemClicks = 0

    for (const row of allAnalytics) {
      const pageSlug = extractMenuPageSlug(row.path)
      if (!pageSlug) continue
      const rId = slugToRestaurantId.get(pageSlug)
      if (!rId || !resolvedRestaurantIds.includes(rId)) continue

      if (row.eventType === 'page_view') {
        pageViews++
      } else if (row.eventType === 'click' && row.elementId === 'select_item') {
        if (filters.itemId) {
          if (targetItemSlug) {
            // Documented double-cast per CLAUDE.md for Payload's json field
            const additionalData = row.additionalData as unknown as {
              slug?: string
              selectedItemSlug?: string
              searchText?: string
            } | null

            if (additionalData?.slug === targetItemSlug) {
              itemClicks++
            }
          }
        } else {
          itemClicks++
        }
      }
    }

    const ordersPlaced = filteredOrders.length
    const ordersCompleted = filteredOrders.filter(
      (o) => o.status === 'completed' || Boolean(o.completed_at),
    ).length

    // 7. Compute reports via pure builders
    const ordersPerDay = buildOrdersPerDay(
      filteredOrders,
      filters,
      reportRestaurants,
      priceDataComplete,
    )
    const completionTime = buildCompletionTime(filteredOrders)
    const stageTiming = buildStageTiming(filteredOrders)
    const statusFunnel = buildStatusFunnel(filteredOrders)
    const itemRanking = buildItemRanking(filteredOrders, { priceDataComplete })
    const peakHours = buildPeakHours(filteredOrders)
    const revenueBasket = buildRevenueBasket(filteredOrders, priceDataComplete, reportRestaurants)
    const engagementFunnel = buildEngagementFunnel({
      pageViews,
      itemClicks,
      ordersPlaced,
      ordersCompleted,
    })

    return {
      success: true,
      data: {
        ordersPerDay,
        completionTime,
        stageTiming,
        statusFunnel,
        itemRanking,
        peakHours,
        revenueBasket,
        engagementFunnel,
        meta: {
          priceDataComplete,
          priceMode,
          restaurantMode: mode,
          appliedFilters: filters,
          resolvedRestaurantIds,
          ordersInRange: filteredOrders.length,
          ordersInRangeAllPrices: itemFilteredOrders.length,
          generatedAt: new Date().toISOString(),
        },
      },
    }
  } catch (error) {
    console.error('Error fetching FnB orders report:', error)
    return { success: false, error: 'failed' }
  }
}
