import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const conditionalResetTestFormSlug = 'conditional-reset-test'

// TECH-0102 — reproduces the nested-conditional value-reset bug: a chain of
// conditional blocks (main1 -> dep1 -> dep2) where each link's visibility
// depends on the previous field's stale value once the trigger field changes.
export const seedConditionalResetTestForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const conditionalResetTestFormData = {
    title: 'TECH-0102 Conditional Reset Test',
    slug: conditionalResetTestFormSlug,
    operator: operator.id,
    operator_slug: `${operator.slug}-${conditionalResetTestFormSlug}`,
    override_user_operator: false,
    theme: 'dohaoasis-new',
    available_languages: ['EN'],
    requires_auth: false,
    enable_workflow: false,
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
            label: 'Your Info',
            fields: [
              {
                blockType: 'text',
                name: 'name',
                label: 'Name',
                variant: 'label-on-top',
                width: 100,
                required: true,
              },
            ],
          },
          {
            label: 'Questions',
            fields: [
              {
                blockType: 'radio',
                name: 'main1',
                label: 'Main 1 — top-level trigger',
                variant: 'label-on-top',
                direction: 'row',
                required: true,
                options: [
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ],
              },
              {
                blockType: 'conditional',
                name: 'main1_conditional',
                condition_field: 'main1',
                operator: 'equal',
                value: 'yes',
                fields: [
                  {
                    blockType: 'radio',
                    name: 'dep1',
                    label: 'Dep 1 — shown if Main 1 = Yes',
                    variant: 'label-on-top',
                    direction: 'row',
                    required: true,
                    options: [
                      { label: 'Yes', value: 'yes' },
                      { label: 'No', value: 'no' },
                    ],
                  },
                ],
              },
              {
                blockType: 'conditional',
                name: 'dep1_conditional',
                condition_field: 'dep1',
                operator: 'equal',
                value: 'yes',
                fields: [
                  {
                    blockType: 'file',
                    name: 'dep2',
                    label: 'Dep 2 — shown if Dep 1 = Yes (file)',
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, conditionalResetTestFormData)
}
