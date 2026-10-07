import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "employee_history" DROP CONSTRAINT IF EXISTS "employee_history_created_by_id_users_id_fk";
  
  ALTER TABLE "employee_history" DROP CONSTRAINT IF EXISTS "employee_history_updated_by_id_users_id_fk";
  
  DROP INDEX IF EXISTS "employee_history_created_by_idx";
  DROP INDEX IF EXISTS "employee_history_updated_by_idx";
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "days_deducted" numeric DEFAULT 0;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_days_deducted" numeric DEFAULT 0;
  ALTER TABLE "employee_history" DROP COLUMN IF EXISTS "created_by_id";
  ALTER TABLE "employee_history" DROP COLUMN IF EXISTS "updated_by_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "employee_history" ADD COLUMN IF NOT EXISTS "created_by_id" uuid;
  ALTER TABLE "employee_history" ADD COLUMN IF NOT EXISTS "updated_by_id" uuid;
  ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "employee_history_created_by_idx" ON "employee_history" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "employee_history_updated_by_idx" ON "employee_history" USING btree ("updated_by_id");
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "days_deducted";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_days_deducted";`)
}
