'use server'

import { getPayload, createLocalReq, PayloadRequest, Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { Form, SurveyInvitation } from '@/payload-types'
import { normalizeSurveyCode } from '@/utilities/survey-code'
import { signSurveyToken, verifySurveyToken } from '@/utilities/survey-token'
import { getClientIp } from '@/utilities/get-ip'
import {
  SURVEY_DEPARTMENT_FIELD_NAME,
  findSurveyDepartmentBlock,
  getSurveyDepartmentOptions,
  isSurveyDepartmentSubmissionValid,
  toId,
} from '@/utilities/survey-department'

// One generic message for every rejection reason in `validateSurveyCodeAction` — wrong code,
// wrong form, already-responded invitation, an inactive/out-of-window form, or the throttle
// below kicking in all look identical to the caller. Do not let any branch below return a more
// specific message; that would let a client enumerate which check failed (and throttling itself
// must be indistinguishable from "invalid code", or an attacker learns when they've been
// rate-limited).
const GENERIC_CODE_ERROR = 'Invalid or expired code.'

// --- Finding 1 fix: in-memory throttle on the code gate -------------------------------------
// An invitation code is `<random 6 from a 31-char alphabet>-<fixed 2-char survey code>` — only
// the prefix is guessable, so ~31^6 ≈ 887M combinations per form. Not trivially brute-forceable,
// but the throttle still matters: it caps automated guessing and enumeration attempts. Keyed on
// (client IP, formId) since the same code space is only ever validated together with a form id.
//
// This is a module-scope `Map`, so it resets on process restart and does NOT share state across
// multiple app instances behind a load balancer. Confirmed this app runs single-instance PM2
// (`pm2 start "yarn start"`, no `-i`/cluster flag — see `apps/backend-admin-v3/package.json`
// `start:pm2`), so that limitation doesn't apply here. A DB/Redis-backed limiter would be needed
// if that ever changes; out of scope for this fix.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10 // failed attempts per (ip, formId) pair per window

const codeAttemptCounters = new Map<string, { count: number; windowStart: number }>()

function isCodeAttemptThrottled(key: string): boolean {
  const entry = codeAttemptCounters.get(key)
  if (!entry) return false

  if (Date.now() - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Window expired — drop the stale entry now so the map doesn't hold it forever; the next
    // failed attempt (if any) starts a fresh window via recordFailedCodeAttempt below.
    codeAttemptCounters.delete(key)
    return false
  }

  return entry.count >= RATE_LIMIT_MAX_ATTEMPTS
}

function recordFailedCodeAttempt(key: string): void {
  const now = Date.now()
  const entry = codeAttemptCounters.get(key)

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    codeAttemptCounters.set(key, { count: 1, windowStart: now })
    return
  }

  entry.count += 1
}

/** Mirrors `form-content.tsx`'s inline active-window check (see note in `validateSurveyCodeAction`
 * below) — reused here so `submitSurveyAction` (Finding 2) can re-check it at actual submission
 * time without duplicating the three-condition logic. */
function isFormWithinActiveWindow(form: Form): boolean {
  const now = new Date()
  const isActive = form.isActive !== false
  const isStarted = !form.activeFrom || new Date(form.activeFrom) <= now
  const isEnded = form.activeTo ? new Date(form.activeTo) < now : false
  return isActive && isStarted && !isEnded
}

interface ValidateSurveyCodeInput {
  code: string
  formId: string
  locale?: string
}

interface ValidateSurveyCodeResult {
  success: boolean
  form?: Form
  token?: string
  error?: string
  lockedDepartmentId?: string
}

/**
 * Server-side gate check. Never returns `form.fields`/blocks to the caller unless the code is
 * genuinely valid for this form, the invitation hasn't already been used, and the form is
 * currently within its active window — every failure path returns the same generic error.
 */
export async function validateSurveyCodeAction(
  input: ValidateSurveyCodeInput,
): Promise<ValidateSurveyCodeResult> {
  // getClientIp expects a `PayloadRequest`; next/headers' ReadonlyHeaders exposes the same
  // `.get(name)` shape getClientIp actually reads off `req.headers` — the cast is a structural
  // mismatch only (no `.ip`/`.raw`, which getClientIp already falls back past).
  const headersList = await getHeaders()
  const clientIp = getClientIp({ headers: headersList } as unknown as PayloadRequest)
  const throttleKey = `${clientIp}:${input.formId}`

  if (isCodeAttemptThrottled(throttleKey)) {
    // Server-side-only visibility (never reflected in the response — see GENERIC_CODE_ERROR note
    // above) so an operator can see brute-force attempts in logs.
    console.warn(`[survey code gate] Throttled repeated attempts for ${throttleKey}.`)
    return { success: false, error: GENERIC_CODE_ERROR }
  }

  try {
    const normalizedCode = normalizeSurveyCode(input.code)
    if (!normalizedCode) {
      recordFailedCodeAttempt(throttleKey)
      return { success: false, error: GENERIC_CODE_ERROR }
    }

    const payload = await getPayload({ config: configPromise })

    const invitations = await payload.find({
      collection: 'survey-invitations',
      where: {
        and: [
          { code: { equals: normalizedCode } },
          { form: { equals: input.formId } },
          { status: { in: ['pending', 'sent'] } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const invitation = invitations.docs[0]
    if (!invitation) {
      recordFailedCodeAttempt(throttleKey)
      return { success: false, error: GENERIC_CODE_ERROR }
    }

    // Mirrors `form-content.tsx`'s inline active-window check (there is no shared util for it —
    // see Task 6 investigation notes) — same three conditions, same "reject if any fail" logic,
    // now shared with `submitSurveyAction`'s re-check (Finding 2) via `isFormWithinActiveWindow`.
    const locale = input.locale === 'ar' ? 'ar' : input.locale === 'en' ? 'en' : undefined
    const form = (await payload.findByID({
      collection: 'forms',
      id: input.formId,
      locale,
      overrideAccess: true,
    })) as Form | null

    if (!form || !form.is_survey) {
      recordFailedCodeAttempt(throttleKey)
      return { success: false, error: GENERIC_CODE_ERROR }
    }

    if (!isFormWithinActiveWindow(form)) {
      recordFailedCodeAttempt(throttleKey)
      return { success: false, error: GENERIC_CODE_ERROR }
    }

    // A stale tag (no longer offered by the form) falls back to a free choice.
    let lockedDepartmentId: string | undefined
    const deptId = toId(invitation.department)

    if (deptId && findSurveyDepartmentBlock(form)) {
      const offered = await getSurveyDepartmentOptions(payload, form)
      if (offered.some((opt) => opt.id === deptId)) {
        lockedDepartmentId = deptId
      }
    }

    return {
      success: true,
      form,
      token: signSurveyToken(invitation.id),
      lockedDepartmentId,
    }
  } catch (error) {
    console.error('Error validating survey code:', error)
    recordFailedCodeAttempt(throttleKey)
    return { success: false, error: GENERIC_CODE_ERROR }
  }
}

interface SubmitSurveyInput {
  token: string
  submissionData: Array<{ field: string; value: string }>
}

/**
 * Machine-readable outcome for the caller to branch on without string-matching `error`:
 * - `token_expired` — the HMAC token died; the invitation code itself is still usable, so a
 *   fresh validation recovers.
 * - `already_submitted` — the code has been spent; it will never work again.
 * - `survey_closed` — the form left its active window; the code is now inert.
 * Absent on success and on transient/unexpected failures (which the caller must NOT treat as
 * terminal — e.g. it must not discard a remembered code over a passing DB blip).
 */
type SubmitSurveyReason = 'token_expired' | 'already_submitted' | 'survey_closed'

interface SubmitSurveyResult {
  success: boolean
  data?: unknown
  error?: string
  reason?: SubmitSurveyReason
}

// Structural shape of the one row `RETURNING` gives back from the atomic claim below — not the
// full generated `SurveyInvitation` type, just the three columns this action actually reads.
interface ClaimedInvitationRow {
  id: string
  formId: string
  code: string
}

// `payload.db` is typed generically as `DatabaseAdapter`, which doesn't know about the
// postgres-specific `.drizzle` handle — this project's adapter is always `@payloadcms/db-postgres`
// (see `payload.config.ts`), so the cast is a structural mismatch, not a real type escape.
interface DrizzleCapablePayloadDb {
  drizzle: {
    execute: (query: unknown) => Promise<{ rows: Array<Record<string, unknown>> }>
  }
}

/**
 * Submits a survey response. `token` must be a live `signSurveyToken` output (proof the visitor
 * already cleared `validateSurveyCodeAction`); the actual "has this code been used" decision is
 * made entirely by the atomic claim below, not by the token.
 *
 * Why raw SQL for the claim: Payload's local-API `update({ where })` finds matching docs with a
 * plain `SELECT ... WHERE status != 'responded'`, then updates each match with a plain
 * `UPDATE ... WHERE id = $1` that does NOT repeat the status condition (see
 * `payload/dist/collections/operations/update.js`). Two calls that both start before either
 * commits can both pass the SELECT, and neither UPDATE re-checks status — both would "win". A
 * single `UPDATE survey_invitations SET status = 'responded' WHERE id = $1 AND status !=
 * 'responded'` statement doesn't have that gap: Postgres evaluates the WHERE clause as part of
 * the same statement that takes the row lock, so a second writer that was blocked behind the
 * first re-checks status against the now-committed row and matches zero rows. Only one caller
 * can ever receive a row back from this statement for a given invitation.
 */
// One generic message for every unexpected failure in `submitSurveyAction` — this is the most
// exposed anonymous endpoint in the app, so the real error (whatever it is: a DB driver error, a
// validation failure inside `form-submissions`' own hooks, anything) is logged server-side only
// and never handed back to the caller verbatim.
const GENERIC_SUBMIT_ERROR = 'Something went wrong while submitting your survey. Please try again.'

// Finding 2: the form may have closed (isActive/activeFrom/activeTo) in the window between
// `validateSurveyCodeAction` handing out a token and the token's ~2-hour TTL expiring. This is
// its own message (not GENERIC_SUBMIT_ERROR) — it's not a secrecy-sensitive branch like the code
// gate, just an honest "this closed" reason for the respondent.
const SURVEY_CLOSED_ERROR = 'This survey is no longer accepting responses.'

// Shared revert for a claimed-but-abandoned invitation — used both by Finding 2's active-window
// re-check and the pre-existing failed-create path below. `sent` is the pre-claim value for the
// normal path (an emailed, unused invitation) — see the failed-create catch below for the one
// edge case this simplifies (an invitation claimed while still `pending` reverts to `sent`
// rather than `pending`; harmless, it only affects an admin-facing status label).
async function revertInvitationClaim(payload: Payload, invitationId: string): Promise<void> {
  try {
    await payload.update({
      collection: 'survey-invitations',
      id: invitationId,
      data: { status: 'sent', responded_at: null },
      overrideAccess: true,
    })
  } catch (revertError) {
    console.error(
      `Failed to revert survey invitation ${invitationId} after a failed submission:`,
      revertError,
    )
  }
}

export async function submitSurveyAction(input: SubmitSurveyInput): Promise<SubmitSurveyResult> {
  try {
    const verified = verifySurveyToken(input.token)
    if (!verified) {
      return {
        success: false,
        error: 'Your session has expired. Please re-enter your code and try again.',
        reason: 'token_expired',
      }
    }

    const payload = await getPayload({ config: configPromise })
    const db = (payload.db as unknown as DrizzleCapablePayloadDb).drizzle

    // Best-effort snapshot of the invitation's pre-claim state, read BEFORE the atomic claim —
    // used only to make the audit-log entry below show the real `sent → responded` transition.
    // It plays no part in the actual claim decision (the raw SQL UPDATE's WHERE clause below is
    // the sole source of truth for that), so a stale or failed read here can't reopen the race;
    // worst case the audit entry's "old" side falls back to a reasonable guess (see below).
    const preClaimInvitation = await payload
      .findByID({
        collection: 'survey-invitations',
        id: verified.invitationId,
        overrideAccess: true,
        depth: 0,
      })
      .catch(() => null)

    // Department check runs before the claim, so a rejected submission never spends the code.
    const preClaimFormId = preClaimInvitation
      ? typeof preClaimInvitation.form === 'object'
        ? preClaimInvitation.form.id
        : preClaimInvitation.form
      : null
    const preClaimForm = preClaimFormId
      ? await payload
          .findByID({ collection: 'forms', id: preClaimFormId, overrideAccess: true, depth: 0 })
          .catch(() => null)
      : null

    // An invitation's (still offered) department always wins over whatever the client sent.
    const invitationDeptId = toId(preClaimInvitation?.department)
    const finalSubmissionData = [...input.submissionData]
    if (preClaimForm && invitationDeptId) {
      const offered = await getSurveyDepartmentOptions(payload, preClaimForm)
      if (offered.some((opt) => opt.id === invitationDeptId)) {
        const existingIndex = finalSubmissionData.findIndex(
          (item) => item.field === SURVEY_DEPARTMENT_FIELD_NAME,
        )
        if (existingIndex >= 0) {
          finalSubmissionData[existingIndex] = {
            ...finalSubmissionData[existingIndex],
            value: invitationDeptId,
          }
        } else {
          finalSubmissionData.push({
            field: SURVEY_DEPARTMENT_FIELD_NAME,
            value: invitationDeptId,
          })
        }
      }
    }

    if (!preClaimForm || !(await isSurveyDepartmentSubmissionValid(payload, preClaimForm, finalSubmissionData))) {
      return { success: false, error: GENERIC_SUBMIT_ERROR }
    }

    const claimResult = await db.execute(sql`
      UPDATE survey_invitations
      SET status = 'responded', responded_at = now(), updated_at = now()
      WHERE id = ${verified.invitationId} AND status != 'responded'
      RETURNING id, form_id AS "formId", code
    `)

    const claimedRow = claimResult.rows[0] as unknown as ClaimedInvitationRow | undefined
    if (!claimedRow) {
      return {
        success: false,
        error: 'This survey has already been submitted.',
        reason: 'already_submitted',
      }
    }

    // The raw SQL statement above already made the claim safe and final — nothing below this
    // point can lose or reopen that race. Record the transition in the audit log directly
    // (rather than via a mirror `payload.update`) because by the time any Payload-level read
    // could run, the row is already `responded`: a mirror update's own before/after diff would
    // show a no-op `responded → responded`, not the real `sent → responded` transition.
    try {
      const updatedInvitation = await payload.findByID({
        collection: 'survey-invitations',
        id: claimedRow.id,
        overrideAccess: true,
        depth: 0,
      })

      // Fallback old-state when the pre-claim read above failed or raced: matches the same
      // `sent` assumption the failed-submission revert path below already documents.
      const previousDoc: SurveyInvitation =
        preClaimInvitation ?? { ...updatedInvitation, status: 'sent', responded_at: null }

      await payload.create({
        collection: 'audit-logs',
        data: {
          collectionSlug: 'survey-invitations',
          type: 'collection',
          entityId: claimedRow.id,
          operation: 'update',
          data: {
            new: updatedInvitation,
            old: previousDoc,
          },
        },
        overrideAccess: true,
      })
    } catch (auditError) {
      console.error(
        `Claimed survey invitation ${claimedRow.id} but failed to write its audit-log entry:`,
        auditError,
      )
    }

    // Finding 2: re-check the form's active window at actual submission time, not just at gate
    // validation. A brute-forced or simply slow-to-submit token could otherwise be used up to its
    // ~2-hour TTL after the survey was deliberately closed. This runs after the atomic claim (so
    // it shares the same claimed/reverted plumbing as the failed-create path below) — the claim
    // is reverted before rejecting so a closed-survey attempt doesn't burn the code.
    const form = (await payload
      .findByID({
        collection: 'forms',
        id: claimedRow.formId,
        overrideAccess: true,
        depth: 0,
      })
      .catch(() => null)) as Form | null

    if (!form || !isFormWithinActiveWindow(form)) {
      await revertInvitationClaim(payload, claimedRow.id)
      return { success: false, error: SURVEY_CLOSED_ERROR, reason: 'survey_closed' }
    }

    // No `user` key at all — this is what keeps the resulting submission's `created_by` null.
    const req = await createLocalReq({}, payload)

    try {
      const submission = await payload.create({
        collection: 'form-submissions',
        data: {
          form: claimedRow.formId,
          submissionData: finalSubmissionData,
          survey_code: claimedRow.code,
        },
        overrideAccess: true,
        req,
      })

      return { success: true, data: submission }
    } catch (createError) {
      // Revert the claim so a failed submission doesn't permanently lock out a legitimate
      // retry. This update's own before/after diff IS accurate (a real `responded → sent`
      // transition happening entirely within this call), so no special audit handling is needed
      // here.
      await revertInvitationClaim(payload, claimedRow.id)
      throw createError
    }
  } catch (error) {
    console.error('Error submitting survey:', error)
    return { success: false, error: GENERIC_SUBMIT_ERROR }
  }
}
