import type { BasePayload } from 'payload'
import type { FnbMenuEvent, User, UsersAccess } from '@/payload-types'
import { hasUserAccess } from './access'

export type StaffEventRole = 'waiter' | 'boh' | 'cashier'
export type StaffEventScope = Record<StaffEventRole, string[]>

export const EVENT_STAFF_ROLES: StaffEventRole[] = ['waiter', 'boh', 'cashier']

/** The users-access slug that grants one role on one event. */
export const eventPanelGrantSlug = (eventSlug: string, role: StaffEventRole): string =>
  `fnb-order-panel:${eventSlug}:${role}`

/** Matches an event grant slug → [ , eventSlug, role ]. */
export const EVENT_GRANT_SLUG_RE = /^fnb-order-panel:(.+):(waiter|boh|cashier)$/

const accessRows = (user: User | null | undefined): NonNullable<UsersAccess['access']> => {
  const access =
    typeof user?.access === 'object' && user?.access !== null
      ? (user.access as UsersAccess)
      : undefined
  return access?.access ?? []
}

/**
 * Every event a user is staff on, split by the role they hold on it — read
 * straight off `user.access` (populated on `req.user`). Assignment-driven source
 * of truth for event order scope; NO operator/super_user escalation (use
 * {@link resolveStaffEventScope} for that). Pure + synchronous — no DB.
 */
export const getStaffEventScope = (user: User | null | undefined): StaffEventScope => {
  const bucket: StaffEventScope = { waiter: [], boh: [], cashier: [] }
  for (const row of accessRows(user)) {
    const m = row.slug?.match(EVENT_GRANT_SLUG_RE)
    if (!m) continue
    const [, eventSlug, role] = m
    if (bucket[role as StaffEventRole] && !bucket[role as StaffEventRole].includes(eventSlug)) {
      bucket[role as StaffEventRole].push(eventSlug)
    }
  }
  return bucket
}

/** True if the user holds ANY `fnb-order-panel:<event>:<role>` grant for `role`. */
export const hasAnyEventPanelGrant = (
  user: User | null | undefined,
  role: StaffEventRole,
): boolean => {
  if (!user) return false
  if (user.super_user) return true
  return accessRows(user).some((r) => {
    const m = r.slug?.match(EVENT_GRANT_SLUG_RE)
    return !!m && m[2] === role && r.read === true
  })
}

/**
 * True for anyone who may see event order data at all — super_user, `orders`
 * read (any floor staffer), or any event panel grant. Screens out HR/CRM/etc.
 */
export const isFnbEventStaff = (user: User | null | undefined): boolean =>
  !!user &&
  (!!user.super_user ||
    hasUserAccess(user, 'orders', 'read') ||
    accessRows(user).some((r) => EVENT_GRANT_SLUG_RE.test(r.slug ?? '')))

/**
 * Whether a user may perform `op` on event-staff assignments (`fnb-event-staff`),
 * used to gate the event "Access" tab join field. Mirrors the `fnb-event-staff`
 * collection's own per-operation access:
 *   - `read`   → see the staff list
 *   - `create` → add an assignment
 *   - `update` → change an assignment
 *   - `delete` → remove an assignment (enforced by the collection's delete access;
 *                field access has no `delete`, so this is here for callers that
 *                need the check directly)
 *   - `super_user` → all of the above
 * The `fnb-event-staff` collection still enforces operator scoping
 * (`operatorAccessRefine`) on every write regardless.
 */
export const canAccessEventStaff = (
  user: User | null | undefined,
  op: 'read' | 'create' | 'update' | 'delete',
): boolean => !!user && (!!user.super_user || hasUserAccess(user, 'fnb-event-staff', op))

/**
 * True if `user` is the creator or a listed owner of `event` — the same
 * ownership rule `ownershipAccessRefine` (`access-operator.ts`) applies to
 * the event document itself. Added 2026-09-14 (user request) to extend that
 * same bypass to managing the event's staff: today, staffing an event only
 * ever goes through the operator-wide `fnb-event-staff` grant
 * (`canAccessEventStaff` above), orthogonal to who owns the event by design
 * (TECH-0098 Task 11C's out-of-scope note) — this lets an event owner staff
 * their *own* event even without that separate grant, without touching
 * `canAccessEventStaff`'s existing operator-wide behavior for anyone else.
 */
export const isEventOwnerOrCreator = (
  user: User | null | undefined,
  event: Pick<FnbMenuEvent, 'created_by' | 'owners'> | null | undefined,
): boolean => {
  if (!user || !event) return false
  const createdById =
    typeof event.created_by === 'string' ? event.created_by : event.created_by?.id
  if (createdById && String(createdById) === String(user.id)) return true
  const ownerIds = (event.owners ?? []).map((o) => (typeof o === 'string' ? o : o?.id))
  return ownerIds.some((id) => id != null && String(id) === String(user.id))
}

/**
 * Loads `fnb-menu-events` doc `eventId` (depth 0 — only `operator`/
 * `created_by`/`owners` are read) and checks operator match (tenant
 * boundary, non-negotiable) + {@link isEventOwnerOrCreator}. Used as the
 * ownership fallback in `fnb-event-staff`'s own `create`/`update`/`delete`
 * access, where only an id is available (not the full event doc) — see
 * `isEventOwnerOrCreator` for the read-side equivalent that already has the
 * event doc in hand (the `staff` join field on `fnb-menu-events`).
 */
export const canManageEventStaffForEvent = async (
  payload: BasePayload,
  user: User | null | undefined,
  eventId: string | number | null | undefined,
): Promise<boolean> => {
  if (!user || !eventId) return false
  if (user.super_user) return true

  let event: FnbMenuEvent | null
  try {
    event = await payload.findByID({
      collection: 'fnb-menu-events',
      id: eventId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return false
  }
  if (!event) return false

  const userOperatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator
  const eventOperatorId = typeof event.operator === 'object' ? event.operator?.id : event.operator
  if (!userOperatorId || String(userOperatorId) !== String(eventOperatorId)) return false

  return isEventOwnerOrCreator(user, event)
}

/**
 * IDs of every `fnb-menu-events` document `user` created or was added to
 * `owners` on. Two uses in `fnb-event-staff`'s access (`index.ts`):
 *   - `read` with no `id` (a list query, not one specific row): returned as
 *     an `{ event: { in: [...] } }` Where clause, the same shape
 *     `ownershipAccessRefine` (`access-operator.ts`) applies to the event
 *     documents themselves.
 *   - `create`/`update`/`delete` with no `id`/`data.event` (Payload's
 *     *generic*, document-independent capability check — used only to decide
 *     whether to show the join field's "Add new" button and row actions, see
 *     `@payloadcms/ui`'s `AddNewButton`/`RelationshipTable`, which read
 *     `permissions.collections[slug].create` etc. with no document context
 *     at all): a non-empty list is enough to unlock the button/actions —
 *     the real, event-specific check (`canManageEventStaffForEvent`) still
 *     re-validates the actual target event id whenever one is available
 *     (i.e. on the real submit), so this can't be used to reach an event the
 *     caller doesn't actually own.
 */
export const getOwnedEventIds = async (
  payload: BasePayload,
  user: User | null | undefined,
): Promise<(string | number)[]> => {
  if (!user) return []
  try {
    const { docs } = await payload.find({
      collection: 'fnb-menu-events',
      where: { or: [{ created_by: { equals: user.id } }, { owners: { in: [user.id] } }] },
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    })
    return docs.map((d) => d.id)
  } catch {
    return []
  }
}

const uniq = (values: string[]): string[] => Array.from(new Set(values))

/**
 * `info.slug` of every `fnb-menu-events` document `user` created or was added
 * to `owners` on — slug counterpart of {@link getOwnedEventIds}, used to scope
 * the `fnb-event-orders-report` to a non-super, non-operator-wide user's own
 * events (see {@link resolveEventReportScope} in
 * `globals/fnb-orders-report/components/actions.ts`).
 */
export const getOwnedEventSlugs = async (
  payload: BasePayload,
  user: User | null | undefined,
): Promise<string[]> => {
  if (!user) return []
  try {
    const { docs } = await payload.find({
      collection: 'fnb-menu-events',
      where: { or: [{ created_by: { equals: user.id } }, { owners: { in: [user.id] } }] },
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    })
    return uniq(
      (docs as FnbMenuEvent[]).map((d) => d.info?.slug).filter((s): s is string => !!s),
    )
  } catch {
    return []
  }
}

/** Published `fnb-menu-events` slugs, optionally narrowed to one operator. */
export const findEventSlugs = async (
  payload: BasePayload,
  opts: { operatorId?: string | number } = {},
): Promise<string[]> => {
  const { docs } = await payload.find({
    collection: 'fnb-menu-events',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(opts.operatorId ? [{ operator: { equals: opts.operatorId } }] : []),
      ],
    },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })
  return uniq(
    docs
      .map((doc) => (doc as FnbMenuEvent).info?.slug)
      .filter((slug): slug is string => !!slug),
  )
}

/**
 * The concrete set of event slugs a user may see order data for, clamped to
 * `requestedSlugs` when given. Layers escalation on top of the assignment-driven
 * {@link getStaffEventScope}:
 *   - super_user  → the requested slugs as-is, or every published event
 *   - everyone else → ONLY the events they hold a `fnb-event-staff` row for
 *     (any role)
 *   - anyone else (no assignments) → `[]`
 * Used by the event SSE route and `listEventOrdersAction` (403 / empty when `[]`).
 */
export const resolveStaffEventScope = async (
  payload: BasePayload,
  user: User | null,
  requestedSlugs?: string[] | null,
): Promise<string[]> => {
  if (!user) return []
  const requested = requestedSlugs?.filter(Boolean)
  const clamp = (allowed: string[]): string[] =>
    requested && requested.length > 0
      ? allowed.filter((s) => requested.includes(s))
      : allowed

  if (user.super_user) {
    if (requested && requested.length > 0) return uniq(requested)
    return findEventSlugs(payload)
  }

  const scope = getStaffEventScope(user) // sync, no DB
  const ownSlugs = uniq([...scope.waiter, ...scope.boh, ...scope.cashier])
  return clamp(ownSlugs)
}

/**
 * Resolves which restaurant a staff member may operate on, shared by the SSE
 * stream route and the order board server actions. A user pinned to a
 * restaurant always gets that one; super users get whichever they requested;
 * operator-level users get the requested restaurant only if it belongs to
 * their operator.
 */
export const resolveStaffRestaurantId = async (
  payload: BasePayload,
  user: User | null,
  requestedRestaurantId?: string,
): Promise<string | null> => {
  if (!user) return null

  const userRestaurantId =
    typeof user.restaurant === 'object' ? user.restaurant?.id : user.restaurant
  const userOperatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator

  if (userRestaurantId) return userRestaurantId

  if (user.super_user) {
    return requestedRestaurantId || null
  }

  if (userOperatorId && requestedRestaurantId) {
    try {
      const restaurant = await payload.findByID({
        collection: 'restaurants',
        id: requestedRestaurantId,
        depth: 0,
        overrideAccess: true,
      })
      const restaurantOperatorId =
        typeof restaurant.operator === 'object' ? restaurant.operator?.id : restaurant.operator
      if (restaurantOperatorId === userOperatorId) return requestedRestaurantId
    } catch {
      return null
    }
  }

  return null
}
