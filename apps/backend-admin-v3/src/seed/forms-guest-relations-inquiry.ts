import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const grInquiryFormSlug = 'guest-relations-inquiry'

// Requires auth, but no workflow — no approval routing, just a gated submission form.
export const seedGuestRelationsInquiryForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const grInquiryFormData = {
    title: 'Guest Relations Custom Inquiry or Feedback',
    slug: grInquiryFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${grInquiryFormSlug}`,
    override_user_operator: false,
    theme: 'printemps',
    available_languages: ['EN'],
    requires_auth: true,
    required_access: 'form-guest-relations-inquiry',
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
            ],
          },
          {
            label: 'Step 2',
            fields: [
              {
                blockType: 'textarea',
                name: 'message',
                label: 'Message',
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

  await createForm(payload, grInquiryFormData)
}
