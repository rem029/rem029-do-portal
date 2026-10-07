import { randomUUID } from 'crypto'
import type {
  BasePayload,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
} from 'payload'
import type { FnbEventStaff, User, UsersAccess } from '@/payload-types'
import { accessNonAdmin, eventStaffBaseAccessRows } from '@/seed/helpers/create-user-access'
import {
  EVENT_GRANT_SLUG_RE,
  eventPanelGrantSlug,
  type StaffEventRole,
} from '@/utilities/fnb-staff-access'

/**
 * Resolves a user ID from a relationship value (either an ID string/number or a populated User object).
 */
export const resolveUserId = (user: unknown): string | number | null => {
  if (!user) return null
  if (typeof user === 'object' && 'id' in user && (user as { id?: unknown }).id) {
    return (user as { id: string | number }).id
  }
  if (typeof user === 'string' || typeof user === 'number') {
    return user
  }
  return null
}

type AccessItem = NonNullable<UsersAccess['access']>[number]

/**
 * Matches ONLY the machine-generated per-user access doc name this hook creates
 * (`FnB Access <8 hex>`). Deliberately strict - a shared role doc an admin names
 * "FnB Access Floor Team" must NOT be treated as per-user and mutated in place.
 */
const PER_USER_DOC_NAME_RE = /^FnB Access [0-9a-f]{8}$/

const isEventGrantSlug = (slug?: string | null): boolean => {
  if (!slug) return false
  return (
    EVENT_GRANT_SLUG_RE.test(slug) ||
    slug === 'fnb-event-waiter-panel' ||
    slug === 'fnb-event-back-of-house-panel' ||
    slug === 'fnb-event-cashier-panel'
  )
}

const ensureBaseAndOrders = (rows: AccessItem[]): AccessItem[] => {
  const result: AccessItem[] = rows.map((r) => ({ ...r }))

  // Ensure accessNonAdmin base slugs are present (add if missing, don't touch existing)
  for (const baseRow of accessNonAdmin.access ?? []) {
    if (!result.some((r) => r.slug === baseRow.slug)) {
      result.push({ ...baseRow })
    }
  }

  // Ensure orders r+u present (only add if not already present with those flags — never downgrade)
  const orderRowIndex = result.findIndex((r) => r.slug === 'orders')
  if (orderRowIndex === -1) {
    result.push({ slug: 'orders', read: true, update: true })
  } else {
    result[orderRowIndex] = {
      ...result[orderRowIndex],
      read: true,
      update: true,
    }
  }

  return result
}

const sanitizeAccessItem = (item: AccessItem): AccessItem => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = item
  return rest
}

const getEventSlugFromRow = async (
  payload: BasePayload,
  row: FnbEventStaff,
  req?: PayloadRequest,
): Promise<string | undefined> => {
  if (typeof row.event === 'object' && row.event !== null) {
    return row.event.info?.slug ?? undefined
  }
  if (typeof row.event === 'string' || typeof row.event === 'number') {
    try {
      const eventDoc = await payload.findByID({
        collection: 'fnb-menu-events',
        id: String(row.event),
        depth: 0,
        overrideAccess: true,
        ...(req ? { req } : {}),
      })
      return eventDoc?.info?.slug ?? undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Synchronizes per-{event,role} panel access grants for a given user:
 *
 * 1. Loads all current fnb-event-staff rows for that user.
 * 2. Computes desiredGrants: one `fnb-order-panel:${eventSlug}:${role}` grant per row (deduped).
 * 3. Loads the user and resolves their `users-access` doc.
 * 4. Reconciles:
 *    - If user has NO access doc: creates `FnB Access ${shortId}` with base + orders + desiredGrants.
 *    - If user has a per-user `FnB Access *` doc: reconciles in place (removes deleted grants).
 *    - If user has a template doc ('FnB Waiter', etc.): clones on write to `FnB Access ${shortId}`.
 * 5. Never mutates shared template docs. Never touches user.operator or user.restaurant.
 */
export const applyEventStaffPanelGrant = async (
  payload: BasePayload,
  userId: string | number,
  req?: PayloadRequest,
): Promise<void> => {
  // 1. Load all current fnb-event-staff rows for that user
  const { docs: staffRows } = await payload.find({
    collection: 'fnb-event-staff',
    where: {
      user: {
        equals: userId,
      },
    },
    depth: 1,
    limit: 200,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  // 2. Compute desiredGrants: one per row, dedupe by slug, skip unresolvable event slugs
  const desiredGrantMap = new Map<string, AccessItem>()
  for (const row of staffRows as FnbEventStaff[]) {
    const eventSlug = await getEventSlugFromRow(payload, row, req)
    if (!eventSlug) {
      payload.logger.warn(
        `[syncEventStaffPanelGrant] Could not resolve event slug for fnb-event-staff row ${row.id}`,
      )
      continue
    }
    const role = row.role as StaffEventRole
    const slug = eventPanelGrantSlug(eventSlug, role)
    if (!desiredGrantMap.has(slug)) {
      desiredGrantMap.set(slug, { slug, read: true, update: true })
    }
  }
  const desiredGrants = Array.from(desiredGrantMap.values())

  // 3. Load user with access doc
  const user = (await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 1,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })) as User | null

  if (!user) {
    payload.logger.warn(`[syncEventStaffPanelGrant] User not found: ${userId}`)
    return
  }

  let accessDoc: UsersAccess | null =
    typeof user.access === 'object' && user.access !== null
      ? (user.access as UsersAccess)
      : null

  // Fallback: if user.access was an unpopulated string/number ID, fetch the users-access doc
  if (!accessDoc && (typeof user.access === 'string' || typeof user.access === 'number')) {
    try {
      accessDoc = (await payload.findByID({
        collection: 'users-access',
        id: String(user.access),
        depth: 0,
        overrideAccess: true,
        ...(req ? { req } : {}),
      })) as UsersAccess | null
    } catch {
      accessDoc = null
    }
  }

  // 5. Reconcile:
  // Case A: No access doc
  if (!accessDoc) {
    if (desiredGrants.length === 0) {
      return
    }

    const shortId = randomUUID().replace(/-/g, '').slice(0, 8)
    const created = (await payload.create({
      collection: 'users-access',
      data: {
        name: `FnB Access ${shortId}`,
        access: [...eventStaffBaseAccessRows, ...desiredGrants].map(sanitizeAccessItem),
      },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })) as UsersAccess

    await payload.update({
      collection: 'users',
      id: userId,
      data: { access: created.id },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
    return
  }

  // Case B: Already on a machine-generated per-user doc - reconcile in place.
  if (PER_USER_DOC_NAME_RE.test(accessDoc.name ?? '')) {
    const rowsThatAreNotEventGrants = (accessDoc.access || []).filter(
      (r) => !isEventGrantSlug(r.slug),
    )

    // Fully unassigned (no event rows left). If this per-user doc only ever held
    // machine-managed slugs (accessNonAdmin base + orders + event grants) it was
    // born fresh for event crew - delete it and revert the user to no access
    // doc, i.e. their pre-assignment state. If it carries other slugs it was
    // cloned from a role template (Case C) and we can't safely reconstruct the
    // original, so leave it (grants stripped) and log.
    if (desiredGrants.length === 0) {
      const managedSlugs = new Set<string>([
        ...(accessNonAdmin.access ?? []).map((r) => r.slug),
        'orders',
      ])
      const onlyManagedSlugs = rowsThatAreNotEventGrants.every((r) =>
        managedSlugs.has(r.slug ?? ''),
      )
      if (onlyManagedSlugs) {
        await payload.update({
          collection: 'users',
          id: userId,
          data: { access: null },
          overrideAccess: true,
          ...(req ? { req } : {}),
        })
        await payload.delete({
          collection: 'users-access',
          id: accessDoc.id,
          overrideAccess: true,
          ...(req ? { req } : {}),
        })
        return
      }
      payload.logger.info(
        `[syncEventStaffPanelGrant] User ${userId} fully unassigned but their per-user access doc carries non-managed slugs; stripping event grants and keeping the doc.`,
      )
      await payload.update({
        collection: 'users-access',
        id: accessDoc.id,
        data: { access: ensureBaseAndOrders(rowsThatAreNotEventGrants) },
        overrideAccess: true,
        ...(req ? { req } : {}),
      })
      return
    }

    const newAccess = ensureBaseAndOrders([...rowsThatAreNotEventGrants, ...desiredGrants])
    await payload.update({
      collection: 'users-access',
      id: accessDoc.id,
      data: {
        access: newAccess,
      },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
    return
  }

  // Case C: Has any other (shared/template) access doc — clone-on-write
  const templateHasEventGrants = (accessDoc.access || []).some((r) => isEventGrantSlug(r.slug))
  if (desiredGrants.length === 0 && !templateHasEventGrants) {
    return
  }

  const shortId = randomUUID().replace(/-/g, '').slice(0, 8)
  const templateRows = (accessDoc.access || []).filter((r) => !isEventGrantSlug(r.slug))
  const newAccess = ensureBaseAndOrders([...templateRows, ...desiredGrants])

  const created = (await payload.create({
    collection: 'users-access',
    data: {
      name: `FnB Access ${shortId}`,
      access: newAccess.map(sanitizeAccessItem),
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })) as UsersAccess

  await payload.update({
    collection: 'users',
    id: userId,
    data: { access: created.id },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
}

/**
 * Reconciles panel grants for every user touched by a write - the row's current
 * user, plus the previous user when a row was reassigned. Failures are logged,
 * never thrown: a grant-sync hiccup must not fail the fnb-event-staff write.
 */
const reconcileGrantsForWrite = async (
  req: PayloadRequest,
  currentUser: unknown,
  previousUser?: unknown,
): Promise<void> => {
  try {
    const userIds = new Set<string | number>()
    const currentUserId = resolveUserId(currentUser)
    if (currentUserId) userIds.add(currentUserId)
    const prevUserId = resolveUserId(previousUser)
    if (prevUserId) userIds.add(prevUserId)

    for (const userId of userIds) {
      await applyEventStaffPanelGrant(req.payload, userId, req)
    }
  } catch (error) {
    req.payload.logger.error(`[syncEventStaffPanelGrant] Failed to sync panel grant: ${error}`)
  }
}

/** afterChange on fnb-event-staff - reconciles the user's event panel grants. */
export const syncEventStaffPanelGrantAfterChange: CollectionAfterChangeHook<FnbEventStaff> = async ({
  doc,
  previousDoc,
  req,
}) => {
  await reconcileGrantsForWrite(req, doc?.user, previousDoc?.user)
  return doc
}

/** afterDelete on fnb-event-staff - re-evaluates the deleted user's remaining grants. */
export const syncEventStaffPanelGrantAfterDelete: CollectionAfterDeleteHook<FnbEventStaff> = async ({
  doc,
  req,
}) => {
  await reconcileGrantsForWrite(req, doc?.user)
  return doc
}
