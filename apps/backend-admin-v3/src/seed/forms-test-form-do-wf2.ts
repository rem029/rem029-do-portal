import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { helloWorldConfirmation } from './helpers/form-confirmations'

const testFormDoSlug = 'test-form-do-wf2'

export const seedTestFormDoWf2 = async (payload: Payload, operator: Operator): Promise<void> => {
  const workflowV2Result = await payload.find({
    collection: 'workflow-v2',
    where: { slug: { equals: 'workflow-v2-test' } },
    limit: 1,
    overrideAccess: true,
  })
  const workflowV2 = workflowV2Result.docs[0]
  if (!workflowV2) {
    payload.logger.warn(
      '[seedForms] workflow-v2 "workflow-v2-test" not found — Test Form DO will not have workflow linked.',
    )
  }

  const testFormDoData = {
    title: 'Test Form DO Workflow V2',
    slug: testFormDoSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${testFormDoSlug}`,
    theme: 'dohaoasis-new',
    available_languages: ['EN'],
    submitButtonLabel: null,
    requires_auth: false,
    enable_workflow: true,
    use_workflow_v2: !!workflowV2,
    workflow_v2: workflowV2 ? workflowV2.id : undefined,
    workflow_slug: workflowV2 ? 'workflow-v2-test' : undefined,
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
            label: 'You Info',
            fields: [
              { blockType: 'text', name: 'name', label: 'Name', variant: 'label-on-top' },
              { blockType: 'email', name: 'email', label: 'Email', variant: 'label-on-top' },
              {
                blockType: 'email',
                name: 'manager_email',
                label: 'Manager Email',
                variant: 'label-on-top',
                required: true,
              },
            ],
          },
          {
            label: 'More info',
            fields: [
              {
                blockType: 'radio',
                name: 'gendar',
                label: 'Gendar',
                variant: 'default',
                direction: 'row',
                options: [
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, testFormDoData)
}
