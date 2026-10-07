import type { Payload } from 'payload'
import type { Department, Operator } from '@/payload-types'

export const SURVEY_DEPARTMENTS = [
  { key: 'it', title: 'IT', slug: 'it' },
  { key: 'fnb', title: 'Food & Beverage', slug: 'food-and-beverage' },
  { key: 'retail', title: 'Retail', slug: 'retail' },
  { key: 'guestRelations', title: 'Guest Relations', slug: 'guest-relations' },
  { key: 'hr', title: 'HR', slug: 'hr' },
] as const

export type SurveyDepartmentKey = (typeof SURVEY_DEPARTMENTS)[number]['key']
export type SurveyDepartmentMap = Record<SurveyDepartmentKey, Department>

/** Departments the seeded surveys and employees use. Creates only the missing ones. */
export const seedSurveyDepartments = async (
  payload: Payload,
  operator: Operator,
): Promise<SurveyDepartmentMap> => {
  const result = {} as SurveyDepartmentMap

  for (const { key, title, slug } of SURVEY_DEPARTMENTS) {
    const operatorSlug = `${operator.slug}-${slug}`
    const existing = await payload.find({
      collection: 'departments',
      where: { operator_slug: { equals: operatorSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      result[key] = existing.docs[0]
      continue
    }

    result[key] = await payload.create({
      collection: 'departments',
      data: {
        title,
        slug,
        operator: operator.id,
        operator_slug: operatorSlug,
        _status: 'published',
      },
      overrideAccess: true,
    })
    payload.logger.info(`✓ Created survey department: ${title}`)
  }

  return result
}
