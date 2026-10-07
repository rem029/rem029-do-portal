import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'
import { LOGIN_REQUIRED_WORKFLOW_SLUG } from './workflow-login-required-test'

const formSlug = 'login-required-workflow-v2-test-form'

export const seedLoginRequiredWorkflowV2TestForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const workflowResult = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: LOGIN_REQUIRED_WORKFLOW_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const workflow = workflowResult.docs[0]
  if (!workflow) {
    payload.logger.warn(
      `[seedForms] workflow-v2 "${LOGIN_REQUIRED_WORKFLOW_SLUG}" not found — "${formSlug}" will not have workflow linked.`,
    )
  }

  const formData: RequiredDataFromCollectionSlug<'forms'> = {
    title: 'Login Required Workflow V2 Test Form',
    slug: formSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${formSlug}`,
    // Submitters (e.g. fresh Microsoft SSO users) may have no operator of their own.
    override_user_operator: true,
    submitButtonLabel: 'Submit',
    requires_auth: true,
    enable_workflow: !!workflow,
    use_workflow_v2: !!workflow,
    workflow_slug: workflow ? LOGIN_REQUIRED_WORKFLOW_SLUG : undefined,
    enable_public_submission_link: true,
    isActive: true,
    fields: [
      {
        blockType: 'text',
        name: 'full_name',
        label: 'Full Name',
        variant: 'label-on-top',
        required: true,
      },
      {
        blockType: 'textarea',
        name: 'request_details',
        label: 'Request Details',
        variant: 'label-on-top',
        required: true,
      },
    ],
    emails: [],
    confirmationType: 'message',
    confirmationMessage: thanksConfirmation,
  }

  await createForm(payload, formData)
}
