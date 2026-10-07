import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { Operator } from '@/payload-types'
import { createForm } from './helpers/create-form'
import { thanksConfirmation } from './helpers/form-confirmations'
import type { SurveyDepartmentMap } from './survey-departments'

export const employeePulseSurveySlug = 'employee-pulse-survey'

const likertLabels = [
  { label: 'Strongly disagree' },
  { label: 'Disagree' },
  { label: 'Neutral' },
  { label: 'Agree' },
  { label: 'Strongly agree' },
]

/**
 * A multi-step survey that nests every container type (multi-step, conditional, group, list), so
 * the survey report can be tested against nested answer paths. The department field offers only
 * IT, F&B and Retail.
 */
export const seedEmployeePulseSurveyForm = async (
  payload: Payload,
  operator: Operator,
  departments: SurveyDepartmentMap,
): Promise<void> => {
  const data = {
    title: 'Employee Pulse Survey',
    slug: employeePulseSurveySlug,
    operator: operator.id,
    operator_slug: `${operator.slug}-${employeePulseSurveySlug}`,
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
        blockType: 'multi-step',
        steps: [
          {
            label: 'About you',
            fields: [
              {
                blockType: 'survey-department',
                name: 'department',
                label: 'Your department',
                variant: 'label-on-top',
                width: 100,
                required: true,
                add_all: false,
                selected_items: [departments.it.id, departments.fnb.id, departments.retail.id],
              },
              {
                blockType: 'radio',
                name: 'work_mode',
                label: 'How do you usually work?',
                variant: 'label-on-top',
                width: 100,
                required: true,
                options: [
                  { label: 'On site', value: 'on_site' },
                  { label: 'Hybrid', value: 'hybrid' },
                  { label: 'Remote', value: 'remote' },
                ],
              },
            ],
          },
          {
            label: 'Your experience',
            fields: [
              {
                blockType: 'rating',
                name: 'workload_balance',
                label: 'My workload is manageable.',
                variant: 'label-on-top',
                width: 100,
                required: true,
                point_count: 5,
                display: 'buttons',
                labels: likertLabels,
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
                // No multi-select block exists; a single-choice select is the closest fit.
                blockType: 'select',
                name: 'benefits_valued',
                label: 'Which benefit do you value most?',
                variant: 'label-on-top',
                width: 100,
                required: false,
                options: [
                  { label: 'Health insurance', value: 'health_insurance' },
                  { label: 'Flexible hours', value: 'flexible_hours' },
                  { label: 'Training budget', value: 'training' },
                  { label: 'Staff meals', value: 'staff_meals' },
                ],
              },
              {
                blockType: 'radio',
                name: 'has_manager',
                label: 'Do you have a direct manager?',
                variant: 'label-on-top',
                width: 100,
                required: true,
                options: [
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ],
              },
              {
                blockType: 'conditional',
                name: 'manager_section',
                label: 'Your manager',
                condition_field: 'has_manager',
                operator: 'equal',
                value: 'yes',
                fields: [
                  {
                    blockType: 'rating',
                    name: 'manager_support',
                    label: 'My manager supports me.',
                    variant: 'label-on-top',
                    width: 100,
                    required: true,
                    point_count: 5,
                    display: 'buttons',
                    labels: likertLabels,
                  },
                ],
              },
              {
                blockType: 'group',
                name: 'wellbeing',
                label: 'Wellbeing',
                fields: [
                  {
                    blockType: 'scale',
                    name: 'stress_level',
                    label: 'How stressed do you feel at work?',
                    variant: 'label-on-top',
                    width: 100,
                    required: true,
                    min: 1,
                    max: 5,
                    step: 1,
                    min_label: 'Not at all',
                    max_label: 'Very',
                  },
                ],
              },
              {
                blockType: 'list',
                name: 'projects',
                label: 'Projects this quarter',
                max_items: 3,
                fields: [
                  {
                    blockType: 'text',
                    name: 'project_name',
                    label: 'Project name',
                    variant: 'label-on-top',
                    width: 100,
                    required: false,
                  },
                  {
                    blockType: 'rating',
                    name: 'project_satisfaction',
                    label: 'How satisfied are you with it?',
                    variant: 'label-on-top',
                    width: 100,
                    required: false,
                    point_count: 5,
                    display: 'stars',
                  },
                ],
              },
            ],
          },
          {
            label: 'Comments',
            fields: [
              {
                blockType: 'textarea',
                name: 'what_works_well',
                label: 'What works well?',
                variant: 'label-on-top',
                width: 100,
                required: false,
              },
              {
                blockType: 'textarea',
                name: 'what_to_improve',
                label: 'What should we improve?',
                variant: 'label-on-top',
                width: 100,
                required: false,
              },
              {
                blockType: 'text',
                name: 'one_word',
                label: 'Describe your team in one word.',
                variant: 'label-on-top',
                width: 100,
                required: false,
              },
            ],
          },
        ],
      },
    ],
  } as RequiredDataFromCollectionSlug<'forms'>

  await createForm(payload, data)
}
