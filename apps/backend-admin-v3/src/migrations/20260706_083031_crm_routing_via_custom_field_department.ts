import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" ADD VALUE 'workflow_custom_field_department';
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_approver_type" ADD VALUE 'workflow_custom_field_department';
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   ALTER TABLE "workflow_v2_global_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_department_id" uuid;
   ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approver_custom_field_name" varchar;
   ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approver_custom_field_step_slug" varchar;
   ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD COLUMN IF NOT EXISTS "related_department_id" uuid;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_custom_field_name" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_custom_field_step_slug" varchar;
   ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "approver_custom_field_name" varchar;
   ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "approver_custom_field_step_slug" varchar;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_global_custom_fields_options" ADD CONSTRAINT "workflow_v2_global_custom_fields_options_related_department_id_store_departments_id_fk" FOREIGN KEY ("related_department_id") REFERENCES "public"."store_departments"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD CONSTRAINT "workflow_v2_steps_custom_fields_options_related_department_id_store_departments_id_fk" FOREIGN KEY ("related_department_id") REFERENCES "public"."store_departments"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_options_related_departm_idx" ON "workflow_v2_global_custom_fields_options" USING btree ("related_department_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_options_related_departme_idx" ON "workflow_v2_steps_custom_fields_options" USING btree ("related_department_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_global_custom_fields_options_related_department_id_store_departments_id_fk";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP CONSTRAINT IF EXISTS "workflow_v2_steps_custom_fields_options_related_department_id_store_departments_id_fk";

   ALTER TABLE "workflow_v2_steps_additional_approvers" ALTER COLUMN "approver_type" SET DATA TYPE text;
   DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_additional_approvers_approver_type";
   CREATE TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field', 'form_field_email', 'workflow_field_email', 'store_department_field');
   ALTER TABLE "workflow_v2_steps_additional_approvers" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" USING "approver_type"::"public"."enum_workflow_v2_steps_additional_approvers_approver_type";

   ALTER TABLE "workflow_v2_steps" ALTER COLUMN "approver_type" SET DATA TYPE text;
   DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_approver_type";
   CREATE TYPE "public"."enum_workflow_v2_steps_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field', 'form_field_email', 'workflow_field_email', 'store_department_field');
   ALTER TABLE "workflow_v2_steps" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_v2_steps_approver_type" USING "approver_type"::"public"."enum_workflow_v2_steps_approver_type";

   DROP INDEX IF EXISTS "workflow_v2_global_custom_fields_options_related_departm_idx";
   DROP INDEX IF EXISTS "workflow_v2_steps_custom_fields_options_related_departme_idx";

   ALTER TABLE "workflow_v2_global_custom_fields_options" DROP COLUMN IF EXISTS "related_department_id";
   ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approver_custom_field_name";
   ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approver_custom_field_step_slug";
   ALTER TABLE "workflow_v2_steps_custom_fields_options" DROP COLUMN IF EXISTS "related_department_id";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_custom_field_name";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_custom_field_step_slug";
   ALTER TABLE "workflow_instances_reviews" DROP COLUMN IF EXISTS "approver_custom_field_name";
   ALTER TABLE "workflow_instances_reviews" DROP COLUMN IF EXISTS "approver_custom_field_step_slug";
  `)
}
