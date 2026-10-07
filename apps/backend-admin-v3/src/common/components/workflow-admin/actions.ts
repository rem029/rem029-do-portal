'use server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Workflow, User, Department } from '@/payload-types'
import { v4 as uuidv4 } from 'uuid'

const getWorkflowSlugForCollection = async (payload: any, collectionSlug: string, doc: any) => {
  try {
    if (collectionSlug === 'form-submissions') {
      const formId = typeof doc.form === 'object' ? doc.form?.id : doc.form
      if (formId) {
        const form = await payload.findByID({
          collection: 'forms',
          id: formId,
          depth: 0,
        })
        return form?.workflow_slug || null
      }
    }

    // Attempt to find a matching settings global for the collection
    const settingsSlug = `${collectionSlug}-settings`
    const settings = await payload.findGlobal({
      slug: settingsSlug,
      depth: 0,
    })
    return settings?.workflow_slug || null
  } catch (err) {
    return null
  }
}

export async function resendWorkflowNotificationAction(
  collectionSlug: string,
  docId: string | number,
  stepSlug: string,
) {
  const payload = await getPayload({ config: configPromise })

  try {
    await payload.update({
      collection: collectionSlug as any,
      id: docId,
      data: {}, // No data change needed
      context: {
        triggerNotification: true,
        triggerStepSlug: stepSlug,
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error resending workflow notification:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadInternalMediaAction(formData: FormData) {
  const payload = await getPayload({ config: configPromise })
  try {
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

export async function syncWorkflowSettingsAction(collectionSlug: string, docId: string | number) {
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = await payload.findByID({
      collection: collectionSlug as any,
      id: docId,
    })

    if (!doc) throw new Error('Document not found')

    const workflowSlug = await getWorkflowSlugForCollection(payload, collectionSlug, doc)
    if (!workflowSlug) throw new Error(`Could not resolve workflow slug for ${collectionSlug}`)

    const workflowResult = await payload.find({
      collection: 'workflow',
      where: {
        slug: { equals: workflowSlug },
        operator: { equals: (doc as any).operator?.id || (doc as any).operator },
      },
      depth: 1,
    })

    const workflow = workflowResult.docs[0] as Workflow | undefined
    if (!workflow || !workflow.steps) throw new Error('Workflow configuration not found')

    const updatedReviews = [...((doc as any).workflow_reviews || [])]
    let modified = false

    const resolveReviewerEmail = async (step: any, doc: any) => {
      switch (step.approver_type) {
        case 'email':
          return step.approver_email || ''
        case 'department':
          if (step.department) {
            const deptId =
              typeof step.department === 'object' ? step.department.id : step.department
            const dept = await payload.findByID({
              collection: 'departments',
              id: deptId,
              depth: 0,
            })
            return (dept as Department)?.manager_email || ''
          }
          return ''
        case 'requestor_department':
          const requestorId =
            (doc as any).created_by?.id ||
            (doc as any).created_by ||
            (doc as any).user?.id ||
            (doc as any).user
          if (requestorId) {
            const requestor = await payload.findByID({
              collection: 'users',
              id: requestorId,
              depth: 1, // Need department
            })
            return (requestor as User)?.department &&
              typeof (requestor as User).department === 'object'
              ? ((requestor as User).department as Department).manager_email || ''
              : ''
          }
          return ''
        case 'employee':
          // Employee approver is usually set by a hook and is doc-specific.
          // For now, we return current reviewer to avoid breaking it if we can't resolve it.
          return null
        default:
          return ''
      }
    }

    for (const review of updatedReviews) {
      if (review.response === 'pending') {
        const step = workflow.steps?.find((s) => s.slug === review.status_slug)
        if (step) {
          // Sync basic settings
          review.enable_comment = (step as any).enable_comment
          review.enable_signature = (step as any).enable_signature
          review.attachment_label = (step as any).attachment_label
          review.can_acknowledge = (step as any).can_acknowledge
          review.can_approve = (step as any).can_approve
          review.can_reject = (step as any).can_reject
          review.can_attach = (step as any).can_attach
          review.can_skip = (step as any).can_skip
          review.can_generate_wordfile = (step as any).can_generate_wordfile
          review.acknowledge_label = (step as any).acknowledge_label
          review.approve_label = (step as any).approve_label
          review.reject_label = (step as any).reject_label
          review.skip_label = (step as any).skip_label
          review.auto_complete = (step as any).auto_complete
          review.hide_history = (step as any).hide_history
          review.hide_details = (step as any).hide_details
          review.hide_description = (step as any).hide_description
          review.hide_attachments = (step as any).hide_attachments
          review.hide_email_actions = (step as any).hide_email_actions
          review.custom_email_text = (step as any).custom_email_text

          // Sync custom fields definition
          review.custom_fields_definition = [
            ...((workflow as any).global_custom_fields || [])
              .filter((gf: any) =>
                ((step as any).selected_global_fields || []).some(
                  (sgf: any) => sgf.field_name === gf.name,
                ),
              )
              .map((gf: any) => ({ ...gf })),
            ...((step as any).custom_fields || []),
          ]

          // Sync reviewer and type
          const oldReviewer = review.reviewer
          const oldApproverType = review.approver_type
          const newApproverType = (step as any).approver_type
          const newReviewer = await resolveReviewerEmail(step, doc)

          if (oldApproverType !== newApproverType) {
            review.approver_type = newApproverType
            modified = true
          }

          if (newReviewer !== null && oldReviewer !== newReviewer) {
            review.reviewer = newReviewer
            modified = true
          }


          modified = true // Mark as modified if we found the step, even if values seem same (safeguard)
        }
      }
    }

    if (modified) {
      await payload.update({
        collection: collectionSlug as any,
        id: docId,
        data: {
          workflow_reviews: updatedReviews,
        },
      })
    }

    return { success: true, modified }
  } catch (error: any) {
    console.error('Error syncing workflow settings:', error)
    return { success: false, error: error.message }
  }
}

export async function updateWorkflowStatusAction(collectionSlug: string, docId: string | number) {
  const payload = await getPayload({ config: configPromise })

  try {
    await payload.update({
      collection: collectionSlug as any,
      id: docId,
      data: {}, // Dummy update to trigger hooks
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error updating workflow status:', error)
    return { success: false, error: error.message }
  }
}
