import { FormSubmission, User } from '@/payload-types'

export interface WorkflowStateV1 {
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
  additionalReviewerEntry: any | null
  effectiveTokenValid: boolean
  authorizedEmail: string | undefined
  tokenOwnerCapabilities:
    | { canApprove?: boolean; canReject?: boolean; canAcknowledge?: boolean }
    | undefined
}

export function getWorkflowStateV1(
  doc: FormSubmission,
  token: string | undefined,
  user: User | null,
): WorkflowStateV1 {
  // V1: all workflow data lives inline on the form-submission document
  const reviews: any[] = doc.workflow_reviews || []
  const currentStepSlug: string = doc._workflow_status || ''
  const workflowStatus: string = doc.workflow_status || ''

  const activeReview = reviews.find((r: any) => r.status_slug === currentStepSlug) ?? null
  const isReviewer = !!(user && activeReview?.reviewer && activeReview.reviewer === user.email)

  const creator = (doc as any).created_by
  const creatorId = typeof creator === 'object' ? creator?.id : creator
  const isCreator = !!user && !!creatorId && String(user.id) === String(creatorId)

  const isTokenValid =
    !!token && reviews.some((r: any) => r.status_slug === currentStepSlug && r.token === token)

  const additionalReviewerEntry =
    !isTokenValid && token
      ? (() => {
          for (const r of reviews as any[]) {
            if (r.status_slug !== currentStepSlug) continue
            const additionalTokens: any[] = r.additional_reviewer_tokens || []
            const found = additionalTokens.find((t: any) => t.token === token)
            if (found) return found
          }
          return null
        })()
      : null

  const effectiveTokenValid = isTokenValid || !!additionalReviewerEntry

  const authorizedEmail: string | undefined = isTokenValid
    ? activeReview?.reviewer
    : additionalReviewerEntry
      ? additionalReviewerEntry.email
      : isReviewer
        ? user?.email
        : undefined

  const tokenOwnerCapabilities = additionalReviewerEntry
    ? {
        canApprove: !!additionalReviewerEntry.can_approve,
        canReject: !!additionalReviewerEntry.can_reject,
        canAcknowledge: !!additionalReviewerEntry.can_acknowledge,
      }
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
    additionalReviewerEntry,
    effectiveTokenValid,
    authorizedEmail,
    tokenOwnerCapabilities,
  }
}
