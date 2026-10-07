import type { TripSchedulingStaffVoice } from '@/payload-types'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'

type ReviewLinkDoc = Pick<TripSchedulingStaffVoice, 'approvalToken' | 'tokenExpiration'>

// A review link is valid only if the token matches (compared in constant time) and has not expired.
// One boolean on purpose: callers show a single generic message so failures don't reveal which check failed.
export function isReviewLinkValid(doc: ReviewLinkDoc, token: string | undefined): boolean {
  if (!doc.tokenExpiration || !isTokenMatch(doc.approvalToken, token)) return false

  return new Date(doc.tokenExpiration).getTime() > Date.now()
}
