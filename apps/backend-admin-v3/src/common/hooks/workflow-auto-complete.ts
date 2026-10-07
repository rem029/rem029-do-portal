import { User } from '@/payload-types'
import { CollectionBeforeChangeHook } from 'payload'

export const workflowShouldAutoComplete: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const p = req.payload
  const u = req.user as User
  const logger = p.logger
  logger.info(`workflowShouldAutoComplete hook start ${data?.id}`)
  // Resolve the current status (from update or existing doc)
  const currentStatus = data._workflow_status || originalDoc?._workflow_status
  // Only proceed if workflow is active and not in a terminal state
  if (
    currentStatus &&
    currentStatus !== 'draft' &&
    currentStatus !== 'completed' &&
    currentStatus !== 'rejected'
  ) {
    // Resolve reviews array (from update or existing doc)
    const reviews =
      data.workflow_reviews ||
      (originalDoc?.workflow_reviews ? [...originalDoc.workflow_reviews] : [])

    if (!reviews || !Array.isArray(reviews)) return data

    // Find the active review step
    const currentIndex = reviews.findIndex((r) => r.status_slug === currentStatus)

    if (currentIndex === -1) return data

    const currentReview = reviews[currentIndex]
    let isReviewModified = false

    // Check if current step is auto_complete and not yet responded
    if (currentReview.auto_complete && currentReview.response === 'pending') {
      currentReview.response = 'auto_completed'
      currentReview.comments = 'Automatically completed as per step configuration.'
      currentReview.reviewed_at = new Date().toISOString()
      currentReview.reviewed_by = 'System (Auto-Complete)'
      isReviewModified = true

      // Advance Workflow Status
      let nextIndex = currentIndex + 1

      // Check for subsequent auto_complete steps
      while (nextIndex < reviews.length) {
        const nextReview = reviews[nextIndex]

        if (nextReview.auto_complete) {
          nextReview.response = 'auto_completed'
          nextReview.comments = 'Automatically completed as per step configuration.'
          nextReview.reviewed_at = new Date().toISOString()
          nextReview.reviewed_by = 'System (Auto-Complete)'
          nextIndex++
          isReviewModified = true
        } else {
          break
        }
      }

      if (nextIndex < reviews.length) {
        // Move to next step
        data._workflow_status = reviews[nextIndex].status_slug
        data.workflow_status = 'in_review'
        logger.info(`[workflowShouldAutoComplete] Advanced to: ${data.workflow_status}`)
      } else {
        // No more steps, complete
        data._workflow_status = 'completed'
        data.workflow_status = 'completed'
        logger.info(`[workflowShouldAutoComplete] Completed`)
      }
    }

    // Ensure modified reviews are saved back to data
    if (isReviewModified) {
      data.workflow_reviews = reviews
    }
  } else {
    logger.info(`workflowShouldAutoComplete skipped ${data?.id}`)
  }

  logger.info(`workflowShouldAutoComplete hook end ${data?.id}`)
  return data
}
