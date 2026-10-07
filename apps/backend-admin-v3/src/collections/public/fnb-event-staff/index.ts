import type { Access, CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { canManageEventStaffForEvent, getOwnedEventIds } from '@/utilities/fnb-staff-access'
import type { FnbEventStaff as FnbEventStaffType, User } from '@/payload-types'
import { getOperatorField } from '../menu-pages/fields'
import { validateEventStaffAssignment } from './hooks/validate-assignment'
import {
  syncEventStaffPanelGrantAfterChange,
  syncEventStaffPanelGrantAfterDelete,
} from './hooks/sync-panel-grant'
import { notifyAssignmentAfterChange } from './hooks/notify-assignment'

const SLUG = 'fnb-event-staff'

/**
 * Resolves the `event` id a create/update/delete/single-doc-read access
 * check is about: `data.event` for create (and for a single-doc read, where
 * Payload populates `data` with the document itself), or looked up from the
 * existing row for update/delete. Returns `undefined` for Payload's generic,
 * document-independent capability checks (no `data`/`id` at all — see
 * `getOwnedEventIds`'s doc comment for what those are for).
 */
const resolveEventIdFromArgs = async (
  args: Parameters<Access>[0],
): Promise<string | number | undefined> => {
  const eventVal = (args.data as Partial<FnbEventStaffType> | undefined)?.event
  if (eventVal) return typeof eventVal === 'object' ? eventVal?.id : eventVal

  if (args.id) {
    const existing = await args.req.payload
      .findByID({ collection: SLUG, id: args.id, depth: 0, overrideAccess: true })
      .catch(() => null)
    return typeof existing?.event === 'object' ? existing.event?.id : existing?.event
  }

  return undefined
}

/** create/update/delete access: operator-wide grant, else event ownership. */
const withOwnershipFallback = (op: 'create' | 'update' | 'delete'): Access =>
  (async (args) => {
    const base = await accessCheckResolver(SLUG, op, {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    })(args)
    if (base) return base

    const user = args.req.user as User | null
    const eventId = await resolveEventIdFromArgs(args)
    if (eventId) return canManageEventStaffForEvent(args.req.payload, user, eventId)

    // Generic, document-independent capability check (no data/id) — see
    // getOwnedEventIds's doc comment.
    const ownedEventIds = await getOwnedEventIds(args.req.payload, user)
    return ownedEventIds.length > 0
  }) as Access

const FnbEventStaff: CollectionConfig = {
  slug: SLUG,
  labels: { singular: 'Staff Access', plural: 'Staff Access' },
  admin: {
    group: 'FnB Events',
    useAsTitle: 'operator_slug',
    // Structural cast: u.user matches ClientUser shape, cast to User
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    defaultColumns: ['event', 'user', 'role'],
  },
  fields: [
    getOperatorField(),
    {
      type: 'relationship',
      relationTo: 'fnb-menu-events',
      name: 'event',
      label: 'Event',
      required: true,
      filterOptions: ({ data, req }) => {
        const u = req.user as { super_user?: boolean; operator?: unknown } | undefined
        const opId =
          data?.operator ??
          (typeof u?.operator === 'object' && u?.operator !== null
            ? (u.operator as { id?: unknown }).id
            : u?.operator)
        if (opId) return { operator: { equals: opId } }
        return !!u?.super_user
      },
    },
    {
      type: 'relationship',
      relationTo: 'users',
      name: 'user',
      label: 'Staff User',
      required: true,
      admin: {
        components: {
          Field: {
            path: '@/collections/public/fnb-event-staff/components/staff-user-field#StaffUserField',
          },
          Cell: {
            path: '@/collections/public/fnb-event-staff/components/staff-user-cell#StaffUserCell',
          },
        },
      },
      filterOptions: ({ data, req }) => {
        const u = req.user as { super_user?: boolean; operator?: unknown } | undefined
        const opId =
          data?.operator ??
          (typeof u?.operator === 'object' && u?.operator !== null
            ? (u.operator as { id?: unknown }).id
            : u?.operator)
        if (opId) return { operator: { equals: opId } }
        return !!u?.super_user
      },
    },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      required: true,
      options: [
        { label: 'Waiter', value: 'waiter' },
        { label: 'Back of House', value: 'boh' },
        { label: 'Cashier', value: 'cashier' },
      ],
      admin: {
        description:
          'Which event panel this user runs. "Back of House only" events should use Back of House. Events auto-complete on served, so Cashier is rarely needed.',
      },
    },
    {
      type: 'text',
      name: 'operator_slug',
      label: 'Operator Slug',
      unique: true,
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-generated unique identifier.',
        condition: (data) => Boolean(data?.operator_slug),
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    // Structural cast: admin accessCheckResolver returns generic Access, cast as AccessAdmin
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    // read/create/update/delete: the operator-wide `fnb-event-staff` grant
    // (via accessCheckResolver + operatorAccessRefine) is tried first; if
    // that denies, fall back to ownership so an event's own creator/owner
    // can staff it even without that separate grant (added 2026-09-14, user
    // request — see fnb-staff-access.ts's doc comments on
    // `isEventOwnerOrCreator`/`getOwnedEventIds`). `accessCheckResolver`'s
    // `refineAccess` signature doesn't receive `data`/`id`, so the fallback
    // is layered here directly rather than inside a refine function.
    read: (async (args) => {
      const base = await accessCheckResolver(SLUG, 'read', {
        fallbackAccess: false,
        refineAccess: operatorAccessRefine,
      })(args)
      if (base) return base

      const user = args.req.user as User | null
      if (!user) return false

      if (args.id) {
        const eventId = await resolveEventIdFromArgs(args)
        return canManageEventStaffForEvent(args.req.payload, user, eventId)
      }

      // List query (no id) — scope to events this user owns, same shape
      // `ownershipAccessRefine` applies to the event documents themselves.
      const ownedEventIds = await getOwnedEventIds(args.req.payload, user)
      if (ownedEventIds.length === 0) return false
      return { event: { in: ownedEventIds } }
    }) as Access,
    create: withOwnershipFallback('create'),
    update: withOwnershipFallback('update'),
    delete: withOwnershipFallback('delete'),
  },
  hooks: {
    beforeValidate: [validateEventStaffAssignment],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [
      auditLogAfterChange(SLUG),
      syncEventStaffPanelGrantAfterChange,
      notifyAssignmentAfterChange,
    ],
    afterDelete: [auditLogAfterDelete(SLUG), syncEventStaffPanelGrantAfterDelete],
  },
}

export default FnbEventStaff
