import { Field } from 'payload'
import { isCollectionSuperUser } from '@/utilities/access'
import type { User } from '@/payload-types'

/**
 * Optional item-level ownership field. Pairs with `CreatedByField` and
 * `ownershipAccessRefine` (`@/utilities/access-operator`) — and
 * `canUserAccessOwnedDocument` (`@/utilities/ownership-condition`) for any
 * `admin.condition` that should follow the same rule — to scope a
 * collection's access to "documents I created or was added to" instead of
 * every document an operator-wide grant would otherwise expose. See
 * `CLAUDE.md` → "Item-level Ownership (optional)" for the full pattern.
 * Introduced for `fnb-menu-events` (TECH-0098 Task 11C); reusable as-is by
 * any collection whose top-level fields already include an `operator`
 * relationship (via `getOperatorField()` or equivalent).
 *
 * Field-level access is deliberately tighter than the collection's own
 * `update` access: everyone who can open the document can READ who the
 * owners are, but only a super user (global `user.super_user`, or the
 * collection's own `user.access.<slug>.super_user` row — checked via
 * `isCollectionSuperUser`) can CHANGE it. A regular owner/creator sees the
 * field read-only — they can't add or remove co-owners themselves, so
 * ownership sharing stays admin-controlled rather than self-service.
 */
export const getOwnersField = (slug: string): Field => ({
  type: 'relationship',
  name: 'owners',
  label: 'Additional Owners',
  relationTo: 'users',
  hasMany: true,
  filterOptions: ({ data }) => (data?.operator ? { operator: { equals: data.operator } } : false),
  access: {
    read: () => true,
    update: ({ req }) => isCollectionSuperUser(req.user as User | null, slug),
  },
  admin: {
    position: 'sidebar',
    description:
      'Share this record with specific teammates so they can see and manage it even though they didn’t create it. The creator always has access. Only a super user can change this list.',
  },
})
