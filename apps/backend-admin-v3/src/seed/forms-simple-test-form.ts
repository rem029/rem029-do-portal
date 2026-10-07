import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { helloWorldConfirmation } from './helpers/form-confirmations'

const simpleFormSlug = 'simple-test-form'

export const seedSimpleTestForm = async (payload: Payload, operator: Operator): Promise<void> => {
  const simpleFormData: RequiredDataFromCollectionSlug<'forms'> = {
    title: 'Simple Test Form',
    slug: simpleFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${simpleFormSlug}`,
    submitButtonLabel: 'Submit',
    requires_auth: false,
    enable_workflow: false,
    fields: [{ blockType: 'text', name: 'name', label: 'Name' }],
    emails: [],
    confirmationType: 'message',
    confirmationMessage: helloWorldConfirmation,
  }

  await createForm(payload, simpleFormData)
}
