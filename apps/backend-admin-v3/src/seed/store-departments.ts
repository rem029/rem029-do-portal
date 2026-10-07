import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { createDefaultUserAccess } from './helpers/create-user-access'

const STORE_DEPARTMENTS = [
  { title: 'F&B', slug: 'fnb' },
  { title: 'Department Store', slug: 'department-store' },
  { title: 'Kids Section', slug: 'kids-section' },
  { title: 'Kitchen & Appliances', slug: 'kitchen-appliances' },
  { title: 'Electronics', slug: 'electronics' },
  { title: 'Shoes', slug: 'shoes' },
]

const createManagerIfNotExists = async (
  payload: Payload,
  email: string,
): Promise<string | undefined> => {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    payload.logger.info(`[seedStoreDepartments] manager "${email}" already exists`)
    return existing.docs[0]!.id
  }

  const userAccess = await createDefaultUserAccess(payload, true)
  const newUser = await payload.create({
    collection: 'users',
    data: {
      email,
      password: email,
      _verified: true,
      access: userAccess.id,
    },
    overrideAccess: true,
    disableVerificationEmail: true,
  })

  payload.logger.info(`[seedStoreDepartments] ✓ created manager user "${email}"`)
  return newUser.id
}

export const seedStoreDepartments = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('[seedStoreDepartments] seeding store departments...')

  for (const dept of STORE_DEPARTMENTS) {
    const managerEmail = `${dept.slug}@department.com`
    const managerId = await createManagerIfNotExists(payload, managerEmail)

    const existing = await payload.find({
      collection: 'store-departments',
      where: { slug: { equals: dept.slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) {
      payload.logger.info(`[seedStoreDepartments] "${dept.slug}" already exists — skipping.`)

      // Update manager if it's not set yet
      const existingDept = existing.docs[0]!
      if (!existingDept.manager && managerId) {
        await payload.update({
          collection: 'store-departments',
          id: existingDept.id,
          data: { manager: managerId },
          overrideAccess: true,
        })
        payload.logger.info(`[seedStoreDepartments] updated manager for "${dept.slug}"`)
      }

      continue
    }

    await payload.create({
      collection: 'store-departments',
      data: {
        title: dept.title,
        slug: dept.slug,
        ...(managerId ? { manager: managerId } : {}),
      } as RequiredDataFromCollectionSlug<'store-departments'>,
      overrideAccess: true,
    })

    payload.logger.info(`[seedStoreDepartments] ✓ created "${dept.title}" (manager: ${managerEmail})`)
  }
}
