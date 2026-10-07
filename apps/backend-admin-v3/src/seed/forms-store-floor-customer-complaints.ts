import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator, WorkflowV2 } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const complaintsFormSlug = 'store-floor-customer-complaints'

// Uses the same crm-case-management workflow-v2 blueprint as the CRM form,
// just with retail-floor-specific intake fields.
export const seedStoreFloorCustomerComplaintsForm = async (
  payload: Payload,
  operator: Operator,
  crmWorkflow: WorkflowV2 | undefined,
): Promise<void> => {
  const complaintsFormData = {
    title: 'Store Floor Customer Complaints',
    slug: complaintsFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${complaintsFormSlug}`,
    // Public/anonymous submitters have no operator of their own — without this,
    // workflow initiation fails with "No operator resolved to create a workflow instance."
    override_user_operator: true,
    theme: 'printemps',
    available_languages: ['EN'],
    requires_auth: true,
    required_access: 'form-store-floor-customer-complaints',
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
                blockType: 'date',
                name: 'date',
                label: 'Date',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'time',
                name: 'time',
                label: 'Time',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
          {
            label: 'Step 2',
            fields: [
              {
                blockType: 'text',
                name: 'communication_channel',
                label: 'Communication Channel',
                variant: 'label-on-top',
                width: 100,
                required: false,
              },
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
          {
            label: 'Step 3',
            fields: [
              {
                blockType: 'textarea',
                name: 'complaint_details',
                label: 'Complaint Details',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'textarea',
                name: 'immediate_action_taken',
                label: 'Immediate Action Taken',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'text',
                name: 'escalated_to',
                label: 'Escalated To?',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'text',
                name: 'follow_up_person',
                label: 'Responsible person for follow up',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'date',
                name: 'target_date_closure',
                label: 'Target Date Closure',
                variant: 'label-on-top',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, complaintsFormData)
}
