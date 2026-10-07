import type { FnbMenuEvent } from '@/payload-types'
import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'
import { applyEventStaffPanelGrant } from '@/collections/public/fnb-event-staff/hooks/sync-panel-grant'

/**
 * Seeds a small dedicated event crew under the Doha Oasis operator and assigns
 * them to the two demo events. The demo restaurant staff from
 * `seedFnbOrderSystem` belong to a DIFFERENT operator (printemps / Twiga), so
 * they can't be assigned here - `validateEventStaffAssignment` enforces
 * same-operator.
 *
 * The `fnb-event-staff.afterChange` hook back-fills each user's event-panel
 * `users-access` grant, so the isolation is demoable end to end without
 * hand-wiring `users-access`.
 */

type SeedUser = {
  email: string
  fullName: string
}

type SeedAssignment = {
  eventSlug: string
  userEmail: string
  role: 'waiter' | 'boh' | 'cashier'
}

const EVENT_CREW: SeedUser[] = [
  { email: 'event-chef@dohaoasis.com', fullName: 'Event Chef' },
  { email: 'event-waiter@dohaoasis.com', fullName: 'Event Waiter' },
]

const DEMO_ASSIGNMENTS: SeedAssignment[] = [
  { eventSlug: 'gala-dinner', userEmail: 'event-chef@dohaoasis.com', role: 'boh' },
  { eventSlug: 'launch-party', userEmail: 'event-waiter@dohaoasis.com', role: 'waiter' },
  { eventSlug: 'launch-party', userEmail: 'event-chef@dohaoasis.com', role: 'boh' },
]

export const seedFnbEventStaff = async (
  arg: Payload | { payload: Payload },
): Promise<void> => {
  const payload = 'payload' in arg ? arg.payload : arg
  const { logger } = payload
  logger.info('Seeding FnB demo event staff assignments...')

  // Doha Oasis operator + dedicated event restaurant (created by seedFnbEvents)
  const { docs: operators } = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })
  const doOperator = operators[0]
  if (!doOperator) {
    logger.error('[seedFnbEventStaff] Doha Oasis operator not found - skipping.')
    return
  }

  const { docs: restaurants } = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: 'doha-oasis-events' } },
    limit: 1,
    overrideAccess: true,
  })
  const eventsRestaurant = restaurants[0]

  // Create the dedicated event crew. They belong to the Doha Oasis operator and
  // are pinned to the doha-oasis-events venue - the pin is needed so the
  // `orders.restaurant` field validation accepts their status updates; it does
  // NOT widen their scope (event access is assignment-only), and event orders
  // are filtered out of the restaurant board / stream regardless (see F8).
  const userIdByEmail = new Map<string, string>()
  for (const u of EVENT_CREW) {
    const doc = await createCollectionIfNotExists({
      payload,
      collection: 'users',
      where: { email: { equals: u.email } },
      data: {
        email: u.email,
        password: u.email,
        full_name: u.fullName,
        operator: doOperator.id,
        ...(eventsRestaurant ? { restaurant: eventsRestaurant.id } : {}),
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })
    if (doc?.id) {
      userIdByEmail.set(u.email, String(doc.id))
      logger.info(`✓ Event crew user ready: ${u.email}`)
    }
  }

  // Look up the two demo events
  const { docs: events } = await payload.find({
    collection: 'fnb-menu-events',
    where: { 'info.slug': { in: ['gala-dinner', 'launch-party'] } },
    depth: 0,
    limit: 10,
    overrideAccess: true,
  })
  const eventBySlug = new Map<string, FnbMenuEvent>()
  for (const doc of events as FnbMenuEvent[]) {
    if (doc.info?.slug) eventBySlug.set(doc.info.slug, doc)
  }

  for (const assignment of DEMO_ASSIGNMENTS) {
    const event = eventBySlug.get(assignment.eventSlug)
    const userId = userIdByEmail.get(assignment.userEmail)
    if (!event || !userId) {
      logger.warn(
        `[seedFnbEventStaff] Missing event "${assignment.eventSlug}" or user "${assignment.userEmail}" - skipping.`,
      )
      continue
    }

    const existing = await payload.find({
      collection: 'fnb-event-staff',
      where: {
        and: [
          { event: { equals: event.id } },
          { user: { equals: userId } },
          { role: { equals: assignment.role } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      logger.info(
        `✓ Event staff assignment already exists: ${assignment.userEmail} as ${assignment.role} on ${assignment.eventSlug} - skipping.`,
      )
      continue
    }

    const eventOperator =
      typeof event.operator === 'object' && event.operator !== null
        ? event.operator.id
        : (event.operator as string)

    const data: RequiredDataFromCollectionSlug<'fnb-event-staff'> = {
      event: event.id,
      user: userId,
      role: assignment.role,
      operator: eventOperator || '',
      operator_slug: '',
    }

    try {
      await payload.create({ collection: 'fnb-event-staff', data, overrideAccess: true })
      logger.info(
        `✓ Seeded event staff assignment: ${assignment.userEmail} as ${assignment.role} on ${assignment.eventSlug}`,
      )
    } catch (error) {
      logger.error(
        `[seedFnbEventStaff] Error assigning ${assignment.userEmail} as ${assignment.role} on ${assignment.eventSlug}: ${error}`,
      )
    }
  }

  // The assignment rows above may already have existed (idempotent seed) so the
  // afterChange grant-sync wouldn't have fired. Reconcile each crew user's grants
  // explicitly so a re-seed converges on the per-{event,role} model.
  for (const userId of new Set(userIdByEmail.values())) {
    try {
      await applyEventStaffPanelGrant(payload, userId)
    } catch (e) {
      logger.error(`[seedFnbEventStaff] grant reconcile failed for ${userId}: ${e}`)
    }
  }

  logger.info('FnB demo event staff assignments seeding completed!')
}
