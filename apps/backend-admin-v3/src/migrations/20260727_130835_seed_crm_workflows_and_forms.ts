import { seedCrmCategories } from '@/seed/crm-categories'
import { seedCrmDepartments } from '@/seed/crm-departments'
import { seedForms } from '@/seed/forms'
import { seedStoreDepartments } from '@/seed/store-departments'
import { seedWorkflowV2 } from '@/seed/workflow-v2'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await seedStoreDepartments({ payload })
  await seedCrmDepartments({ payload })
  await seedCrmCategories({ payload })
  await seedWorkflowV2({ payload })
  await seedForms({ payload })
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Migration code
}
