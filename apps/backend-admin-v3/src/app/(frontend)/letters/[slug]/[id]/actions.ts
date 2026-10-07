'use server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { User, WorkflowReviews } from '@/payload-types'
import { evaluateSkipCondition } from '@/common/hooks/workflow-update'

interface WorkflowActionParams {
  slug: string
  id: string
  token: string
  response: 'approved' | 'rejected' | 'acknowledged' | 'skipped' | 'auto_completed'
  comments: string
  signature: string
  attachments?: string[]
  customFieldResponses?: Array<{ name: string; label: string; value: string }>
}

export async function processWorkflowAction({
  slug,
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
    // 1. Fetch the document
    const doc = await payload.findByID({
      collection: slug as any,
      id,
      overrideAccess: true,
    })

    if (!doc) {
      throw new Error('Document not found')
    }

    // 2. Find the review step associated with the token
    const reviews = doc.workflow_reviews || []

    // First check main reviewer token
    let reviewIndex = reviews.findIndex((r: any) => r.token === token)
    let isAdditionalReviewer = false
    let additionalReviewerEmail: string | null = null

    // If not found as main token, check additional_reviewer_tokens
    if (reviewIndex === -1) {
      for (let i = 0; i < reviews.length; i++) {
        const additionalTokens: any[] = (reviews[i] as any).additional_reviewer_tokens || []
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

    // 3. Validate that it's the current step
    if (doc._workflow_status !== review.status_slug) {
      throw new Error('This workflow step is no longer active.')
    }

    // 4. Update the review step
    const updatedReviews = [...reviews]

    if (isAdditionalReviewer && additionalReviewerEmail) {
      // Update the additional reviewer token entry and also set main review response
      const additionalTokens: any[] = [...((review as any).additional_reviewer_tokens || [])]
      const tokenIndex = additionalTokens.findIndex((t: any) => t.token === token)
      if (tokenIndex !== -1) {
        additionalTokens[tokenIndex] = {
          ...additionalTokens[tokenIndex],
          response,
          reviewed_by: additionalReviewerEmail,
          reviewed_at: new Date().toISOString(),
          comments,
          token: null, // Clear token after use
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
        token: null, // Clear main token as well
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
        reviewed_by: review.reviewer, // Use the assigned reviewer email
        token: null, // Clear token after use
        custom_field_responses: customFieldResponses || [],
      }
    }

    // 5. Compute new workflow status (advancing or completing), auto-skipping steps
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

    // 6. Update the document
    // We use the local API to bypass access control since we validated via token
    // Map attachments to IDs if they are objects
    const attachmentsData =
      typeof doc?.attachments === 'object' && doc?.attachments !== null
        ? (doc?.attachments as any).id
        : doc?.attachments || null

    await payload.update({
      collection: slug as any,
      id,
      data: {
        id,
        attachments: attachmentsData,
        workflow_reviews: updatedReviews,
        workflow_status: nextWorkflowStatus,
        _workflow_status: nextStepSlug,
      },
      overrideAccess: true,
    })

    revalidatePath(`/letters/${slug}/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Workflow action failed:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadAttachmentAction(
  slug: string,
  id: string,
  token: string,
  formData: FormData,
) {
  const payload = await getPayload({ config: configPromise })

  try {
    // 1. Fetch the document
    const doc = await payload.findByID({
      collection: slug as any,
      id,
      overrideAccess: true,
    })

    if (!doc) throw new Error('Document not found')

    // 2. Validate token (main or additional reviewer) and resolve user email
    const reviews = doc.workflow_reviews || []
    const activeReview = reviews.find(
      (r: any) =>
        (r.token === token && r.status_slug === doc._workflow_status) ||
        (r.status_slug === doc._workflow_status &&
          ((r.additional_reviewer_tokens as any[]) || []).some((t: any) => t.token === token)),
    )

    if (!activeReview) throw new Error('Invalid or expired token')

    // Resolve the email of the person performing the action
    let reviewerEmail = activeReview.reviewer
    if (activeReview.token !== token) {
      const additionalToken = ((activeReview.additional_reviewer_tokens as any[]) || []).find(
        (t: any) => t.token === token,
      )
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

    const user = users.docs[0] as User

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
