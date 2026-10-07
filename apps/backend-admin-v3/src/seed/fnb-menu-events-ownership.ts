import type { FnbMenuEvent } from '@/payload-types'
import type { Payload } from 'payload'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'
import { createDefaultUserAccess } from './helpers/create-user-access'

/**
 * Seeds two non-super demo users for manually verifying TECH-0098 Task 11C's
 * ownership-scoped `fnb-menu-events` access: a plain `fnb-menu-events`
 * read/create/update grant is no longer enough on its own to see/edit an
 * event — the user also needs to be the event's `created_by`, or listed in
 * its `owners` field. Both users get the identical grant so any visibility
 * difference between them comes purely from ownership, not from a different
 * access row:
 *
 * - `event-owner@dohaoasis.com` is added as an explicit **owner** of the
 *   "launch-party" demo event (rather than made its creator, because
 *   `seedFnbEvents` creates that event via script with no `req.user`, so
 *   `created_by` stays null on it — ownership has to come through `owners`).
 *   They are NOT added to "gala-dinner", so logging in as them and seeing
 *   exactly one event in the list is the manual check that ownership scoping
 *   (as opposed to "any operator grant sees everything") is working.
 * - `event-owner1@dohaoasis.com` is deliberately left with NO events owned
 *   and none created — the contrasting baseline case (§7 of the task doc):
 *   same grant, zero visible events, until they create their own or someone
 *   adds them to an existing event's `owners`.
 */
export const seedFnbMenuEventsOwnership = async ({ payload }: { payload: Payload }): Promise<void> => {
  const { logger } = payload
  logger.info('Seeding FnB menu events ownership test users...')

  const { docs: operators } = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })
  const doOperator = operators[0]
  if (!doOperator) {
    logger.error('[seedFnbMenuEventsOwnership] Doha Oasis operator not found - skipping.')
    return
  }

  const userAccess = await createDefaultUserAccess(payload, 'fnb-menu-events-owner')

  const createTestUser = async (email: string, fullName: string) => {
    const user = await createCollectionIfNotExists({
      payload,
      collection: 'users',
      where: { email: { equals: email } },
      data: {
        email,
        password: email,
        full_name: fullName,
        operator: doOperator.id,
        access: userAccess.id,
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })
    logger.info(`✓ Event ownership test user ready: ${email}`)
    return user
  }

  const owner = await createTestUser('event-owner@dohaoasis.com', 'Event Owner (Test)')
  // No owner-assignment step for this one - deliberately left with zero
  // events visible, as the contrasting baseline case.
  await createTestUser('event-owner1@dohaoasis.com', 'Event Owner 1 (Test)')

  const { docs: events } = await payload.find({
    collection: 'fnb-menu-events',
    where: { 'info.slug': { equals: 'launch-party' } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const event = events[0] as FnbMenuEvent | undefined
  if (!event) {
    logger.warn(
      '[seedFnbMenuEventsOwnership] "launch-party" demo event not found - skipping owner assignment.',
    )
    return
  }

  const currentOwnerIds = (event.owners ?? []).map((o) => (typeof o === 'string' ? o : o.id))
  if (currentOwnerIds.includes(String(owner.id))) {
    logger.info(`✓ ${owner.email} already an owner of "launch-party" - skipping.`)
  } else {
    await payload.update({
      collection: 'fnb-menu-events',
      id: event.id,
      data: { owners: [...currentOwnerIds, owner.id] },
      overrideAccess: true,
    })
    logger.info(`✓ Added ${owner.email} as an owner of "launch-party"`)
  }

  logger.info('FnB menu events ownership test users seeding completed!')
}
