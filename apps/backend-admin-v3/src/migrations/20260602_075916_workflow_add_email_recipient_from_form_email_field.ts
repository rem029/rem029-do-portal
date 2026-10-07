import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_workflow_approval_notifications_type" ADD VALUE IF NOT EXISTS 'form_email' BEFORE 'department';
  ALTER TYPE "public"."enum_workflow_rejection_notifications_type" ADD VALUE IF NOT EXISTS 'form_email' BEFORE 'department';
  ALTER TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" ADD VALUE IF NOT EXISTS 'form_email' BEFORE 'department';
  ALTER TYPE "public"."enum_workflow_steps_on_approval_notifications_type" ADD VALUE IF NOT EXISTS 'form_email' BEFORE 'department';
  ALTER TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" ADD VALUE IF NOT EXISTS 'form_email' BEFORE 'department';
  ALTER TABLE "workflow_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_path" varchar;
  ALTER TABLE "workflow_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_label" varchar;
  ALTER TABLE "workflow_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_id" varchar;
  ALTER TABLE "workflow_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_title" varchar;
  ALTER TABLE "workflow_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_path" varchar;
  ALTER TABLE "workflow_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_label" varchar;
  ALTER TABLE "workflow_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_id" varchar;
  ALTER TABLE "workflow_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_title" varchar;
  ALTER TABLE "workflow_steps_on_reaching_notifications" ADD COLUMN IF NOT EXISTS "form_field_path" varchar;
  ALTER TABLE "workflow_steps_on_reaching_notifications" ADD COLUMN IF NOT EXISTS "form_field_label" varchar;
  ALTER TABLE "workflow_steps_on_reaching_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_id" varchar;
  ALTER TABLE "workflow_steps_on_reaching_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_title" varchar;
  ALTER TABLE "workflow_steps_on_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_path" varchar;
  ALTER TABLE "workflow_steps_on_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_label" varchar;
  ALTER TABLE "workflow_steps_on_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_id" varchar;
  ALTER TABLE "workflow_steps_on_approval_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_title" varchar;
  ALTER TABLE "workflow_steps_on_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_path" varchar;
  ALTER TABLE "workflow_steps_on_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_label" varchar;
  ALTER TABLE "workflow_steps_on_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_id" varchar;
  ALTER TABLE "workflow_steps_on_rejection_notifications" ADD COLUMN IF NOT EXISTS "form_field_form_title" varchar;
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "override_user_operator" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_approval_notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "workflow_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
  DROP TYPE IF EXISTS "public"."enum_workflow_approval_notifications_type";
  CREATE TYPE "public"."enum_workflow_approval_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee');
  ALTER TABLE "workflow_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_approval_notifications_type";
  ALTER TABLE "workflow_approval_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_approval_notifications_type" USING "type"::"public"."enum_workflow_approval_notifications_type";
  ALTER TABLE "workflow_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "workflow_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
  DROP TYPE IF EXISTS "public"."enum_workflow_rejection_notifications_type";
  CREATE TYPE "public"."enum_workflow_rejection_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee');
  ALTER TABLE "workflow_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_rejection_notifications_type";
  ALTER TABLE "workflow_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_rejection_notifications_type" USING "type"::"public"."enum_workflow_rejection_notifications_type";
  ALTER TABLE "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
  DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_reaching_notifications_type";
  CREATE TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee');
  ALTER TABLE "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_reaching_notifications_type";
  ALTER TABLE "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" USING "type"::"public"."enum_workflow_steps_on_reaching_notifications_type";
  ALTER TABLE "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
  DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_approval_notifications_type";
  CREATE TYPE "public"."enum_workflow_steps_on_approval_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee');
  ALTER TABLE "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_approval_notifications_type";
  ALTER TABLE "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_approval_notifications_type" USING "type"::"public"."enum_workflow_steps_on_approval_notifications_type";
  ALTER TABLE "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
  DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_rejection_notifications_type";
  CREATE TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee');
  ALTER TABLE "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_rejection_notifications_type";
  ALTER TABLE "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" USING "type"::"public"."enum_workflow_steps_on_rejection_notifications_type";
  ALTER TABLE "workflow_approval_notifications" DROP COLUMN IF EXISTS "form_field_path";
  ALTER TABLE "workflow_approval_notifications" DROP COLUMN IF EXISTS "form_field_label";
  ALTER TABLE "workflow_approval_notifications" DROP COLUMN IF EXISTS "form_field_form_id";
  ALTER TABLE "workflow_approval_notifications" DROP COLUMN IF EXISTS "form_field_form_title";
  ALTER TABLE "workflow_rejection_notifications" DROP COLUMN IF EXISTS "form_field_path";
  ALTER TABLE "workflow_rejection_notifications" DROP COLUMN IF EXISTS "form_field_label";
  ALTER TABLE "workflow_rejection_notifications" DROP COLUMN IF EXISTS "form_field_form_id";
  ALTER TABLE "workflow_rejection_notifications" DROP COLUMN IF EXISTS "form_field_form_title";
  ALTER TABLE "workflow_steps_on_reaching_notifications" DROP COLUMN IF EXISTS "form_field_path";
  ALTER TABLE "workflow_steps_on_reaching_notifications" DROP COLUMN IF EXISTS "form_field_label";
  ALTER TABLE "workflow_steps_on_reaching_notifications" DROP COLUMN IF EXISTS "form_field_form_id";
  ALTER TABLE "workflow_steps_on_reaching_notifications" DROP COLUMN IF EXISTS "form_field_form_title";
  ALTER TABLE "workflow_steps_on_approval_notifications" DROP COLUMN IF EXISTS "form_field_path";
  ALTER TABLE "workflow_steps_on_approval_notifications" DROP COLUMN IF EXISTS "form_field_label";
  ALTER TABLE "workflow_steps_on_approval_notifications" DROP COLUMN IF EXISTS "form_field_form_id";
  ALTER TABLE "workflow_steps_on_approval_notifications" DROP COLUMN IF EXISTS "form_field_form_title";
  ALTER TABLE "workflow_steps_on_rejection_notifications" DROP COLUMN IF EXISTS "form_field_path";
  ALTER TABLE "workflow_steps_on_rejection_notifications" DROP COLUMN IF EXISTS "form_field_label";
  ALTER TABLE "workflow_steps_on_rejection_notifications" DROP COLUMN IF EXISTS "form_field_form_id";
  ALTER TABLE "workflow_steps_on_rejection_notifications" DROP COLUMN IF EXISTS "form_field_form_title";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "override_user_operator";`)
}
