import { APIError } from 'payload'
import type { Access, FieldAccess, Payload, PayloadRequest, Where } from 'payload'
import type { User } from '@/payload-types'
import { hasUserAccess } from '@/utilities/access'

export type TripRequestSlug = 'trip-scheduling-adhoc' | 'trip-scheduling-bookings'

const asUser = (user: unknown): User | null => (user as User | null | undefined) ?? null

// An approver is a super user, or a user whose access grant for the collection has `update` ticked.
export const isTripApprover = (user: unknown, slug: TripRequestSlug): boolean =>
  hasUserAccess(asUser(user), slug, 'update')

// Approval state (status, driver, decline reason...) can only be written by approvers. Local API calls
// (the public token approval, hooks, imports) bypass field access and are validated separately.
export const approverFieldAccess = (
  slug: TripRequestSlug,
): { create: FieldAccess; update: FieldAccess } => {
  const canWrite: FieldAccess = ({ req }) => isTripApprover(req.user, slug)
  return { create: canWrite, update: canWrite }
}

// Collection access for a request collection. Owners can read their own rows and nothing else; approvers
// (grant-based) read, create, update and delete according to their grant.
export const tripRequestAccess = (
  slug: TripRequestSlug,
  ownerWhere: (user: User) => Where,
): { read: Access; create: Access; update: Access; delete: Access } => ({
  read: ({ req }) => {
    const user = asUser(req.user)
    if (!user) return false
    if (hasUserAccess(user, slug, 'read')) return true
    return ownerWhere(user)
  },
  create: ({ req }) => hasUserAccess(asUser(req.user), slug, 'create'),
  update: ({ req }) => isTripApprover(req.user, slug),
  delete: ({ req }) => hasUserAccess(asUser(req.user), slug, 'delete'),
})

type RelationValue = string | number | { id: string | number } | null | undefined

const toId = (value: RelationValue): string | number | null => {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'object' ? value.id : value
}

// A driver referenced by an approval must be a real record and be active.
export async function assertApprovableDriver(
  payload: Payload,
  driverValue: RelationValue,
  req?: PayloadRequest,
): Promise<void> {
  const driverId = toId(driverValue)

  if (driverId === null) {
    throw new APIError(
      'A driver must be selected before a request can be approved.',
      400,
      undefined,
      true,
    )
  }

  // Drivers are readable by everyone, and the public token flow has no user, so read them directly.
  const driver = await payload
    .findByID({
      collection: 'trip-scheduling-drivers',
      id: driverId as string,
      depth: 0,
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
    .catch(() => null)

  if (!driver) {
    throw new APIError('The selected driver does not exist.', 400, undefined, true)
  }

  if (driver.isActive === false) {
    throw new APIError(
      'The selected driver is not active and cannot be assigned.',
      400,
      undefined,
      true,
    )
  }
}

interface ApprovalDriverArgs {
  operation: 'create' | 'update'
  data: { status?: string | null; driver?: RelationValue }
  originalDoc?: { status?: string | null; driver?: RelationValue } | null
  req: PayloadRequest
}

// Runs only when a request becomes approved or its driver changes while approved, so unrelated edits of
// an approved trip (whose driver may have been deactivated since) are not re-validated. Creates are exempt:
// they come from CSV imports and the workflow sync, or from approvers, never from requesters.
export async function validateApprovalDriver({
  operation,
  data,
  originalDoc,
  req,
}: ApprovalDriverArgs): Promise<void> {
  if (operation !== 'update') return

  const nextStatus = data.status ?? originalDoc?.status
  if (nextStatus !== 'approved') return

  const becameApproved = originalDoc?.status !== 'approved'
  const driverSent = 'driver' in data
  const driverChanged = driverSent && toId(data.driver) !== toId(originalDoc?.driver)

  if (!becameApproved && !driverChanged) return

  await assertApprovableDriver(req.payload, driverSent ? data.driver : originalDoc?.driver, req)
}
