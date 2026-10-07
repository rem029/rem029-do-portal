/**
 * Client-safe companion to `ownershipAccessRefine`
 * (`@/utilities/access-operator`), for a Payload `admin.condition` that
 * should hide a tab/field for a non-owner the same way the server-side
 * access refine would deny them the document. Deliberately has NO imports
 * from `@/utilities/access` or anywhere else server-only — `admin.condition`
 * callbacks run in the browser, so this inlines the same row-scanning logic
 * those server helpers use rather than importing them (a real server-side
 * gate — a `beforeChange`/`afterRead` hook or a server action's own assert —
 * is still required; this only controls what the admin UI shows).
 *
 * Requires the collection to carry `CreatedByField` + `OwnersField`
 * (`@/common/fields/owners`) and the matching `ownershipAccessRefine` on its
 * `access` block. See `CLAUDE.md` → "Item-level Ownership (optional)".
 */

type OwnableDocData = {
  created_by?: string | { id?: string } | null
  owners?: Array<string | { id?: string }> | null
} | null

type ConditionUser = {
  id?: string | number
  super_user?: boolean | null
  access?: unknown
} | null

export const canUserAccessOwnedDocument = (
  data: OwnableDocData,
  user: ConditionUser,
  slug: string,
): boolean => {
  if (!user) return false
  if (user.super_user) return true

  // Structural cast: `user.access` is a relationship (string id or populated
  // UsersAccess doc) in the generated types; admin.condition always receives
  // it populated, same cast this file's callers used before extraction.
  const rows =
    (user.access as { access?: Array<{ slug?: string; update?: boolean; super_user?: boolean }> })
      ?.access ?? []
  const isCollectionSuper = rows.some((r) => r.slug === slug && r.super_user)
  const canUpdate = rows.some((r) => r.slug === slug && r.update === true)
  if (isCollectionSuper) return true
  if (!canUpdate) return false

  const ownerIds = (data?.owners ?? [])
    .map((o) => (typeof o === 'string' ? o : o?.id))
    .filter((id): id is string => Boolean(id))
  const createdById = typeof data?.created_by === 'string' ? data.created_by : data?.created_by?.id

  return createdById === String(user.id) || ownerIds.includes(String(user.id))
}
