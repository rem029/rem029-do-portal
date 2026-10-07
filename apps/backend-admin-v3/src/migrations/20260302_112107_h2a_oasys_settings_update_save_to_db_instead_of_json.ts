import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_info";
  ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_doj";
  ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_budget";
  ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_probation";
  ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_on_leave";
  ALTER TABLE "h2a_oasys_settings" DROP COLUMN IF EXISTS "employee_on_leave_history";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_info" varchar;
  ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_doj" varchar;
  ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_budget" varchar;
  ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_probation" varchar;
  ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_on_leave" varchar;
  ALTER TABLE "h2a_oasys_settings" ADD COLUMN IF NOT EXISTS "employee_on_leave_history" varchar;`)
}
