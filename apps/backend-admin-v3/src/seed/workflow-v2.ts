import type { Payload } from 'payload'
import { Operator } from '@/payload-types'
import { seedCrmCaseManagementBlueprint } from './workflow-crm-case-management'
import { seedCrmIncidentWorkflowBlueprint } from './workflow-crm-incident-workflow'
import { seedLoginRequiredTestWorkflow } from './workflow-login-required-test'

export const seedWorkflowV2 = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('Seeding workflow-v2...')

  const operatorResult = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })

  const operator = operatorResult.docs[0] as Operator
  if (!operator) {
    payload.logger.error('[seedWorkflowV2] Operator "doha-oasis" not found — skipping.')
    return
  }

  await seedCrmCaseManagementBlueprint(payload, operator)
  await seedCrmIncidentWorkflowBlueprint(payload)
  await seedLoginRequiredTestWorkflow(payload, operator)
}
