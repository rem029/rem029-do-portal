import type { Payload } from 'payload'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'
import { createDefaultUserAccess } from './helpers/create-user-access'

const TABLE_LABELS = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5']

/**
 * Enables table ordering on every already-seeded FnB menu page, gives each of
 * their restaurants a handful of tables to order from, and creates one demo
 * staff account per FnB order-board role (waiter/back-of-house/cashier), scoped to
 * the first seeded restaurant. Depends on seedFnbMenu having already run.
 */
export const seedFnbOrderSystem = async ({ payload }: { payload: Payload }) => {
  const { logger } = payload
  logger.info('Seeding FnB order tracking demo data...')

  const { docs: pages } = await payload.find({
    collection: 'menu-pages',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  if (pages.length === 0) {
    logger.info('No menu pages found - skipping FnB order system seed (run seedFnbMenu first).')
    return
  }

  for (const page of pages) {
    const restaurantId =
      typeof page.restaurant === 'object' ? page.restaurant?.id : page.restaurant
    const operatorId = typeof page.operator === 'object' ? page.operator?.id : page.operator
    if (!restaurantId || !operatorId) continue

    if (!page.c?.ordering_enabled) {
      await payload.update({
        collection: 'menu-pages',
        id: page.id,
        data: { c: { ...page.c, ordering_enabled: true } },
        overrideAccess: true,
      })
      logger.info(`✓ Enabled table ordering on menu page "${page.info?.slug}"`)
    }

    for (const label of TABLE_LABELS) {
      await createCollectionIfNotExists({
        payload,
        collection: 'tables',
        where: {
          and: [{ restaurant: { equals: restaurantId } }, { label: { equals: label } }],
        },
        data: {
          operator: operatorId,
          restaurant: restaurantId,
          label,
          slug: label.toLowerCase().replace(/ /g, '-'),
        },
        overrideAccess: true,
      })
    }
  }

  // Each role's access is defined in create-user-access.ts on top of
  // accessNonAdmin - that base grant is what actually lets a staff account open
  // the admin panel. createDefaultUserAccess also back-fills those base slugs into
  // any FnB access doc an earlier seed run created without them.
  const waiterAccess = await createDefaultUserAccess(payload, 'fnb-waiter')
  // Pass the legacy name so an existing 'FnB Kitchen' doc (from before the
  // Kitchen -> Back of House rename) is renamed in place rather than duplicated,
  // keeping existing BOH staff pointed at the same access doc.
  const bohAccess = await createDefaultUserAccess(payload, 'fnb-boh', 'FnB Kitchen')
  const cashierAccess = await createDefaultUserAccess(payload, 'fnb-cashier')
  const reportManagerAccess = await createDefaultUserAccess(payload, 'fnb-report-manager')
  const reportAdminAccess = await createDefaultUserAccess(payload, 'fnb-report-admin')

  // Demo staff all work the first seeded restaurant, so they see the same
  // order queue when testing the full waiter -> back of house -> cashier handoff.
  const demoPage = pages[0]
  const demoRestaurantId =
    typeof demoPage.restaurant === 'object' ? demoPage.restaurant?.id : demoPage.restaurant
  const demoOperatorId =
    typeof demoPage.operator === 'object' ? demoPage.operator?.id : demoPage.operator

  const demoUsers: Array<{
    email: string
    fullName: string
    access: string
    restaurant?: string | null
  }> = [
    {
      email: 'fnb-waiter@dohaoasis.com',
      fullName: 'Demo Waiter',
      access: waiterAccess.id,
      restaurant: demoRestaurantId,
    },
    {
      email: 'fnb-chef@dohaoasis.com',
      fullName: 'Demo Back of House',
      access: bohAccess.id,
      restaurant: demoRestaurantId,
    },
    {
      email: 'fnb-cashier@dohaoasis.com',
      fullName: 'Demo Cashier',
      access: cashierAccess.id,
      restaurant: demoRestaurantId,
    },
    {
      email: 'fnb-report-manager@dohaoasis.com',
      fullName: 'Demo Report Manager',
      access: reportManagerAccess.id,
      restaurant: demoRestaurantId,
    },
    {
      email: 'fnb-report-admin@dohaoasis.com',
      fullName: 'Demo Report Admin',
      access: reportAdminAccess.id,
      restaurant: null,
    },
  ]

  for (const u of demoUsers) {
    await createCollectionIfNotExists({
      payload,
      collection: 'users',
      where: { email: { equals: u.email } },
      data: {
        email: u.email,
        password: u.email,
        full_name: u.fullName,
        operator: demoOperatorId,
        ...(u.restaurant ? { restaurant: u.restaurant } : {}),
        access: u.access,
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })
    logger.info(`✓ Demo staff user ready: ${u.email}`)
  }

  logger.info('FnB order tracking demo data seeded!')
}
