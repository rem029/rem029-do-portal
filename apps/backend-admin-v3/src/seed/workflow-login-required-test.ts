import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'

export const LOGIN_REQUIRED_WORKFLOW_SLUG = 'login-required-test-workflow'
const operatorSlug = `doha-oasis-${LOGIN_REQUIRED_WORKFLOW_SLUG}`

export const seedLoginRequiredTestWorkflow = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const data = {
    name: 'Login Required Test Workflow',
    slug: LOGIN_REQUIRED_WORKFLOW_SLUG,
    operator_slug: operatorSlug,
    operator: operator.id,
    notify_on_complete: true,
    notify_on_update: true,
    notify_on_reject: true,
    approval_notifications: [],
    rejection_notifications: [],
    global_custom_fields: [],
    steps: [
      {
        label: 'Review',
        slug: `${operatorSlug}.review`,
        approvers: [{ approver_type: 'email', approver_email: 'lawrence.ponce@dohaoasis.com' }],
        final_approval: false,
        auto_complete: false,
        rejection_policy: 'end',
        can_acknowledge: false,
        can_approve: true,
        can_reject: true,
        can_skip: false,
        can_generate_wordfile: false,
        hide_history: false,
        hide_details: false,
        hide_description: false,
        hide_attachments: false,
        hide_email_actions: false,
        acknowledge_label: 'Acknowledge',
        approve_label: 'Approve',
        reject_label: 'Reject',
        skip_label: 'Skip',
        before_response_fields: [
          { blockType: 'textarea', name: 'comments', label: 'Comments', required: false },
        ],
        after_response_approved_fields: [],
        after_response_rejected_fields: [],
        after_response_acknowledged_fields: [],
        on_reaching_notifications: [],
        on_approval_notifications: [],
        on_rejection_notifications: [],
        skip_condition: { enabled: false, source: 'workflow_field', operator: 'equals' },
      },
    ],
  } as RequiredDataFromCollectionSlug<'workflow-v2'>

  const existing = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: LOGIN_REQUIRED_WORKFLOW_SLUG } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    await payload.update({
      collection: 'workflow-v2',
      id: existing.docs[0]!.id,
      overrideAccess: true,
      data,
    })
  } else {
    await payload.create({ collection: 'workflow-v2', overrideAccess: true, data })
  }

  payload.logger.info(`[seedWorkflowV2] "${LOGIN_REQUIRED_WORKFLOW_SLUG}" upserted successfully.`)
}
