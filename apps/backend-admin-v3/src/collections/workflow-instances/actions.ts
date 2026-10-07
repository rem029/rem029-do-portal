'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { sendCurrentStepNotifications } from '@/utilities/workflow-notification'
import { WorkflowInstance } from '@/payload-types'

export async function reassignReviewerAction(instanceId: string, newReviewerEmail: string) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !(user as any).super_user) throw new Error('Unauthorized')

  const instance = await payload.findByID({
    collection: 'workflow-instances',
    id: instanceId,
    depth: 0,
    overrideAccess: true,
  })

  if (instance.status === 'completed' || instance.status === 'rejected') {
    throw new Error('Workflow is already completed or rejected')
  }

  const reviews = [...(instance.reviews || [])]
  const pendingIndex = reviews.findIndex(
    (r) => r.status_slug === instance.current_step && r.response === 'pending',
  )
  if (pendingIndex === -1) throw new Error('No pending review found for current step')

  const review = reviews[pendingIndex] as any
  const reviewerTokens = [
    ...((review.reviewer_tokens as Array<{ email: string; token: string; response: string }>) || []),
  ]
  if (!reviewerTokens[0]) throw new Error('No approver found for current step')

  reviewerTokens[0] = { ...reviewerTokens[0], email: newReviewerEmail }
  reviews[pendingIndex] = { ...review, reviewer_tokens: reviewerTokens }

  await payload.update({
    collection: 'workflow-instances',
    id: instanceId,
    data: { reviews } as Partial<WorkflowInstance>,
    overrideAccess: true,
  })

  const { sent } = await sendCurrentStepNotifications({
    payload,
    req: { payload, user } as any,
    instance: { ...instance, reviews } as WorkflowInstance,
  })

  return { success: true, sent }
}

export async function retryNotificationsAction(instanceId: string) {
  const payload = await getPayload({ config })

  // Resolve user session in Server Actions
  const { user } = await payload.auth({
    headers: await headers(),
  })

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Fetch the instance
  const instance = await payload.findByID({
    collection: 'workflow-instances',
    id: instanceId,
    depth: 0,
    overrideAccess: true,
  })

  if (instance.status === 'completed' || instance.status === 'rejected') {
    throw new Error('Workflow is already completed or rejected')
  }

  const { sent, errors } = await sendCurrentStepNotifications({
    payload,
    req: { payload, user } as any, // Cast mock request for utilities expecting a request object
    instance,
  })

  if (sent === 0 && errors.length === 0) {
    throw new Error('No pending reviewers found for the current step')
  }

  return { success: true, sent, errors }
}
