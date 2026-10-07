import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

export const guestFeedbackSurveySlug = 'guest-feedback-survey'

/**
 * A code-gated survey with **no** `survey-department` block, for the survey report's
 * no-department cases: no department filter/column for super users, and a
 * "no department question" block for department-locked report users.
 */
export const seedGuestFeedbackSurveyForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const guestFeedbackSurveyData = {
    title: 'Guest Feedback Survey',
    slug: guestFeedbackSurveySlug,
    operator: operator.id,
    operator_slug: `${operator.slug}-${guestFeedbackSurveySlug}`,
    override_user_operator: true,
    theme: 'dohaoasis-new',
    available_languages: ['EN'],
    requires_auth: false,
    is_survey: true,
    enable_workflow: false,
    enable_form_status: false,
    enable_public_submission_link: false,
    isActive: true,
    emails: [],
    confirmationType: 'message',
    confirmationMessage: thanksConfirmation,
    fields: [
      {
        blockType: 'rating',
        name: 'visit_rating',
        label: 'How would you rate your visit?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        point_count: 5,
        display: 'stars',
      },
      {
        blockType: 'radio',
        name: 'would_return',
        label: 'Would you visit us again?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
      {
        blockType: 'textarea',
        name: 'comments',
        label: 'Any other comments?',
        variant: 'label-on-top',
        width: 100,
        required: false,
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, guestFeedbackSurveyData)
}
