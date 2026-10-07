import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Validates an event staff assignment:
 * 1. Ensures the selected event and user exist.
 * 2. Cross-operator guard: ensures user and event belong to the same operator.
 * 3. Derives data.operator from event.operator.
 * 4. Derives deterministic data.operator_slug: `${operatorSlug}:${eventSlug}:${userId}:${role}`.
 * 5. Compound-uniqueness guard: ensures { event, user, role } combination is unique.
 */
export const validateEventStaffAssignment: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) return data

  const eventId =
    (typeof data.event === 'object' && data.event !== null ? data.event.id : data.event) ??
    (typeof originalDoc?.event === 'object' && originalDoc?.event !== null
      ? originalDoc.event.id
      : originalDoc?.event)

  const userId =
    (typeof data.user === 'object' && data.user !== null ? data.user.id : data.user) ??
    (typeof originalDoc?.user === 'object' && originalDoc?.user !== null
      ? originalDoc.user.id
      : originalDoc?.user)

  const role = (data.role ?? originalDoc?.role) as string | undefined

  // If required fields are missing, allow Payload's standard required validators to fire
  if (!eventId || !userId || !role) {
    return data
  }

  const [event, user] = await Promise.all([
    req.payload.findByID({
      collection: 'fnb-menu-events',
      id: eventId,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ])

  if (!event) {
    throw new APIError('The selected event does not exist.', 400)
  }

  if (!user) {
    throw new APIError('The selected user does not exist.', 400)
  }

  // Cross-operator guard
  const eventOperatorId =
    typeof event.operator === 'object' && event.operator !== null
      ? event.operator.id
      : event.operator

  const userOperatorId =
    typeof user.operator === 'object' && user.operator !== null
      ? user.operator.id
      : user.operator

  if (!eventOperatorId || !userOperatorId || String(eventOperatorId) !== String(userOperatorId)) {
    throw new APIError('The selected user belongs to a different operator than the event.', 400)
  }

  // The manager creating/editing the row must belong to the same operator
  // (unless super_user). `create` collection access returns a Where clause that
  // Payload does not enforce on create, so this is where cross-tenant creation
  // is actually blocked.
  const actor = req.user as { super_user?: boolean; operator?: unknown } | undefined
  if (actor && !actor.super_user) {
    const actorOperatorId =
      typeof actor.operator === 'object' && actor.operator !== null
        ? (actor.operator as { id?: unknown }).id
        : actor.operator
    if (!actorOperatorId || String(actorOperatorId) !== String(eventOperatorId)) {
      throw new APIError('You can only assign staff for your own operator.', 403)
    }
  }

  // Derive operator from event
  data.operator = eventOperatorId

  // Derive deterministic operator_slug
  const operator = await req.payload.findByID({
    collection: 'operators',
    id: eventOperatorId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const operatorSlug = operator?.slug || String(eventOperatorId)
  const eventSlug =
    (event as { info?: { slug?: string }; slug?: string })?.info?.slug ??
    (event as { slug?: string })?.slug ??
    String(eventId)

  data.operator_slug = `${operatorSlug}:${eventSlug}:${userId}:${role}`

  // Compound-uniqueness guard
  const { docs: existing } = await req.payload.find({
    collection: 'fnb-event-staff',
    where: {
      and: [
        { event: { equals: eventId } },
        { user: { equals: userId } },
        { role: { equals: role } },
        ...(operation === 'update' && originalDoc?.id
          ? [{ id: { not_equals: originalDoc.id } }]
          : []),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (existing.length > 0) {
    throw new APIError('This user already has that role on this event.', 400)
  }

  return data
}
