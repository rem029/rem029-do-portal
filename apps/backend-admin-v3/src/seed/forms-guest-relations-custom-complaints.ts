import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator, WorkflowV2 } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const grComplaintsFormSlug = 'guest-relations-custom-complaints'

// Same crm-case-management workflow-v2 blueprint as store-floor-customer-complaints.
export const seedGuestRelationsCustomComplaintsForm = async (
  payload: Payload,
  operator: Operator,
  crmWorkflow: WorkflowV2 | undefined,
): Promise<void> => {
  const grComplaintsFormData = {
    title: 'Guest Relations Custom Complaints',
    slug: grComplaintsFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${grComplaintsFormSlug}`,
    // Same reasoning as store-floor-customer-complaints: without this, workflow
    // initiation for an authenticated submitter whose own operator doesn't match
    // can fail with "No operator resolved to create a workflow instance."
    override_user_operator: true,
    theme: 'printemps',
    available_languages: ['EN'],
    requires_auth: true,
    required_access: 'form-guest-relations-custom-complaints',
    enable_workflow: true,
    use_workflow_v2: !!crmWorkflow,
    workflow_v2: crmWorkflow ? crmWorkflow.id : undefined,
    workflow_slug: crmWorkflow ? 'crm-case-management' : undefined,
    enable_form_status: false,
    enable_public_submission_link: false,
    isActive: true,
    emails: [],
    confirmationType: 'message',
    confirmationMessage: thanksConfirmation,
    fields: [
      {
        blockType: 'multi-step',
        steps: [
          {
            label: 'Step 1',
            fields: [
              {
                blockType: 'select-store-departments',
                name: 'store_department',
                label: 'Store Department',
                variant: 'label-on-top',
                required: true,
                add_all: true,
                selected_items: [],
              },
              {
                blockType: 'text',
                name: 'communication_channel',
                label: 'Communication Channel',
                variant: 'label-on-top',
                width: 100,
                required: false,
              },
            ],
          },
          {
            label: 'Step 2',
            fields: [
              {
                blockType: 'text',
                name: 'forwarded_to',
                label: 'To Whom This Was Forwarded To?',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'textarea',
                name: 'complaint_details',
                label: 'Complaint Details',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
          {
            label: 'Step 3',
            fields: [
              {
                blockType: 'text',
                name: 'customer_name',
                label: 'Customer Name',
                variant: 'label-on-top',
                width: 100,
                required: true,
              },
              {
                blockType: 'text',
                name: 'customer_account',
                label: 'Customer Account',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'email',
                name: 'customer_email',
                label: 'Customer Email',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'phone',
                name: 'customer_phone',
                label: 'Customer Contact',
                variant: 'label-on-top',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, grComplaintsFormData)
}
