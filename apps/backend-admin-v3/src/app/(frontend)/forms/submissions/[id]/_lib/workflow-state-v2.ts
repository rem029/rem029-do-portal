import { FormSubmission, User, WorkflowInstance } from '@/payload-types'

export interface WorkflowStateV2 {
  reviews: any[]
  currentStepSlug: string
  workflowStatus: string
  activeReview: any | null
  isReviewer: boolean
  isCreator: boolean
  canResubmit: boolean
  isRejectedNotCreator: boolean
  isRejectedNotLoggedIn: boolean
  isTokenValid: boolean
  /** Token is valid but the step is already responded, or it is a notification view token. View allowed, action blocked. */
  isReadOnlyToken: boolean
  effectiveTokenValid: boolean
  authorizedEmail: string | undefined
}

export function getWorkflowStateV2(
  instance: WorkflowInstance,
  doc: FormSubmission,
  token: string | undefined,
  user: User | null,
): WorkflowStateV2 {
  const reviews: any[] = instance.reviews || []
  const currentStepSlug: string = instance.current_step || ''
  const workflowStatus: string = instance.status

  const activeReview = reviews.find((r: any) => r.status_slug === currentStepSlug) ?? null

  // Capabilities, before/after-response field blocks, etc. are step-level now —
  // shared uniformly by every approver on `activeReview.reviewer_tokens[]`. There
  // is no more primary-vs-additional distinction, so `isReviewer` just checks
  // whether the logged-in user's email matches ANY approver entry on the active step.
  const isReviewer = !!(
    user &&
    activeReview &&
    ((activeReview.reviewer_tokens as Array<{ email: string }>) || []).some(
      (t) => t.email === user.email,
    )
  )

  const creator = doc.created_by
  const creatorId = typeof creator === 'object' ? creator?.id : creator
  const isCreator = !!user && !!creatorId && String(user.id) === String(creatorId)

  // ── Token resolution — one scan over every review's reviewer_tokens[] ──────
  // No more primary-token-field vs additional-array-check split: every approver
  // is a peer entry in the same array, on every review (current or past).
  let matchedReview: any = null
  let matchedTokenEntry: { email: string; token: string; response: string } | null = null

  if (token) {
    for (const r of reviews) {
      const tokens =
        (r.reviewer_tokens as Array<{ email: string; token: string; response: string }>) || []
      const found = tokens.find((t) => t.token === token)
      if (found) {
        matchedReview = r
        matchedTokenEntry = found
        break
      }
    }
  }

  // Active token: matched entry is on the current step and hasn't responded yet.
  const isTokenValid =
    !!matchedReview &&
    !!matchedTokenEntry &&
    matchedReview.status_slug === currentStepSlug &&
    matchedTokenEntry.response === 'pending'

  // Reviewer read-only: token matched but this specific approver already responded,
  // or it belongs to a past step.
  const isReviewerReadOnlyToken = !!matchedReview && !isTokenValid

  // Notification read-only: token is in the instance's notification_tokens list
  const notificationTokens: Array<{ email: string; token: string }> | null | undefined =
    (instance as unknown as { notification_tokens?: Array<{ email: string; token: string }> | null })
      .notification_tokens
  const isNotificationToken =
    !!token && !!(notificationTokens || []).find((t) => t.token === token)

  const isReadOnlyToken = isReviewerReadOnlyToken || isNotificationToken

  const effectiveTokenValid = isTokenValid || isReadOnlyToken

  // Resolve the display email for "Reviewing as" banner
  const readOnlyEmail: string | undefined = isReviewerReadOnlyToken
    ? matchedTokenEntry?.email
    : isNotificationToken
      ? (notificationTokens || []).find((t) => t.token === token)?.email
      : undefined

  const authorizedEmail: string | undefined = isTokenValid
    ? matchedTokenEntry?.email
    : isReadOnlyToken
      ? readOnlyEmail
      : isReviewer
        ? user?.email
        : undefined

  const canResubmit = isCreator && workflowStatus === 'rejected'
  const isRejectedNotCreator = !!user && !isCreator && workflowStatus === 'rejected'
  const isRejectedNotLoggedIn = !user && workflowStatus === 'rejected'

  return {
    reviews,
    currentStepSlug,
    workflowStatus,
    activeReview,
    isReviewer,
    isCreator,
    canResubmit,
    isRejectedNotCreator,
    isRejectedNotLoggedIn,
    isTokenValid,
    isReadOnlyToken,
    effectiveTokenValid,
    authorizedEmail,
  }
}
