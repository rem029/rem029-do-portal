import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator, WorkflowV2 } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { helloWorldConfirmation } from './helpers/form-confirmations'

const crmFormSlug = 'crm-case-management'

export const seedCrmCaseManagementForm = async (
  payload: Payload,
  operator: Operator,
  crmWorkflow: WorkflowV2 | undefined,
): Promise<void> => {
  const crmFormData = {
    title: 'CRM Case Management',
    slug: crmFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${crmFormSlug}`,
    theme: 'dohaoasis-new',
    available_languages: ['EN'],
    submitButtonLabel: 'Submit Case',
    requires_auth: false,
    enable_workflow: true,
    use_workflow_v2: !!crmWorkflow,
    workflow_v2: crmWorkflow ? crmWorkflow.id : undefined,
    workflow_slug: crmWorkflow ? 'crm-case-management' : undefined,
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
            label: 'Your Details',
            fields: [
              {
                blockType: 'text',
                name: 'customer_name',
                label: 'Customer Name',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'email',
                name: 'customer_email',
                label: 'Customer Email',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
          {
            label: 'Case Details',
            fields: [
              {
                blockType: 'textarea',
                name: 'case_description',
                label: 'Case Description',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'list',
                name: 'attachments',
                label: 'Attachments',
                variant: 'label-on-top',
                fields: [
                  {
                    blockType: 'file',
                    name: 'file',
                    label: 'File',
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, crmFormData)
}
