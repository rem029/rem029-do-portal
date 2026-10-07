'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Form, User } from '@/payload-types'
import { hasUserAccess } from '@/utilities/access'
import { dedupeEmails } from '@/utilities/dedupe-emails'
import {
  findSurveyDepartmentBlock,
  getSurveyDepartmentOptions,
  type SurveyDepartmentOption,
} from '@/utilities/survey-department'

export interface SurveyFormOption {
  id: string
  title: string
}

export interface SurveyDepartmentOptionsResult {
  hasDepartmentField: boolean
  options: SurveyDepartmentOption[]
}

/**
 * Checks whether a survey form contains a survey-department field and returns its offered
 * department options for the bulk-send dropdown. Re-checks the user's per-form read grant.
 */
export async function fetchSurveyDepartmentOptions(
  userId: string,
  formId: string,
): Promise<SurveyDepartmentOptionsResult> {
  const empty: SurveyDepartmentOptionsResult = { hasDepartmentField: false, options: [] }
  if (!userId || !formId?.trim()) return empty

  const payload = await getPayload({ config })

  const user = (await payload
    .findByID({ collection: 'users', id: userId, depth: 1, overrideAccess: true })
    .catch(() => null)) as User | null
  const form = (await payload
    .findByID({ collection: 'forms', id: formId, depth: 0, overrideAccess: true })
    .catch(() => null)) as Form | null

  if (!user || !form || !canUseSurveyForm(user, form, 'read')) return empty

  const block = findSurveyDepartmentBlock(form)
  if (!block) {
    return { hasDepartmentField: false, options: [] }
  }

  const options = await getSurveyDepartmentOptions(payload, form)
  return {
    hasDepartmentField: true,
    options,
  }
}

/**
 * True when this user may see/target a given survey form in the bulk-send UI: a super user, or
 * the user has been granted the per-form access slug `survey-send-invitation-<form.slug>`.
 * `type` is `'read'` for dropdown visibility, `'update'` for the actual send authorization.
 *
 * Intentionally NOT operator-scoped: the per-form slug grant is the entire access model here,
 * so it works across operators (a grantee can send for a form belonging to another operator).
 * `hasUserAccess` already returns `true` for `super_user`.
 */
const canUseSurveyForm = (
  user: User,
  form: Pick<Form, 'slug'>,
  type: 'read' | 'update',
): boolean => hasUserAccess(user, `survey-send-invitation-${form.slug}`, type)

/**
 * Survey forms for the bulk-send dropdown. Mirrors the RBAC re-check pattern in
 * `workflow-dashboard/components/actions.ts`: a server action has no admin session cookie to
 * resolve a `req.user` from, so every read below uses `overrideAccess: true` and access is
 * re-applied manually instead — here via `canUseSurveyForm` (the per-form
 * `survey-send-invitation-<slug>` grant). The page itself is still gated by the base
 * `survey-send-invitation` slug (`admin.hidden` / `access.read`); this only narrows the list.
 *
 * `depth: 1` on the user fetch is required so the `access` relationship (→ `users-access`) is
 * populated — `hasUserAccess` reads the nested `access` array off it.
 */
export async function fetchSurveyForms(userId: string): Promise<SurveyFormOption[]> {
  if (!userId) return []

  const payload = await getPayload({ config })

  const user = (await payload
    .findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)) as User | null

  if (!user) return []

  const forms = await payload.find({
    collection: 'forms',
    where: { is_survey: { equals: true } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  return forms.docs
    .filter((doc) => canUseSurveyForm(user, doc, 'read'))
    .map((doc) => ({ id: doc.id, title: doc.title }))
}

// Authorization for this action is per-form: the requester must hold the
// `survey-send-invitation-<form.slug>` grant (with `update`), or be a super user — see
// `canUseSurveyForm`. It is deliberately NOT gated on the base `survey-send-invitation` slug
// or on operator scope; the per-form grant is the whole model. The `payload.jobs.queue` /
// downstream `payload.create` calls run with `overrideAccess: true`.

export interface BulkSendActionResult {
  success: boolean
  queuedCount?: number
  formTitle?: string
  error?: string
}

/**
 * Validates requester permissions and form configuration, then queues the background job
 * `survey-bulk-send` to process invitation generation and email dispatch asynchronously.
 *
 * Auth: re-derives the user from `userId` (a server action has no admin session cookie to build
 * a `req.user` from automatically) and re-checks the per-form `survey-send-invitation-<slug>`
 * update grant — never trust the client to have already gated this.
 */
export async function sendBulkSurveyInvitations(
  userId: string,
  formId: string,
  emails: string[],
  resendExisting = false,
  departmentId?: string,
): Promise<BulkSendActionResult> {
  const payload = await getPayload({ config })
  const { logger } = payload

  const user = (await payload
    .findByID({
      collection: 'users',
      id: userId,
      // `depth: 1` so the `access` relationship (→ `users-access`) is populated for
      // `hasUserAccess` / `canUseSurveyForm`.
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)) as User | null

  if (!user) {
    logger.warn('[survey-invitations bulk-send] Unauthenticated request rejected.')
    return { success: false, error: 'Unauthorized' }
  }

  if (!formId?.trim()) {
    return { success: false, error: 'formId is required' }
  }

  if (!Array.isArray(emails)) {
    return { success: false, error: 'emails must be an array of strings' }
  }

  let form: Form
  try {
    // overrideAccess: true — authorization is the per-form `survey-send-invitation-<slug>` grant
    // checked below, NOT the requester's `forms` collection read access (a delegated sender may
    // legitimately have no `forms:read` at all).
    form = await payload.findByID({
      collection: 'forms',
      id: formId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return { success: false, error: 'Form not found' }
  }

  if (!form.is_survey) {
    return { success: false, error: 'Form is not marked as a survey' }
  }

  // The survey-form code is the fixed suffix of every invitation code (`<random 6>-<survey code>`).
  // It is assigned by a `forms` beforeChange hook the first time `is_survey` is turned on, so a
  // survey form that has never been saved since that hook shipped may not have one yet.
  const surveyFormCode = typeof form.survey_code === 'string' ? form.survey_code.trim() : ''

  if (!surveyFormCode) {
    return {
      success: false,
      error:
        'This survey form has no survey code assigned yet. Open the form in the admin and save it once to generate one, then retry.',
    }
  }

  const operatorId = typeof form.operator === 'string' ? form.operator : form.operator?.id

  if (!operatorId) {
    return { success: false, error: 'Form has no operator assigned' }
  }

  // Authorization is per-form, not operator-scoped: the requester must hold the
  // `survey-send-invitation-<form.slug>` grant (with `update`) — or be a super user. This is
  // deliberately cross-operator: a grantee can send invitations for a form owned by another
  // operator. The resulting `survey-invitations` rows are stamped with the form's operator
  // (`operatorId` below), so the grantee may not see them in the operator-scoped list — that is
  // an accepted trade-off for the flexibility of per-form delegation.
  if (!canUseSurveyForm(user, form, 'update')) {
    logger.warn(
      `[survey-invitations bulk-send] ${user.email} attempted to send invitations for form ` +
        `${formId} without a survey-send-invitation-${form.slug} update grant.`,
    )
    return { success: false, error: 'Forbidden' }
  }

  const uniqueEmails = dedupeEmails(emails)

  if (uniqueEmails.length === 0) {
    return { success: false, error: 'No valid emails provided' }
  }

  const trimmedDeptId = departmentId?.trim() || undefined
  if (trimmedDeptId) {
    const offered = await getSurveyDepartmentOptions(payload, form)
    if (!offered.some((opt) => opt.id === trimmedDeptId)) {
      return { success: false, error: 'Selected department is not valid for this survey' }
    }
  }

  await payload.jobs.queue({
    task: 'survey-bulk-send',
    input: {
      formId,
      operatorId,
      userId,
      emails: uniqueEmails,
      resendExisting,
      ...(trimmedDeptId ? { departmentId: trimmedDeptId } : {}),
    },
  })

  return {
    success: true,
    queuedCount: uniqueEmails.length,
    formTitle: form.title,
  }
}

export interface ExistingInvitationCounts {
  invited: number
  responded: number
}

/**
 * How many of the pasted emails already have an invitation for this survey (and how many of those
 * already responded), so the send UI can say what will be skipped. Same `userId` + per-form grant
 * re-check as `sendBulkSurveyInvitations`.
 */
export async function countExistingInvitations(
  userId: string,
  formId: string,
  emails: string[],
): Promise<ExistingInvitationCounts> {
  const empty = { invited: 0, responded: 0 }
  const uniqueEmails = Array.isArray(emails) ? dedupeEmails(emails) : []
  if (!userId || !formId || uniqueEmails.length === 0) return empty

  const payload = await getPayload({ config })

  const user = (await payload
    .findByID({ collection: 'users', id: userId, depth: 1, overrideAccess: true })
    .catch(() => null)) as User | null
  const form = (await payload
    .findByID({ collection: 'forms', id: formId, depth: 0, overrideAccess: true })
    .catch(() => null)) as Form | null

  if (!user || !form || !canUseSurveyForm(user, form, 'read')) return empty

  const existing = await payload.find({
    collection: 'survey-invitations',
    where: {
      and: [{ form: { equals: formId } }, { email: { in: uniqueEmails } }],
    },
    pagination: false,
    depth: 0,
    select: { email: true, status: true },
    overrideAccess: true,
  })

  // Several rows per email can exist from before dedupe; count each email once, `responded` wins.
  const statusByEmail = new Map<string, string>()
  for (const doc of existing.docs) {
    if (statusByEmail.get(doc.email) !== 'responded') {
      statusByEmail.set(doc.email, doc.status ?? 'pending')
    }
  }

  const statuses = [...statusByEmail.values()]
  return {
    invited: statuses.length,
    responded: statuses.filter((status) => status === 'responded').length,
  }
}
