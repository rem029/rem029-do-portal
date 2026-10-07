import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { helloWorldConfirmation } from './helpers/form-confirmations'

const purchaseFormSlug = 'purchase-request'

export const seedPurchaseRequestForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const purchaseWorkflowResult = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: 'purchase-approval' } },
    limit: 1,
    overrideAccess: true,
  })
  const purchaseWorkflow = purchaseWorkflowResult.docs[0]
  if (!purchaseWorkflow) {
    payload.logger.warn(
      '[seedForms] workflow-v2 "purchase-approval" not found — Purchase Request form will not have workflow linked.',
    )
  }

  const purchaseFormData = {
    title: 'Purchase Request',
    slug: purchaseFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${purchaseFormSlug}`,
    theme: 'dohaoasis-new',
    available_languages: ['EN'],
    submitButtonLabel: 'Submit Purchase Request',
    requires_auth: false,
    enable_workflow: true,
    use_workflow_v2: !!purchaseWorkflow,
    workflow_v2: purchaseWorkflow ? purchaseWorkflow.id : undefined,
    workflow_slug: purchaseWorkflow ? 'purchase-approval' : undefined,
    enable_form_status: false,
    enable_public_submission_link: true,
    isActive: true,
    emails: [],
    confirmationType: 'message',
    confirmationMessage: helloWorldConfirmation,
    fields: [
      {
        blockType: 'multi-step',
        steps: [
          {
            label: 'Requester Details',
            fields: [
              {
                blockType: 'text',
                name: 'requester_name',
                label: 'Requester Name',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'email',
                name: 'requester_email',
                label: 'Requester Email',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
          {
            label: 'Purchase Details',
            fields: [
              {
                blockType: 'text',
                name: 'vendor_name',
                label: 'Vendor Name',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'textarea',
                name: 'item_description',
                label: 'Item Description',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'number',
                name: 'estimated_cost',
                label: 'Estimated Cost',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, purchaseFormData)
}
