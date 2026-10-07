import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

const serviceFormSlug = 'store-floor-customer-service'

// Public, no auth, no workflow — pure data collection, no approval routing.
export const seedStoreFloorCustomerServiceForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const serviceFormData = {
    title: 'Store Floor Customer Service',
    slug: serviceFormSlug,
    operator: operator.id,
    operator_slug: `doha-oasis-${serviceFormSlug}`,
    override_user_operator: false,
    theme: 'printemps',
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
            label: 'Step 1',
            fields: [
              {
                blockType: 'select',
                name: 'delivery_or_in_store',
                label: 'Home Delivery or In Store?',
                variant: 'label-on-top',
                required: true,
                options: [
                  { label: 'Home Delivery', value: 'home_delivery' },
                  { label: 'In Store', value: 'in_store' },
                ],
              },
              {
                blockType: 'select',
                name: 'interaction_type',
                label: 'Interaction Type',
                variant: 'label-on-top',
                required: true,
                options: [
                  { label: 'Inquiry', value: 'inquiry' },
                  { label: 'Feedback', value: 'feedback' },
                ],
              },
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
                label: 'Message / Description',
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
                blockType: 'phone',
                name: 'customer_phone',
                label: 'Contact Number',
                variant: 'label-on-top',
                required: true,
              },
              {
                blockType: 'email',
                name: 'customer_email',
                label: 'Email',
                variant: 'label-on-top',
                required: false,
              },
              {
                blockType: 'text',
                name: 'cm_account',
                label: 'CM Account',
                variant: 'label-on-top',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, serviceFormData)
}
