import { Department, Operator, Workflow } from '@/payload-types'

import type { Payload } from 'payload'
import { slugify } from 'payload/shared'
import { createUserIfNotExists } from './helpers/create-user'

const INITIAL_WORKFLOW: any[] = [
  {
    name: 'Salary Deduction Workflow',
    slug: 'salary-deduction-workflow',
    steps: [
      {
        label: 'HR Approval',
        slug: slugify('HR Approval') || '',
        approver_type: 'department',
      },
      {
        label: 'Employee Acknowledgement',
        slug: slugify('Employee Acknowledgement') || '',
        approver_type: 'employee',
      },
      {
        label: 'Finance Approval',
        slug: slugify('Finance Approval') || '',
        approver_type: 'department',
        final_approval: true,
      },
    ],
  },
  {
    name: 'Default Workflow',
    slug: 'default-workflow',
    steps: [
      {
        label: 'Review by Manager',
        slug: slugify('Review by Manager') || '',
        approver_type: 'requestor_department',
      },
      { label: 'Review by HR', slug: slugify('Review by HR') || '', approver_type: 'department' },
      {
        label: 'Review by CEO',
        slug: slugify('Review by CEO') || '',
        approver_type: 'email',
        final_approval: true,
      },
    ],
  },
  {
    name: 'HR Department to CEO Workflow',
    slug: 'hr-department-to-ceo-workflow',
    steps: [
      {
        label: 'Review by Manager',
        slug: slugify('Review by Manager') || '',
        approver_type: 'requestor_department',
      },
      {
        label: 'Review by CEO',
        slug: slugify('Review by CEO') || '',
        approver_type: 'email',
        final_approval: true,
      },
    ],
  },
]

export const seedWorkflow = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Creating workflows...')

  try {
    console.log('Fetching all operators for workflow assignment...')
    const operators = await payload.find({
      collection: 'operators',
      limit: 0,
      overrideAccess: true,
    })

    for (const operator of operators.docs) {
      for (const workflow of INITIAL_WORKFLOW) {
        const operatorSlug = `${operator.slug}-${workflow.slug}`
        const existingWorkflow = await payload.find({
          collection: 'workflow',
          where: { operator_slug: { equals: operatorSlug } },
          limit: 0,
          overrideAccess: true,
          pagination: false,
        })

        if (existingWorkflow?.totalDocs && existingWorkflow.totalDocs > 0) {
          console.log(`${operatorSlug} exists, Skipping.`)
          continue
        }
        console.log('Creating workflows...', operatorSlug, workflow)

        let updatedSteps: Workflow['steps'] = []

        for (const step of workflow?.steps || []) {
          const newSlug = `${operatorSlug}.${slugify(step.slug)}`
          const newStep = { ...step, slug: newSlug }

          console.log('Creating workflows step for...', operatorSlug, newSlug)

          if ((newStep as any).approver_type === 'department') {
            const department = await payload.find({
              collection: 'departments',
              where: {
                operator: {
                  equals: (operator as Operator).id,
                },
                title: {
                  contains: 'Human Resources',
                },
              },
              limit: 1,
              overrideAccess: true,
            })
            if (department.totalDocs > 0) {
              ;(newStep as any).department = (department.docs[0] as Department).id
            }
          }

          if ((newStep as any).approver_type === 'email') {
            const ceoEmail = `ceo@${(operator as Operator).slug.replaceAll('-', '')}.com`
            await createUserIfNotExists(
              payload,
              ceoEmail,
              operator as Operator,
              {} as Department,
              true,
              true,
            )
            ;(newStep as any).approver_email = ceoEmail
          }

          updatedSteps = [
            ...updatedSteps,
            {
              ...newStep,
            },
          ]
        }

        const createdWorkflow = await payload.create({
          collection: 'workflow',
          data: {
            ...workflow,
            steps: updatedSteps,
            operator,
            operator_slug: operatorSlug,
          },
          overrideAccess: true,
        })

        console.log(`✓ Created workflow for : ${createdWorkflow.name}`)
      }

      const departmentIT = await payload.find({
        collection: 'departments',
        where: {
          operator: {
            equals: (operator as Operator).id,
          },
          title: {
            contains: 'Information Technology',
          },
        },
        limit: 1,
        overrideAccess: true,
      })

      // Create a default user for the operator
      const userEmail = `user1@${operator.slug.replaceAll('-', '')}.com`
      await createUserIfNotExists(
        payload,
        userEmail,
        operator,
        departmentIT.totalDocs > 0 ? departmentIT.docs[0] : ({} as Department),
      )

      const departmentFinance = await payload.find({
        collection: 'departments',
        where: {
          operator: {
            equals: (operator as Operator).id,
          },
          title: {
            contains: 'Finance',
          },
        },
        limit: 1,
        overrideAccess: true,
      })

      // Create a default user for the operator
      const userEmail1 = `user2@${operator.slug.replaceAll('-', '')}.com`
      await createUserIfNotExists(
        payload,
        userEmail1,
        operator,
        departmentFinance.totalDocs > 0 ? departmentFinance.docs[0] : ({} as Department),
      )
    }
  } catch (error) {
    console.error('Error creating workflows:', error)
    throw error
  }
}
