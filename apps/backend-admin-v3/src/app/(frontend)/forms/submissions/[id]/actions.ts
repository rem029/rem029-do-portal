'use server'

import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { FormSubmission, WorkflowInstance } from '@/payload-types'
import { evaluateSkipCondition } from '@/common/hooks/workflow-update'
import { sendCurrentStepNotifications } from '@/utilities/workflow-notification'
import { v4 as uuidv4 } from 'uuid'
import { makeEvent } from '@/utilities/workflow-event-log'

export type UserResult = {
  id: string
  email: string
  full_name?: string | null
  department?: string | null
  designation?: string | null
}

/** Returns true if the token belongs to any approver on the active current step. */
function isValidReviewerToken(instance: WorkflowInstance, token: string): boolean {
  const reviews = instance.reviews || []
  return reviews.some((r) => {
    if (r.status_slug !== instance.current_step) return false
    const tokens = (r.reviewer_tokens as Array<{ token: string }>) || []
    return tokens.some((t) => t.token === token)
  })
}

export async function searchUsersForReassign(
  query: string,
  opts?: { instanceId?: string; token?: string },
): Promise<UserResult[]> {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const isSuperUser = !!(user && (user as any).super_user)

  if (!isSuperUser) {
    if (!opts?.instanceId || !opts?.token) throw new Error('Unauthorized')
    const instance = await payload.findByID({
      collection: 'workflow-instances',
      id: opts.instanceId,
      depth: 0,
      overrideAccess: true,
    })
    if (!isValidReviewerToken(instance as WorkflowInstance, opts.token))
      throw new Error('Unauthorized')
  }

  const result = await payload.find({
    collection: 'users',
    where: {
      or: [{ email: { contains: query } }, { full_name: { contains: query } }],
    },
    limit: 10,
    depth: 1,
    overrideAccess: true,
  })

  return result.docs.map((u) => {
    const dept = (u as any).department
    const deptName = dept && typeof dept === 'object' ? (dept.name as string) : null
    return {
      id: u.id as string,
      email: u.email,
      full_name: (u as any).full_name as string | null | undefined,
      designation: u.designation,
      department: deptName,
    }
  })
}

export async function reassignInstanceReviewerAction(
  instanceId: string,
  submissionId: string,
  newReviewerEmail: string,
  token?: string,
) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const isSuperUser = !!(user && (user as any).super_user)
  const instance = await payload.findByID({
    collection: 'workflow-instances',
    id: instanceId,
    depth: 0,
    overrideAccess: true,
  })

  if (!isSuperUser) {
    if (!token || !isValidReviewerToken(instance as WorkflowInstance, token)) {
      throw new Error('Unauthorized')
    }
  }

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

  // Reassign the entry matching the acting token; if acting as super-user with no
  // token, default to the first approver entry (matches today's single-reassign UX).
  const tokenIndex = token ? reviewerTokens.findIndex((t) => t.token === token) : 0
  if (tokenIndex === -1 || !reviewerTokens[tokenIndex]) {
    throw new Error('No matching approver entry found to reassign')
  }

  const oldEntry = reviewerTokens[tokenIndex]
  const oldToken = oldEntry.token
  const oldReviewerEmail = oldEntry.email

  // Rotate token so the old link becomes read-only
  const newToken = uuidv4()
  reviewerTokens[tokenIndex] = { ...oldEntry, email: newReviewerEmail, token: newToken }
  reviews[pendingIndex] = { ...review, reviewer_tokens: reviewerTokens }

  // Archive old token as a read-only notification token so the original reviewer can still view
  const existingNotificationTokens = Array.isArray(instance.notification_tokens)
    ? (instance.notification_tokens as Array<{ email: string; token: string }>)
    : []
  const notificationTokens = oldToken && oldReviewerEmail
    ? [...existingNotificationTokens, { email: oldReviewerEmail, token: oldToken }]
    : existingNotificationTokens

  const reassignEvent = makeEvent(
    'reassigned',
    user?.email || 'system',
    review.status_slug,
    review.label,
    { from: oldReviewerEmail, to: newReviewerEmail },
  )
  const updatedInstance = { ...instance, reviews, notification_tokens: notificationTokens } as WorkflowInstance

  await payload.update({
    collection: 'workflow-instances',
    id: instanceId,
    data: {
      reviews,
      notification_tokens: notificationTokens,
      event_logs: [...(instance.event_logs ?? []), reassignEvent] as WorkflowInstance['event_logs'],
    } as Partial<WorkflowInstance>,
    overrideAccess: true,
    context: { appendingEventLog: true } as any,
  })

  await sendCurrentStepNotifications({
    payload,
    req: { payload, user } as any,
    instance: updatedInstance,
  })

  revalidatePath(`/forms/submissions/${submissionId}`)
  return { success: true }
}

const SLUG = 'form-submissions'

interface WorkflowActionParams {
  id: string
  token: string
  response: 'approved' | 'rejected' | 'acknowledged' | 'skipped' | 'auto_completed'
  comments: string
  signature: string
  attachments?: string[]
  customFieldResponses?: Array<{ name: string; label: string; value: string }>
}

export async function processWorkflowAction({
  id,
  token,
  response,
  comments,
  signature,
  attachments,
  customFieldResponses,
}: WorkflowActionParams) {
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = (await payload.findByID({
      collection: SLUG,
      id,
      overrideAccess: true,
    })) as FormSubmission

    if (!doc) {
      throw new Error('Document not found')
    }

    const reviews = doc.workflow_reviews || []

    // Check main reviewer token first
    let reviewIndex = reviews.findIndex((r: any) => r.token === token)
    let isAdditionalReviewer = false
    let additionalReviewerEmail: string | null = null

    // If not found as main token, check additional_reviewer_tokens
    if (reviewIndex === -1) {
      for (let i = 0; i < reviews.length; i++) {
        const additionalTokens: any[] =
          ((reviews[i] as any).additional_reviewer_tokens as any[]) || []
        const found = additionalTokens.find((t: any) => t.token === token)
        if (found) {
          reviewIndex = i
          isAdditionalReviewer = true
          additionalReviewerEmail = found.email
          break
        }
      }
    }

    if (reviewIndex === -1) {
      throw new Error('Invalid or expired token')
    }

    const review = reviews[reviewIndex]

    if (doc._workflow_status !== review.status_slug) {
      throw new Error('This workflow step is no longer active.')
    }

    const updatedReviews = [...reviews]

    if (isAdditionalReviewer && additionalReviewerEmail) {
      // Update the additional reviewer token entry and set main review response
      const additionalTokens: any[] = [
        ...(((review as any).additional_reviewer_tokens as any[]) || []),
      ]
      const tokenIndex = additionalTokens.findIndex((t: any) => t.token === token)
      if (tokenIndex !== -1) {
        additionalTokens[tokenIndex] = {
          ...additionalTokens[tokenIndex],
          response,
          reviewed_by: additionalReviewerEmail,
          reviewed_at: new Date().toISOString(),
          comments,
          token: null,
        }
      }

      updatedReviews[reviewIndex] = {
        ...review,
        response,
        comments,
        signature,
        attachments: attachments || [],
        reviewed_at: new Date().toISOString(),
        reviewed_by: additionalReviewerEmail,
        token: null,
        additional_reviewer_tokens: additionalTokens,
        custom_field_responses: customFieldResponses || [],
      } as any
    } else {
      updatedReviews[reviewIndex] = {
        ...review,
        response,
        comments,
        signature,
        attachments: attachments || [],
        reviewed_at: new Date().toISOString(),
        reviewed_by: review.reviewer,
        token: null,
        custom_field_responses: customFieldResponses || [],
      }
    }

    let nextWorkflowStatus = doc.workflow_status
    let nextStepSlug = doc._workflow_status

    const advancingStatuses = ['approved', 'acknowledged', 'skipped', 'auto_completed']
    if (advancingStatuses.includes(response)) {
      let nextIndex = reviewIndex + 1

      // Auto-skip steps whose skip_condition matches accumulated custom_field_responses
      while (nextIndex < updatedReviews.length) {
        if (evaluateSkipCondition(updatedReviews[nextIndex], updatedReviews, nextIndex)) {
          updatedReviews[nextIndex] = {
            ...(updatedReviews[nextIndex] as any),
            response: 'skipped',
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'system',
          }
          nextIndex++
        } else {
          break
        }
      }

      if (nextIndex < updatedReviews.length) {
        nextStepSlug = updatedReviews[nextIndex].status_slug
        nextWorkflowStatus = 'in_review'
      } else {
        nextStepSlug = 'completed'
        nextWorkflowStatus = 'completed'
      }
    } else if (response === 'rejected') {
      nextStepSlug = 'rejected'
      nextWorkflowStatus = 'rejected'
    }

    // Map attachments to IDs if they are objects
    const attachmentsData =
      typeof (doc as any)?.attachments === 'object' && (doc as any)?.attachments !== null
        ? ((doc as any)?.attachments as any).id
        : (doc as any)?.attachments || null

    await payload.update({
      collection: SLUG,
      id,
      data: {
        workflow_reviews: updatedReviews,
        workflow_status: nextWorkflowStatus,
        _workflow_status: nextStepSlug,
        attachments: attachmentsData,
      } as Partial<FormSubmission>,
      overrideAccess: true,
    })

    revalidatePath(`/forms/submissions/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Workflow action failed:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadAttachmentAction(id: string, token: string, formData: FormData) {
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = (await payload.findByID({
      collection: SLUG,
      id,
      overrideAccess: true,
    })) as FormSubmission

    if (!doc) throw new Error('Document not found')

    // 2. Validate token (main or additional reviewer) and resolve user email
    const reviews = doc.workflow_reviews || []
    const activeReview = reviews.find(
      (r: any) =>
        (r.token === token && r.status_slug === doc._workflow_status) ||
        (r.status_slug === doc._workflow_status &&
          (((r as any).additional_reviewer_tokens as any[]) || []).some(
            (t: any) => t.token === token,
          )),
    )

    if (!activeReview) throw new Error('Invalid or expired token')

    // Resolve the email of the person performing the action
    let reviewerEmail = activeReview.reviewer
    if (activeReview.token !== token) {
      const additionalToken = (
        ((activeReview as any).additional_reviewer_tokens as any[]) || []
      ).find((t: any) => t.token === token)
      reviewerEmail = additionalToken?.email
    }

    if (!reviewerEmail) throw new Error('Could not resolve reviewer email')

    // 3. Resolve user ID for the reviewer
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: reviewerEmail },
      },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    const user = users.docs[0] as any

    // 4. Upload file
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const media = await payload.create({
      collection: 'internal-media',
      data: {
        alt: file.name,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        name: file.name,
        size: file.size,
        mimetype: file.type,
      },
      user: user || undefined,
      overrideAccess: true,
    })

    return {
      success: true,
      data: {
        id: media.id,
        filename: media.filename,
        url: (media as any).url,
      },
    }
  } catch (error: any) {
    console.error('Upload failed:', error)
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow V2 actions — operate on the workflow-instances record
// ─────────────────────────────────────────────────────────────────────────────

interface WorkflowInstanceActionParams {
  instanceId: string
  submissionId: string
  /** Magic-link token. Omitted when the acting user is authenticated and matches
   * the current step's reviewer by email instead — see the fallback resolution below. */
  token?: string
  response: 'approved' | 'rejected' | 'acknowledged' | 'skipped' | 'auto_completed'
  /**
   * Flat, unified set of everything the reviewer filled in — before-phase and
   * after-phase fields combined, each tagged with the block's `blockType` for
   * downstream rendering. No before/after marker (that's purely a UI-sequencing
   * concept). Merged by `name` before writing (later entries win on collision).
   */
  fieldResponses?: Array<{ name: string; label: string; value: unknown; blockType: string }>
}

export async function processWorkflowInstanceAction({
  instanceId,
  submissionId,
  token,
  response,
  fieldResponses,
}: WorkflowInstanceActionParams) {
  const payload = await getPayload({ config: configPromise })

  try {
    const instance = await payload.findByID({
      collection: 'workflow-instances',
      id: instanceId,
      overrideAccess: true,
    })

    if (!instance) throw new Error('Workflow instance not found')

    const reviews = [...(instance.reviews || [])]

    // Resolve the review + specific approver entry by matching the token against
    // reviewer_tokens[] — no more primary/additional distinction, every approver
    // is a peer entry in the same array.
    let reviewIndex = -1
    let tokenIndex = -1
    let actingEmail: string | null = null

    if (token) {
      for (let i = 0; i < reviews.length; i++) {
        const tokens = ((reviews[i] as any).reviewer_tokens as Array<{ email: string; token: string }>) || []
        const idx = tokens.findIndex((t) => t.token === token)
        if (idx !== -1) {
          reviewIndex = i
          tokenIndex = idx
          actingEmail = tokens[idx].email
          break
        }
      }
    }

    // No token (or it didn't match) — fall back to the authenticated session's email
    // against the current step's approvers, mirroring getWorkflowStateV2's `isReviewer`
    // check so a logged-in reviewer can act without a magic-link token.
    if (reviewIndex === -1) {
      const { user } = await payload.auth({ headers: await headers() })
      const currentStepSlug = instance.current_step
      // Loop-backs can leave multiple entries sharing the same status_slug (one per
      // iteration) — match the pending one, not just the first one with that slug.
      const idx = reviews.findIndex(
        (r: any) => r.status_slug === currentStepSlug && r.response === 'pending',
      )
      if (user?.email && idx !== -1) {
        const tokens = ((reviews[idx] as any).reviewer_tokens as Array<{ email: string; token: string }>) || []
        const tIdx = tokens.findIndex((t) => t.email === user.email)
        if (tIdx !== -1) {
          reviewIndex = idx
          tokenIndex = tIdx
          actingEmail = tokens[tIdx].email
        }
      }
    }

    if (reviewIndex === -1) throw new Error('Invalid or expired token')

    const review = reviews[reviewIndex] as any

    if (instance.current_step !== review.status_slug) {
      throw new Error('This workflow step is no longer active.')
    }

    // Merge submitted fields by name — later entries win on collision (this is
    // what makes it safe to have no before/after marker on the stored data).
    const mergedResponses = new Map<
      string,
      { name: string; label: string; value: unknown; blockType: string }
    >()
    for (const r of fieldResponses || []) {
      if (r?.name) mergedResponses.set(r.name, r)
    }
    const finalFieldResponses = Array.from(mergedResponses.values())

    const reviewerTokens = [...((review.reviewer_tokens as Array<Record<string, unknown>>) || [])]
    reviewerTokens[tokenIndex] = {
      ...reviewerTokens[tokenIndex],
      response,
      reviewed_by: actingEmail,
      reviewed_at: new Date().toISOString(),
    }

    reviews[reviewIndex] = {
      ...review,
      response,
      reviewed_at: new Date().toISOString(),
      reviewed_by: actingEmail,
      reviewer_tokens: reviewerTokens,
      field_responses: finalFieldResponses,
    }

    // Updating the instance triggers workflowInstanceUpdate (beforeChange) which
    // handles required-field validation, step advancement, loop-backs, skip
    // conditions, and status transitions.
    await payload.update({
      collection: 'workflow-instances',
      id: instanceId,
      data: { reviews } as Partial<WorkflowInstance>,
      overrideAccess: true,
    })

    revalidatePath(`/forms/submissions/${submissionId}`)
    return { success: true }
  } catch (error: any) {
    console.error('[processWorkflowInstanceAction] failed:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadAttachmentInstanceAction(
  instanceId: string,
  submissionId: string,
  token: string,
  formData: FormData,
) {
  const payload = await getPayload({ config: configPromise })

  try {
    const instance = (await payload.findByID({
      collection: 'workflow-instances',
      id: instanceId,
      overrideAccess: true,
    })) as WorkflowInstance

    if (!instance) throw new Error('Workflow instance not found')

    const reviews = instance.reviews || []
    let reviewerEmail: string | null = null

    for (const r of reviews) {
      if (r.status_slug !== instance.current_step) continue
      const tokens = (r.reviewer_tokens as Array<{ email: string; token: string }>) || []
      const found = tokens.find((t) => t.token === token)
      if (found) {
        reviewerEmail = found.email
        break
      }
    }

    if (!reviewerEmail) throw new Error('Invalid or expired token')

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: reviewerEmail } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    const user = users.docs[0] as any

    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const media = await payload.create({
      collection: 'internal-media',
      data: { alt: file.name },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        name: file.name,
        size: file.size,
        mimetype: file.type,
      },
      user: user || undefined,
      overrideAccess: true,
    })

    return {
      success: true,
      data: {
        id: media.id,
        filename: media.filename,
        url: (media as any).url,
      },
    }
  } catch (error: any) {
    console.error('[uploadAttachmentInstanceAction] failed:', error)
    return { success: false, error: error.message }
  }
}
