import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_name";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_h2a_id";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_designation";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_department_name";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_operator_name";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_email";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_doj";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_name";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_h2a_id";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_designation";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_department_name";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_operator_name";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_email";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_doj";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_name" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_h2a_id" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_designation" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_department_name" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_operator_name" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_email" varchar;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_doj" timestamp(3) with time zone;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_name" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_h2a_id" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_designation" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_department_name" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_operator_name" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_email" varchar;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_doj" timestamp(3) with time zone;`)
}
