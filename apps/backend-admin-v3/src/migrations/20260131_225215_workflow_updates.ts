import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "workflow_steps_additional_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
    CONSTRAINT "workflow_steps_additional_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_steps"("id") ON DELETE cascade ON UPDATE no action
  );
  
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_name" DROP NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_id" DROP NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_designation" DROP NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_email" DROP NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_name" DROP NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_id" DROP NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_designation" DROP NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_email" DROP NOT NULL;
  ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "doj" timestamp(3) with time zone;
  ALTER TABLE IF EXISTS "sal_ded" ADD COLUMN IF NOT EXISTS "display_name" varchar;
  ALTER TABLE IF EXISTS "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_display_name" varchar;
  CREATE INDEX IF NOT EXISTS "workflow_steps_additional_emails_order_idx" ON "workflow_steps_additional_emails" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_steps_additional_emails_parent_id_idx" ON "workflow_steps_additional_emails" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "workflow_steps_additional_emails" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "workflow_steps_additional_emails" CASCADE;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_name" SET NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_id" SET NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_designation" SET NOT NULL;
  ALTER TABLE IF EXISTS "sal_ded" ALTER COLUMN "employee_email" SET NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_name" SET NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_id" SET NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_designation" SET NOT NULL;
  ALTER TABLE IF EXISTS "_sal_ded_v" ALTER COLUMN "version_employee_email" SET NOT NULL;
  ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "doj";
  ALTER TABLE IF EXISTS "sal_ded" DROP COLUMN IF EXISTS "display_name";
  ALTER TABLE IF EXISTS "_sal_ded_v" DROP COLUMN IF EXISTS "version_display_name";`)
}
