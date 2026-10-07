import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Create enum for store-departments form block variant
  DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_select_store_departments_variant" AS ENUM('default', 'label-on-top');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  -- Add new approver type values to existing enums
  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" ADD VALUE 'form_field_email';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" ADD VALUE 'workflow_field_email';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" ADD VALUE 'store_department_field';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_approver_type" ADD VALUE 'form_field_email';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_approver_type" ADD VALUE 'workflow_field_email';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_steps_approver_type" ADD VALUE 'store_department_field';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  -- Create store_departments table
  CREATE TABLE IF NOT EXISTS "store_departments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar NOT NULL,
    "manager_id" uuid,
    "created_by_id" uuid,
    "updated_by_id" uuid,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  -- Create form block tables for select-store-departments
  CREATE TABLE IF NOT EXISTS "forms_blocks_select_store_departments" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "width" numeric,
    "variant" "enum_forms_blocks_select_store_departments_variant" DEFAULT 'default',
    "required" boolean DEFAULT false,
    "add_all" boolean DEFAULT false,
    "block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_select_store_departments_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  -- Add new columns to workflow tables
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approver_form_field_path" varchar;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approver_workflow_field_name" varchar;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approver_store_department_field_path" varchar;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_acknowledge" boolean DEFAULT false;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_approve" boolean DEFAULT true;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_reject" boolean DEFAULT true;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_attach" boolean DEFAULT false;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_skip" boolean DEFAULT false;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "can_generate_wordfile" boolean DEFAULT false;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "enable_comment" boolean DEFAULT true;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "enable_signature" boolean DEFAULT true;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "attachment_label" varchar;
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "acknowledge_label" varchar DEFAULT 'Acknowledge';
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "approve_label" varchar DEFAULT 'Approve';
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "reject_label" varchar DEFAULT 'Reject';
  ALTER TABLE "workflow_v2_steps_additional_approvers" ADD COLUMN IF NOT EXISTS "skip_label" varchar DEFAULT 'Skip';
  ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_form_field_path" varchar;
  ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_workflow_field_name" varchar;
  ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_store_department_field_path" varchar;
  ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "approver_form_field_path" varchar;
  ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "approver_workflow_field_name" varchar;
  ALTER TABLE "workflow_instances" ADD COLUMN IF NOT EXISTS "notification_tokens" jsonb;
  ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "store_departments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "store_departments_id" uuid;

  -- Add foreign key constraints
  DO $$ BEGIN
    ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_select_store_departments" ADD CONSTRAINT "forms_blocks_select_store_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_select_store_departments_locales" ADD CONSTRAINT "forms_blocks_select_store_departments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_store_departments_fk" FOREIGN KEY ("store_departments_id") REFERENCES "public"."store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_store_departments_fk" FOREIGN KEY ("store_departments_id") REFERENCES "public"."store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  -- Create indexes
  CREATE INDEX IF NOT EXISTS "store_departments_manager_idx" ON "store_departments" USING btree ("manager_id");
  CREATE INDEX IF NOT EXISTS "store_departments_created_by_idx" ON "store_departments" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "store_departments_updated_by_idx" ON "store_departments" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "store_departments_slug_idx" ON "store_departments" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "store_departments_updated_at_idx" ON "store_departments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "store_departments_created_at_idx" ON "store_departments" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_order_idx" ON "forms_blocks_select_store_departments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_parent_id_idx" ON "forms_blocks_select_store_departments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_path_idx" ON "forms_blocks_select_store_departments" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_locales_locale_parent_" ON "forms_blocks_select_store_departments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_rels_store_departments_id_idx" ON "forms_rels" USING btree ("store_departments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_store_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("store_departments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "store_departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_select_store_departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_select_store_departments_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "store_departments" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_select_store_departments" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_select_store_departments_locales" CASCADE;
  ALTER TABLE "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_store_departments_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_store_departments_fk";
  ALTER TABLE "workflow_v2_steps_additional_approvers" ALTER COLUMN "approver_type" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_additional_approvers_approver_type";
  CREATE TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field');
  ALTER TABLE "workflow_v2_steps_additional_approvers" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" USING "approver_type"::"public"."enum_workflow_v2_steps_additional_approvers_approver_type";
  ALTER TABLE "workflow_v2_steps" ALTER COLUMN "approver_type" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_approver_type";
  CREATE TYPE "public"."enum_workflow_v2_steps_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field');
  ALTER TABLE "workflow_v2_steps" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_v2_steps_approver_type" USING "approver_type"::"public"."enum_workflow_v2_steps_approver_type";
  DROP INDEX IF EXISTS "forms_rels_store_departments_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_store_departments_id_idx";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approver_form_field_path";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approver_workflow_field_name";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approver_store_department_field_path";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_acknowledge";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_approve";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_reject";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_attach";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_skip";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "can_generate_wordfile";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "enable_comment";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "enable_signature";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "attachment_label";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "acknowledge_label";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "approve_label";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "reject_label";
  ALTER TABLE "workflow_v2_steps_additional_approvers" DROP COLUMN IF EXISTS "skip_label";
  ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_form_field_path";
  ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_workflow_field_name";
  ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_store_department_field_path";
  ALTER TABLE "workflow_instances_reviews" DROP COLUMN IF EXISTS "approver_form_field_path";
  ALTER TABLE "workflow_instances_reviews" DROP COLUMN IF EXISTS "approver_workflow_field_name";
  ALTER TABLE "workflow_instances" DROP COLUMN IF EXISTS "notification_tokens";
  ALTER TABLE "forms_rels" DROP COLUMN IF EXISTS "store_departments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "store_departments_id";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_store_departments_variant";`)
}
