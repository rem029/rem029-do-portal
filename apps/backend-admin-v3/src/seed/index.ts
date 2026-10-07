import type { Payload } from 'payload'
import { seedFirstUser } from './first-user'
import { seedDocuSignTestUsers } from './docusign-test-users'
import { seedUsersAccessFromV2 } from './users-access-v2-import'
import { seedUsersFromV2 } from './users-v2-import'
import { seedOperator } from './operators'
import { seedWorkflow } from './workflow'
import { seedSalaryDeductionSettings } from './salary-deduction-settings'
import { createDefaultUserAccess } from './helpers/create-user-access'
import { seedH2AoasysSettings } from './h2a-oasys-settings'
import { refreshH2aOasysData, syncH2ADepartment } from '@/services/h2a-oasys'
import { seedForms } from './forms'
import { seedPredefinedWorkflows } from './predefined-workflows'
import { seedFnbMenu } from './fnb-menu'
import { seedFnbOrderSystem } from './fnb-order-system'
import { seedFnbEvents } from './fnb-events'
import { seedFnbEventStaff } from './fnb-event-staff'
import { seedFnbMenuEventsOwnership } from './fnb-menu-events-ownership'
import { seedWorkflowV2 } from './workflow-v2'
import { seedStoreDepartments } from './store-departments'
import { seedCrmDepartments } from './crm-departments'
import { seedCrmCategories } from './crm-categories'
import { seedQaFieldTypes } from './qa-field-types'
import { seedTripSchedulingIfEmpty } from './trip-scheduling'

const errorWrapper = async <T>(
  fn: () => Promise<void | T>,
  onError?: (error?: any) => Promise<void | any>,
  onFinally?: () => Promise<void | any>,
) => {
  try {
    return await fn()
  } catch (error) {
    return onError ? await onError(error) : error
  } finally {
    return onFinally ? await onFinally() : undefined
  }
}

export const seed = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('Starting database seeding... (seed function entered)')

  const e = errorWrapper

  try {
    // Create first user
    await e(
      async () => await seedFirstUser({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    await e(
      async () => await seedDocuSignTestUsers({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Import users-access from v2
    await e(
      async () => await seedUsersAccessFromV2({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Import users from v2
    await e(
      async () => await seedUsersFromV2({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Seed Initial User Access
    await e(
      async () => await createDefaultUserAccess(payload, true),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )
    await e(
      async () => await createDefaultUserAccess(payload, false),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Seed Initial Operators
    const operators = await e(
      async () => await seedOperator({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Seed Initial H2A Oasys Settings
    await e(
      async () => await seedH2AoasysSettings({ payload, operators }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    await e(
      async () => await refreshH2aOasysData(payload),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    await e(
      async () => await syncH2ADepartment({ payload }),
      async (error) =>
        payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    )

    // Sync Initial H2A Oasys Users
    // await syncH2AUser({ payload })

    // Seed Initial Workflows
    // await e(
    //   async () => await seedWorkflow({ payload }),
    //   async (error) =>
    //     payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
    // )

    if (process.env.NODE_ENV !== 'production') {
      // await seedRequestLetterSettings({ payload })
      // await seedBusinessJustificationSettings({ payload })
      // await seedSalaryDeductionSettings({ payload })
      // await seedOfferLetterSettings({ payload })
      // await e(
      //   async () => await seedSalaryDeductionSettings({ payload }),
      //   async (error) =>
      //     payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
      // )
      // await seedSalaryDeductionData({ payload })
      // await e(
      //   async () => await seedPredefinedWorkflows({ payload }),
      //   async (error) =>
      //     payload.logger.error(
      //       `Error during seeding predefined workflows: ${JSON.stringify(error)}`,
      //     ),
      // )
      // await e(
      //   async () => await seedForms({ payload }),
      //   async (error) =>
      //     payload.logger.error(`Error during seeding forms: ${JSON.stringify(error)}`),
      // )

      // Update default user
      await e(
        async () => await updateDefaultUser({ payload }),
        async (error) =>
          payload.logger.error(`Error during seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed FnB Menu
      await e(
        async () => await seedFnbMenu({ payload }),
        async (error) =>
          payload.logger.error(`Error during FnB seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed FnB order tracking demo data (tables, ordering-enabled pages, staff users)
      await e(
        async () => await seedFnbOrderSystem({ payload }),
        async (error) =>
          payload.logger.error(
            `Error during FnB order system seeding: ${JSON.stringify(error, null, 2)}`,
          ),
      )

      // Seed FnB demo event
      await e(
        async () => await seedFnbEvents({ payload }),
        async (error) =>
          payload.logger.error(`Error during FnB event seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed FnB demo event staff assignments (needs the events + demo staff users above)
      await e(
        async () => await seedFnbEventStaff({ payload }),
        async (error) =>
          payload.logger.error(
            `Error during FnB event staff seeding: ${JSON.stringify(error, null, 2)}`,
          ),
      )

      // Seed a non-super test user owning one demo event (needs the events above) -
      // TECH-0098 Task 11C ownership-scoped access manual verification
      await e(
        async () => await seedFnbMenuEventsOwnership({ payload }),
        async (error) =>
          payload.logger.error(
            `Error during FnB menu events ownership seeding: ${JSON.stringify(error, null, 2)}`,
          ),
      )

      // Seed Store Departments
      await e(
        async () => await seedStoreDepartments({ payload }),
        async (error) =>
          payload.logger.error(`Error during store-departments seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed CRM Departments
      await e(
        async () => await seedCrmDepartments({ payload }),
        async (error) =>
          payload.logger.error(`Error during crm-departments seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed CRM Categories
      await e(
        async () => await seedCrmCategories({ payload }),
        async (error) =>
          payload.logger.error(`Error during crm-categories seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed Workflow V2 test blueprint
      await e(
        async () => await seedWorkflowV2({ payload }),
        async (error) =>
          payload.logger.error(`Error during workflow-v2 seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed Forms (includes Test Form DO which depends on workflow-v2)
      await e(
        async () => await seedForms({ payload }),
        async (error) =>
          payload.logger.error(`Error during forms seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed QA Field Types
      await e(
        async () => await seedQaFieldTypes({ payload }),
        async (error) =>
          payload.logger.error(`Error during qa-field-types seeding: ${JSON.stringify(error, null, 2)}`),
      )

      // Seed Trip Scheduling reference data (only on an empty database)
      await e(
        async () => await seedTripSchedulingIfEmpty({ payload }),
        async (error) =>
          payload.logger.error(`Error during trip-scheduling seeding: ${JSON.stringify(error, null, 2)}`),
      )
    }

    payload.logger.info('Database seeding completed successfully!')
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Error during seeding' })
    throw error
  }
}

const updateDefaultUser = async ({ payload }: { payload: Payload }) => {
  const { logger } = payload
  const defaultUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'default@payload.com' } },
    limit: 1,
    overrideAccess: true,
  })

  if (defaultUser.docs.length === 0) return

  const operatorResult = await payload.find({
    collection: 'operators',
    where: {
      slug: { equals: 'doha-oasis' },
    },
    limit: 1,
    overrideAccess: true,
  })

  const operator = operatorResult.docs[0]
  if (!operator) {
    logger.error('No operator found with slug "doha-oasis" during seeding.')
    return
  }

  const departmentResult = await payload.find({
    collection: 'departments',
    where: {
      and: [
        {
          title: { equals: 'DO IT' },
        },
        {
          operator: { equals: operator.id },
        },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  const department = departmentResult.docs[0]
  if (!department) {
    logger.error('No department found with title "DO IT" for "doha-oasis" during seeding.')
    return
  }

  await payload.update({
    collection: 'users',
    id: defaultUser.docs[0].id,
    data: {
      operator: operator.id,
      department: department.id,
    },
    overrideAccess: true,
  })

  logger.info('Default user updated with "doha-oasis" operator and "DO IT" department.')
}
