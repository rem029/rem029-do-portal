import { Department } from '@/payload-types'

import type { Payload } from 'payload'
import { createUserIfNotExists } from './helpers/create-user'

const INITIAL_CRM_DEPARTMENTS: Pick<Department, 'title' | 'slug'>[] = [
  { title: 'F&B Director', slug: 'fnb-director' },
  { title: 'Store Director', slug: 'store-director' },
  { title: 'Security Manager', slug: 'security-manager' },
  { title: 'Delivery Manager', slug: 'delivery-manager' },
  { title: 'Finance Manager (CRM)', slug: 'finance-manager-crm' },
  { title: 'Quality Manager', slug: 'quality-manager' },
  { title: 'Maintenance Manager', slug: 'maintenance-manager' },
  { title: 'IT/Digital Manager', slug: 'it-digital-manager' },
  { title: 'HR Manager (CRM)', slug: 'hr-manager-crm' },
  { title: 'CRM Director', slug: 'crm-director' },
  { title: 'Senior Mgmt / PR Director', slug: 'senior-mgmt-pr-director' },
]

export const seedCrmDepartments = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Creating crm departments...')

  try {
    const operatorResult = await payload.find({
      collection: 'operators',
      where: { slug: { equals: 'doha-oasis' } },
      limit: 1,
      overrideAccess: true,
    })

    const operator = operatorResult.docs[0]
    if (!operator) {
      payload.logger.error('[seedCrmDepartments] Operator "doha-oasis" not found — skipping.')
      return
    }

    for (const department of INITIAL_CRM_DEPARTMENTS) {
      const operatorSlug = `doha-oasis-${department.slug}`
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
      
      const manager_email = `${department.slug}@crm-department.com`
      const manager_name = department.title

      console.log('Creating crm department...', operatorSlug, department)

      const createdDepartment = await payload.create({
        collection: 'departments',
        data: {
          title: department.title,
          slug: department.slug,
          operator: operator.id,
          operator_slug: operatorSlug,
          manager_name,
          manager_email,
          _status: 'published',
        },
        overrideAccess: true,
      })

      console.log(`✓ Created crm department for : ${createdDepartment.title}`)

      await createUserIfNotExists(payload, manager_email, operator, createdDepartment, true, true)
    }
  } catch (error) {
    console.error('Error creating crm departments:', error)
    throw error
  }
}
