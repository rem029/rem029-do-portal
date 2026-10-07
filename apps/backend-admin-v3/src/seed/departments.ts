import { Department } from '@/payload-types'

import type { Payload } from 'payload'
import { createUserIfNotExists } from './helpers/create-user'

const INITIAL_DEPARTMENTS: Pick<
  Department,
  'title' | 'slug' | 'manager_name' | 'manager_email' | 'operator' | 'sub_departments'
>[] = [
  {
    title: 'Human Resources',
    slug: 'human-resources',
    manager_name: 'John Doe',

    operator: '',
    sub_departments: [{ name: 'Recruitment' }, { name: 'Employee Relations' }],
  },
  {
    title: 'Finance',
    slug: 'finance',
    manager_name: 'Jane Doe',

    operator: '',
    sub_departments: [{ name: 'Accounts Payable' }, { name: 'Accounts Receivable' }],
  },
  {
    title: 'Information Technology',
    slug: 'information-technology',
    manager_name: 'Jane Doe',

    operator: '',
    sub_departments: [{ name: 'Infrastructure' }, { name: 'Software Development' }],
  },
]

export const seedDepartments = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Creating departments...')

  try {
    console.log('Fetching all operators for department assignment...')
    const operators = await payload.find({
      collection: 'operators',
      limit: 0,
      overrideAccess: true,
    })

    for (const operator of operators.docs) {
      for (const department of INITIAL_DEPARTMENTS) {
        const operatorSlug = `${operator.slug}-${department.slug}`
        const existingDepartment = await payload.find({
          collection: 'departments',
          where: { operator_slug: { equals: operatorSlug } },
          limit: 0,
          overrideAccess: true,
          pagination: false,
        })

        if (existingDepartment?.totalDocs && existingDepartment.totalDocs > 0) {
          console.log(`${operatorSlug} exists, Skipping.`)
          continue
        }
        console.log('Creating departments...', operatorSlug, department)
        const manager_email = `${department.slug}@${operator.slug.replaceAll('-', '')}.com`

        const createdDepartment = await payload.create({
          collection: 'departments',
          data: {
            ...department,
            operator,
            operator_slug: operatorSlug,
            manager_name: `${department.title} Manager`,
            manager_email,
            _status: 'published',
          },
          overrideAccess: true,
        })

        console.log(`✓ Created department for : ${createdDepartment.title}`)

        await createUserIfNotExists(payload, manager_email, operator, createdDepartment, true, true)
      }
    }
  } catch (error) {
    console.error('Error creating departments:', error)
    throw error
  }
}
