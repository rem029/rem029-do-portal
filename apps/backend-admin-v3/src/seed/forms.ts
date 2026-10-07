import type { Payload } from 'payload'
import { Operator } from '@/payload-types'
import { createUserIfNotExists } from './helpers/create-user'
import { createDefaultUserAccess } from './helpers/create-user-access'
import { seedStoreFloorCustomerComplaintsForm } from './forms-store-floor-customer-complaints'
import { seedStoreFloorCustomerServiceForm } from './forms-store-floor-customer-service'
import { seedGuestRelationsCustomComplaintsForm } from './forms-guest-relations-custom-complaints'
import { seedGuestRelationsInquiryForm } from './forms-guest-relations-inquiry'
import { seedPrintempsIncidentForm } from './forms-printemps-incident-forms'
import { seedConditionalResetTestForm } from './forms-conditional-reset-test'
import { seedEmployeeExperienceSurveyForm } from './forms-employee-experience-survey'
import { seedEmployeePulseSurveyForm } from './forms-employee-pulse-survey'
import { seedGuestFeedbackSurveyForm } from './forms-guest-feedback-survey'
import { seedSurveyDepartments } from './survey-departments'
import { seedSurveyTestData } from './survey-test-data'
import { seedLoginRequiredTestForm } from './forms-login-required-test-form'
import { seedLoginRequiredWorkflowV2TestForm } from './forms-login-required-workflow-v2-test-form'

export const seedForms = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('Creating sample forms...')

  try {
    const operatorResult = await payload.find({
      collection: 'operators',
      where: { slug: { equals: 'doha-oasis' } },
      limit: 1,
      overrideAccess: true,
    })

    const operator = operatorResult.docs[0] as Operator
    if (!operator) {
      payload.logger.error('Operator "doha-oasis" not found during form seeding.')
      return
    }

    // Find DO IT department for Doha Oasis
    const departmentResult = await payload.find({
      collection: 'departments',
      where: {
        and: [{ title: { equals: 'DO IT' } }, { operator: { equals: operator.id } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    const department = departmentResult.docs[0]

    // CRM entry/reviewer users — shared by every CRM-workflow form below
    // (store-floor-customer-complaints, guest-relations-custom-complaints,
    // guest-relations-inquiry, printemps-incident-forms).
    await createDefaultUserAccess(payload, 'crm entry access', 'store floor complaints form access')

    await createUserIfNotExists(
      payload,
      'crm.form@user.com',
      operator,
      department ?? undefined,
      true,
      'crm entry access',
      'crm.form@user.com1',
    )

    await createUserIfNotExists(
      payload,
      'cs-team@crm.com',
      operator,
      department ?? undefined,
      true,
      'crm reviewer access',
    )

    // Resolve the crm-case-management workflow-v2 blueprint once — shared by
    // every CRM-style form below.
    const crmWorkflowResult = await payload.find({
      collection: 'workflow-v2',
      where: { slug: { equals: 'crm-case-management' } },
      limit: 1,
      overrideAccess: true,
    })
    const crmWorkflow = crmWorkflowResult.docs[0]
    if (!crmWorkflow) {
      payload.logger.warn(
        '[seedForms] workflow-v2 "crm-case-management" not found — CRM-style forms will not have workflow linked.',
      )
    }

    // printemps-incident-forms belongs to the "Printemps" operator (not
    // doha-oasis) and uses its own dedicated crm-incident-workflow blueprint.
    const printempsOperatorResult = await payload.find({
      collection: 'operators',
      where: { slug: { equals: 'printemps' } },
      limit: 1,
      overrideAccess: true,
    })
    const printempsOperator = (printempsOperatorResult.docs[0] as Operator) ?? operator
    if (!printempsOperatorResult.docs[0]) {
      payload.logger.warn(
        '[seedForms] Operator "printemps" not found — falling back to "doha-oasis" for printemps-incident-forms.',
      )
    }

    const incidentWorkflowResult = await payload.find({
      collection: 'workflow-v2',
      where: { slug: { equals: 'crm-incident-workflow' } },
      limit: 1,
      overrideAccess: true,
    })
    const incidentWorkflow = incidentWorkflowResult.docs[0]
    if (!incidentWorkflow) {
      payload.logger.warn(
        '[seedForms] workflow-v2 "crm-incident-workflow" not found — printemps-incident-forms will not have workflow linked.',
      )
    }

    await seedStoreFloorCustomerComplaintsForm(payload, operator, crmWorkflow)
    await seedStoreFloorCustomerServiceForm(payload, operator)
    await seedGuestRelationsCustomComplaintsForm(payload, operator, crmWorkflow)
    await seedGuestRelationsInquiryForm(payload, operator)
    await seedPrintempsIncidentForm(payload, printempsOperator, incidentWorkflow)
    await seedConditionalResetTestForm(payload, operator)
    const surveyDepartments = await seedSurveyDepartments(payload, operator)
    await seedEmployeeExperienceSurveyForm(payload, operator)
    await seedEmployeePulseSurveyForm(payload, operator, surveyDepartments)
    await seedGuestFeedbackSurveyForm(payload, operator)
    await seedLoginRequiredTestForm(payload, operator)
    await seedLoginRequiredWorkflowV2TestForm(payload, operator)
    await seedSurveyTestData(payload, operator, surveyDepartments)

    payload.logger.info('Form seeding completed successfully.')
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Error during form seeding' })
    throw error
  }
}
