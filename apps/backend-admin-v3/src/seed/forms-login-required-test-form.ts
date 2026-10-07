import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const loginRequiredFormSlug = 'login-required-test-form'

export const seedLoginRequiredTestForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const formData: RequiredDataFromCollectionSlug<'forms'> = {
    title: 'Login Required Test Form',
    slug: loginRequiredFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${loginRequiredFormSlug}`,
    submitButtonLabel: 'Submit',
    requires_auth: true,
    enable_workflow: false,
    fields: [
      {
        blockType: 'text',
        name: 'full_name',
        label: 'Full Name',
        variant: 'label-on-top',
        required: true,
      },
      {
        blockType: 'email',
        name: 'email',
        label: 'Email',
        variant: 'label-on-top',
        required: true,
      },
      {
        blockType: 'textarea',
        name: 'message',
        label: 'Message',
        variant: 'label-on-top',
        required: false,
      },
    ],
    emails: [],
    confirmationType: 'message',
    confirmationMessage: thanksConfirmation,
  }

  await createForm(payload, formData)
}
