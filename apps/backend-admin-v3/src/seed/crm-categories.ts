import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

const CRM_CATEGORIES = [
  { title: 'F&B Service or Product', slug: 'fnb-service', managedByDepartmentSlug: 'fnb-director' },
  { title: 'Food Hygiene / Contamination', slug: 'food-hygiene', managedByDepartmentSlug: 'fnb-director' },
  { title: 'Department Store', slug: 'department-store', managedByDepartmentSlug: 'store-director' },
  { title: 'Health, Safety & Security', slug: 'health-safety-security', managedByDepartmentSlug: 'security-manager' },
  { title: 'Delivery / Logistics', slug: 'delivery-logistics', managedByDepartmentSlug: 'delivery-manager' },
  { title: 'Payment / Refund / Billing', slug: 'payment-refund-billing', managedByDepartmentSlug: 'finance-manager-crm' },
  { title: 'Product Quality (Non-Food)', slug: 'product-quality', managedByDepartmentSlug: 'quality-manager' },
  { title: 'Facilities / Maintenance', slug: 'facilities-maintenance', managedByDepartmentSlug: 'maintenance-manager' },
  { title: 'Digital / App / Website', slug: 'digital-app-website', managedByDepartmentSlug: 'it-digital-manager' },
  { title: 'Staff Conduct', slug: 'staff-conduct', managedByDepartmentSlug: 'hr-manager-crm' },
  { title: 'Loyalty / Membership', slug: 'loyalty-membership', managedByDepartmentSlug: 'crm-director' },
  { title: 'Media / PR / Social', slug: 'media-pr-social', managedByDepartmentSlug: 'senior-mgmt-pr-director' },
]

export const seedCrmCategories = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('[seedCrmCategories] seeding crm categories...')

  try {
    const operatorResult = await payload.find({
      collection: 'operators',
      where: { slug: { equals: 'doha-oasis' } },
      limit: 1,
      overrideAccess: true,
    })

    const operator = operatorResult.docs[0]
    if (!operator) {
      payload.logger.error('[seedCrmCategories] Operator "doha-oasis" not found — skipping.')
      return
    }

    for (const cat of CRM_CATEGORIES) {
      const operatorDeptSlug = `doha-oasis-${cat.managedByDepartmentSlug}`
      
      const deptResult = await payload.find({
        collection: 'departments',
        where: { operator_slug: { equals: operatorDeptSlug } },
        limit: 1,
        overrideAccess: true,
      })

      const dept = deptResult.docs[0]
      if (!dept) {
        payload.logger.error(`[seedCrmCategories] Department "${operatorDeptSlug}" not found — skipping category "${cat.slug}".`)
        continue
      }

      const existing = await payload.find({
        collection: 'crm-categories',
        where: { slug: { equals: cat.slug } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.totalDocs > 0) {
        payload.logger.info(`[seedCrmCategories] "${cat.slug}" already exists — skipping.`)

        // Ensure relationship is set correctly if existing
        const existingCat = existing.docs[0]!
        const existingDeptId = typeof existingCat.managed_by_department === 'object' && existingCat.managed_by_department !== null ? existingCat.managed_by_department.id : existingCat.managed_by_department
        
        if (existingDeptId !== dept.id) {
          await payload.update({
            collection: 'crm-categories',
            id: existingCat.id,
            data: { managed_by_department: dept.id },
            overrideAccess: true,
          })
          payload.logger.info(`[seedCrmCategories] updated managed_by_department for "${cat.slug}"`)
        }
        
        continue
      }

      await payload.create({
        collection: 'crm-categories',
        data: {
          title: cat.title,
          slug: cat.slug,
          managed_by_department: dept.id,
        } as RequiredDataFromCollectionSlug<'crm-categories'>,
        overrideAccess: true,
      })

      payload.logger.info(`[seedCrmCategories] ✓ created "${cat.title}" (managed by: ${operatorDeptSlug})`)
    }
  } catch (error) {
    console.error('Error creating crm categories:', error)
    throw error
  }
}
