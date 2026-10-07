import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'

export const employeeExperienceSurveySlug = 'employee-experience-survey'

/**
 * A code-gated survey (`is_survey: true`) — it cannot be submitted through the public form path;
 * responses come only via a single-use invitation code sent from Survey Invitations. The
 * `forms` beforeChange hook auto-assigns `survey_code` (e.g. `A1`) the first time this is saved,
 * and every invitation code for it is formatted `<random 6 chars>-<survey_code>` (e.g. `ABC123-A1`).
 *
 * Fields are kept flat (no `multi-step` wrapper) in this seed, though `rating` and `scale`
 * are also supported inside nested containers (`multi-step`, `group`, `list`, `conditional`).
 *
 * Exercises the survey-relevant blocks: `survey-department` (all departments), `select`, `rating` (stars + labelled Likert),
 * `scale` (0–10 slider), and `textarea`.
 */
export const seedEmployeeExperienceSurveyForm = async (
  payload: Payload,
  operator: Operator,
): Promise<void> => {
  const employeeExperienceSurveyData = {
    title: 'Employee Experience Survey',
    slug: employeeExperienceSurveySlug,
    operator: operator.id,
    operator_slug: `${operator.slug}-${employeeExperienceSurveySlug}`,
    // Respondents are anonymous invitees with no operator of their own — mirror the other
    // public-form seeds so operator resolution never falls back to a (missing) submitter.
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
        blockType: 'survey-department',
        name: 'department',
        label: 'Which department do you work in?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        add_all: true,
      },
      {
        blockType: 'select',
        name: 'tenure',
        label: 'How long have you worked here?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        options: [
          { label: 'Less than 1 year', value: 'lt_1_year' },
          { label: '1–3 years', value: '1_to_3_years' },
          { label: '3–5 years', value: '3_to_5_years' },
          { label: 'More than 5 years', value: 'gt_5_years' },
        ],
      },
      {
        blockType: 'rating',
        name: 'overall_satisfaction',
        label: 'Overall, how satisfied are you working here?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        point_count: 5,
        display: 'stars',
      },
      {
        blockType: 'rating',
        name: 'manager_support',
        label: 'My manager supports my growth and development.',
        variant: 'label-on-top',
        width: 100,
        required: true,
        point_count: 5,
        display: 'buttons',
        labels: [
          { label: 'Strongly disagree' },
          { label: 'Disagree' },
          { label: 'Neutral' },
          { label: 'Agree' },
          { label: 'Strongly agree' },
        ],
      },
      {
        blockType: 'scale',
        name: 'recommend_score',
        label: 'How likely are you to recommend us as a place to work?',
        variant: 'label-on-top',
        width: 100,
        required: true,
        min: 0,
        max: 10,
        step: 1,
        min_label: 'Not at all likely',
        max_label: 'Extremely likely',
      },
      {
        blockType: 'textarea',
        name: 'what_works_well',
        label: 'What do we do well that we should keep doing?',
        variant: 'label-on-top',
        width: 100,
        required: false,
      },
      {
        blockType: 'textarea',
        name: 'what_to_improve',
        label: 'What is the one thing you would most like to see improved?',
        variant: 'label-on-top',
        width: 100,
        required: false,
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, employeeExperienceSurveyData)
}
