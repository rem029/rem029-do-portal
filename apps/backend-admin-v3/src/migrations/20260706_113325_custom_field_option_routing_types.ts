import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_global_custom_fields_options_related_type" AS ENUM('store_department', 'department', 'user', 'email');
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_custom_fields_options_related_type" AS ENUM('store_department', 'department', 'user', 'email');
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   ALTER TABLE "workflow_v2_global_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_type" "enum_workflow_v2_global_custom_fields_options_related_type";
   ALTER TABLE "workflow_v2_global_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_dept_id" uuid;
   ALTER TABLE "workflow_v2_global_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_user_id" uuid;
   ALTER TABLE "workflow_v2_global_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_email" varchar;

   ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_type" "enum_workflow_v2_steps_custom_fields_options_related_type";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_dept_id" uuid;
   ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_user_id" uuid;
   ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_email" varchar;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_global_custom_fields_options" ADD CONSTRAINT "workflow_v2_global_custom_fields_options_related_dept_id_departments_id_fk" FOREIGN KEY ("related_dept_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_global_custom_fields_options" ADD CONSTRAINT "workflow_v2_global_custom_fields_options_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD CONSTRAINT "workflow_v2_steps_custom_fields_options_related_dept_id_departments_id_fk" FOREIGN KEY ("related_dept_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD CONSTRAINT "workflow_v2_steps_custom_fields_options_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_options_related_dept_idx" ON "workflow_v2_global_custom_fields_options" USING btree ("related_dept_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_options_related_user_idx" ON "workflow_v2_global_custom_fields_options" USING btree ("related_user_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_options_related_dept_idx" ON "workflow_v2_steps_custom_fields_options" USING btree ("related_dept_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_options_related_user_idx" ON "workflow_v2_steps_custom_fields_options" USING btree ("related_user_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_global_custom_fields_options_related_dept_id_departments_id_fk";
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_global_custom_fields_options_related_user_id_users_id_fk";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_steps_custom_fields_options_related_dept_id_departments_id_fk";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_steps_custom_fields_options_related_user_id_users_id_fk";

   DROP INDEX IF EXISTS "workflow_v2_global_custom_fields_options_related_dept_idx";
   DROP INDEX IF EXISTS "workflow_v2_global_custom_fields_options_related_user_idx";
   DROP INDEX IF EXISTS "workflow_v2_steps_custom_fields_options_related_dept_idx";
   DROP INDEX IF EXISTS "workflow_v2_steps_custom_fields_options_related_user_idx";

   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP COLUMN IF EXISTS "related_type";
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP COLUMN IF EXISTS "related_dept_id";
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP COLUMN IF EXISTS "related_user_id";
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP COLUMN IF EXISTS "related_email";

   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP COLUMN IF EXISTS "related_type";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP COLUMN IF EXISTS "related_dept_id";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP COLUMN IF EXISTS "related_user_id";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP COLUMN IF EXISTS "related_email";

   DROP TYPE IF EXISTS "public"."enum_workflow_v2_global_custom_fields_options_related_type";
   DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_custom_fields_options_related_type";
  `)
}
