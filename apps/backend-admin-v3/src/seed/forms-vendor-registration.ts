import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Form, Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { vendorRegistrationFields } from './forms-fields'

const vendorFormSlug = 'vendor-registration'
const workflowSlug = 'vendor-registration'

export const seedVendorRegistrationForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const vendorFormData: RequiredDataFromCollectionSlug<'forms'> = {
    title: 'Vendor Registration',
    slug: vendorFormSlug,
    operator: operator.id,
    submitButtonLabel: 'Submit',
    requires_auth: true,
    enable_workflow: true,
    workflow_slug: workflowSlug,
    emails: [],
    confirmationType: 'message',
    has_terms: true,
    terms_content: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'heading',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'Section 1: The Principle of Temporal Consistency',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            tag: 'h2',
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'By interacting with this interface, the User (hereinafter referred to as "The Subject") acknowledges that time is a non-linear construct. Any delays in form processing are not "lags" but rather "deliberate pauses for cosmic synchronization." The Subject agrees not to hold the System liable for any deja vu experienced during data entry.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
          },
          {
            type: 'heading',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'Section 2: Quantum Data Liability',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            tag: 'h2',
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'Data submitted to this form exists in a state of superposition until observed by an Administrator. The Subject understands that until such observation occurs, the data is both "Correct" and "Incorrect." The System shall not be responsible for any collapsed wave functions resulting in unexpected validation errors.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
          },
          {
            type: 'heading',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'Section 3: Mandatory Enthusiasm Clause',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            tag: 'h2',
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'The Subject warrants that they are filling out this form with a level of enthusiasm no lower than "Mildly Ecstatic." Failure to maintain this emotional state may result in the form spontaneously resetting to its default values as a defensive measure against cynicism.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
      },
    },
    confirmationMessage: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'Registration Completed. Please expect an email for your login credentials.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
      },
    },
    operator_slug: `doha-oasis-${vendorFormSlug}`,
    fields: vendorRegistrationFields as unknown as Form['fields'],
  }

  await createForm(payload, vendorFormData)
}
