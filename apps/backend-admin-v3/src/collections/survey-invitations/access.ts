import type { Access, PayloadRequest, Where } from 'payload'
import type { User, UsersAccess } from '@/payload-types'
import type { AccessAdmin } from '@/utilities/access'

/**
 * Access model for `survey-invitations` (non-super users):
 *
 * There is no dedicated `survey-invitations` grant. Instead a user is scoped **per survey
 * form** via the same slug the send UI uses — `survey-send-invitation-<form.slug>` — and the
 * per-slug `read` / `create` / `update` / `delete` flags on that entry drive the matching
 * operation on the invitation rows for that form. Operator scope is intentionally not applied
 * (a delegated user may manage another operator's survey invitations).
 *
 * Super users bypass all of this.
 */

const SEND_SLUG_PREFIX = 'survey-send-invitation-'

type GrantFlag = 'read' | 'create' | 'update' | 'delete'
type AccessGrant = NonNullable<UsersAccess['access']>[number]

const userAccessGrants = (user: User | null): AccessGrant[] => {
  const access = user?.access as UsersAccess | null | undefined
  return Array.isArray(access?.access) ? access.access : []
}

/** Form slugs the user holds `flag` on, extracted from their `survey-send-invitation-<slug>` grants. */
const grantedFormSlugs = (user: User | null, flag: GrantFlag): string[] =>
  userAccessGrants(user)
    .filter((g) => g.slug.startsWith(SEND_SLUG_PREFIX) && g[flag] === true)
    .map((g) => g.slug.slice(SEND_SLUG_PREFIX.length))
    .filter(Boolean)

/** True when the user holds `flag` on `survey-send-invitation-<formSlug>` (or is a super user). */
export const hasSurveyFormGrant = (
  user: User | null,
  formSlug: string,
  flag: GrantFlag,
): boolean => {
  if (!user) return false
  if (user.super_user) return true
  return grantedFormSlugs(user, flag).includes(formSlug)
}

/** Resolve form slugs → form ids. `overrideAccess` so it never recurses into forms' own access. */
const formIdsForSlugs = async (req: PayloadRequest, slugs: string[]): Promise<string[]> => {
  if (slugs.length === 0) return []
  const res = await req.payload.find({
    collection: 'forms',
    where: { slug: { in: slugs } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return res.docs.map((doc) => String(doc.id))
}

/**
 * `read` / `update` / `delete` access: returns a `Where` scoping to the forms the user has the
 * matching flag on, or `false` when they have no such grant.
 */
export const surveyInvitationsAccess =
  (flag: Extract<GrantFlag, 'read' | 'update' | 'delete'>): Access =>
  async ({ req }) => {
    const user = req.user as unknown as User | null
    if (!user) return false
    if (user.super_user) return true

    const formIds = await formIdsForSlugs(req, grantedFormSlugs(user, flag))
    if (formIds.length === 0) return false

    return { form: { in: formIds } } satisfies Where
  }

/**
 * `create` access: boolean. When a `form` is present on the incoming data (the real create
 * path) it must be one the user holds `create` on; with no data context (a capability probe)
 * we allow it through and let the data-bound call be the real gate.
 */
export const surveyInvitationsCreateAccess: Access = async ({ req, data }) => {
  const user = req.user as unknown as User | null
  if (!user) return false
  if (user.super_user) return true

  const slugs = grantedFormSlugs(user, 'create')
  if (slugs.length === 0) return false

  const formValue = (data as { form?: unknown } | undefined)?.form
  const formId =
    typeof formValue === 'object' && formValue !== null
      ? String((formValue as { id?: unknown }).id ?? '')
      : typeof formValue === 'string'
        ? formValue
        : ''

  if (!formId) return true

  const formIds = await formIdsForSlugs(req, slugs)
  return formIds.includes(formId)
}

/** Collection admin-UI access: any `read` grant on a `survey-send-invitation-<slug>` entry. */
export const surveyInvitationsAdminAccess: AccessAdmin = (async ({ req }) => {
  const user = req.user as unknown as User | null
  if (!user) return false
  if (user.super_user) return true
  return grantedFormSlugs(user, 'read').length > 0
}) as AccessAdmin

/** `admin.hidden` — mirror of `surveyInvitationsAdminAccess` for the nav item. */
export const surveyInvitationsHidden = (user: User | null): boolean => {
  if (!user) return true
  if (user.super_user) return false
  return grantedFormSlugs(user, 'read').length === 0
}
