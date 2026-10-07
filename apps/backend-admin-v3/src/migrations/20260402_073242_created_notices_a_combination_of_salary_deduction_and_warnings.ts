import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notices_workflow_reviews_response') THEN
        CREATE TYPE "public"."enum_notices_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected', 'skipped', 'auto_completed', 'acknowledged');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notices_type') THEN
        CREATE TYPE "public"."enum_notices_type" AS ENUM('salary-deduction', 'warnings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notices_workflow_status') THEN
        CREATE TYPE "public"."enum_notices_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__notices_v_version_workflow_reviews_response') THEN
        CREATE TYPE "public"."enum__notices_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected', 'skipped', 'auto_completed', 'acknowledged');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__notices_v_version_type') THEN
        CREATE TYPE "public"."enum__notices_v_version_type" AS ENUM('salary-deduction', 'warnings');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__notices_v_version_workflow_status') THEN
        CREATE TYPE "public"."enum__notices_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
      END IF;
    END $$;

  CREATE TABLE IF NOT EXISTS "notices_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_notices_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"token" varchar,
  	"approver_type" varchar,
  	"can_acknowledge" boolean DEFAULT false,
  	"can_approve" boolean DEFAULT true,
  	"can_reject" boolean DEFAULT true,
  	"can_attach" boolean DEFAULT false,
  	"can_generate_wordfile" boolean DEFAULT false,
  	"enable_comment" boolean DEFAULT true,
  	"enable_signature" boolean DEFAULT true,
  	"attachment_label" varchar,
  	"acknowledge_label" varchar DEFAULT 'Acknowledge',
  	"approve_label" varchar DEFAULT 'Approve',
  	"reject_label" varchar DEFAULT 'Reject',
  	"auto_complete" boolean DEFAULT false,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"custom_email_text" varchar,
  	"hide_email_actions" boolean DEFAULT false
  );
  
  CREATE TABLE IF NOT EXISTS "notices" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"override_department" boolean DEFAULT false,
  	"employee_department_id" uuid,
  	"employee_id" uuid NOT NULL,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"type" "enum_notices_type" NOT NULL,
  	"subject" varchar NOT NULL,
  	"description" jsonb NOT NULL,
  	"days_deducted" numeric DEFAULT 0,
  	"attachments_id" uuid,
  	"wants_to_sign" boolean DEFAULT false,
  	"requestor_signature" varchar,
  	"workflow_status" "enum_notices_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "notices_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_notices_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__notices_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"token" varchar,
  	"approver_type" varchar,
  	"can_acknowledge" boolean DEFAULT false,
  	"can_approve" boolean DEFAULT true,
  	"can_reject" boolean DEFAULT true,
  	"can_attach" boolean DEFAULT false,
  	"can_generate_wordfile" boolean DEFAULT false,
  	"enable_comment" boolean DEFAULT true,
  	"enable_signature" boolean DEFAULT true,
  	"attachment_label" varchar,
  	"acknowledge_label" varchar DEFAULT 'Acknowledge',
  	"approve_label" varchar DEFAULT 'Approve',
  	"reject_label" varchar DEFAULT 'Reject',
  	"auto_complete" boolean DEFAULT false,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"custom_email_text" varchar,
  	"hide_email_actions" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_notices_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_override_department" boolean DEFAULT false,
  	"version_employee_department_id" uuid,
  	"version_employee_id" uuid NOT NULL,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_type" "enum__notices_v_version_type" NOT NULL,
  	"version_subject" varchar NOT NULL,
  	"version_description" jsonb NOT NULL,
  	"version_days_deducted" numeric DEFAULT 0,
  	"version_attachments_id" uuid,
  	"version_wants_to_sign" boolean DEFAULT false,
  	"version_requestor_signature" varchar,
  	"version_workflow_status" "enum__notices_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_notices_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "notices_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug_salary_deduction" varchar,
  	"workflow_slug_warnings" varchar,
  	"cutoff_day_salary_deduction" numeric DEFAULT 15 NOT NULL,
  	"cutoff_day_warnings" numeric DEFAULT 15 NOT NULL,
  	"docx_template_salary_deduction_id" uuid,
  	"docx_template_warnings_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "notices_id" uuid;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "notices_workflow_reviews" ADD CONSTRAINT "notices_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_employee_id_users_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_operator_id_operators_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_created_by_id_users_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_updated_by_id_users_id_fk') THEN
      ALTER TABLE "notices" ADD CONSTRAINT "notices_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_rels_parent_fk') THEN
      ALTER TABLE "notices_rels" ADD CONSTRAINT "notices_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_rels_internal_media_fk') THEN
      ALTER TABLE "notices_rels" ADD CONSTRAINT "notices_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" ADD CONSTRAINT "_notices_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notices_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_parent_id_notices_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_parent_id_notices_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notices"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_employee_id_users_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_employee_id_users_id_fk" FOREIGN KEY ("version_employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_operator_id_operators_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_created_by_id_users_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_version_updated_by_id_users_id_fk') THEN
      ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_rels_parent_fk') THEN
      ALTER TABLE "_notices_v_rels" ADD CONSTRAINT "_notices_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_notices_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_notices_v_rels_internal_media_fk') THEN
      ALTER TABLE "_notices_v_rels" ADD CONSTRAINT "_notices_v_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_settings_docx_template_salary_deduction_id_internal_media_id_fk') THEN
      ALTER TABLE "notices_settings" ADD CONSTRAINT "notices_settings_docx_template_salary_deduction_id_internal_media_id_fk" FOREIGN KEY ("docx_template_salary_deduction_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_settings_docx_template_warnings_id_internal_media_id_fk') THEN
      ALTER TABLE "notices_settings" ADD CONSTRAINT "notices_settings_docx_template_warnings_id_internal_media_id_fk" FOREIGN KEY ("docx_template_warnings_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "notices_settings" ADD CONSTRAINT "notices_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notices_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "notices_settings" ADD CONSTRAINT "notices_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "notices_workflow_reviews_order_idx" ON "notices_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "notices_workflow_reviews_parent_id_idx" ON "notices_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "notices_employee_department_idx" ON "notices" USING btree ("employee_department_id");
  CREATE INDEX IF NOT EXISTS "notices_employee_idx" ON "notices" USING btree ("employee_id");
  CREATE INDEX IF NOT EXISTS "notices_attachments_idx" ON "notices" USING btree ("attachments_id");
  CREATE INDEX IF NOT EXISTS "notices_operator_idx" ON "notices" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "notices_created_by_idx" ON "notices" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "notices_updated_by_idx" ON "notices" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "notices_updated_at_idx" ON "notices" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "notices_created_at_idx" ON "notices" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "notices_rels_order_idx" ON "notices_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "notices_rels_parent_idx" ON "notices_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "notices_rels_path_idx" ON "notices_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "notices_rels_internal_media_id_idx" ON "notices_rels" USING btree ("internal_media_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_workflow_reviews_order_idx" ON "_notices_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_workflow_reviews_parent_id_idx" ON "_notices_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_parent_idx" ON "_notices_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_employee_department_idx" ON "_notices_v" USING btree ("version_employee_department_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_employee_idx" ON "_notices_v" USING btree ("version_employee_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_attachments_idx" ON "_notices_v" USING btree ("version_attachments_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_operator_idx" ON "_notices_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_created_by_idx" ON "_notices_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_updated_by_idx" ON "_notices_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_updated_at_idx" ON "_notices_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_notices_v_version_version_created_at_idx" ON "_notices_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_notices_v_created_at_idx" ON "_notices_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_notices_v_updated_at_idx" ON "_notices_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_notices_v_rels_order_idx" ON "_notices_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_notices_v_rels_parent_idx" ON "_notices_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_notices_v_rels_path_idx" ON "_notices_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_notices_v_rels_internal_media_id_idx" ON "_notices_v_rels" USING btree ("internal_media_id");
  CREATE INDEX IF NOT EXISTS "notices_settings_docx_template_salary_deduction_idx" ON "notices_settings" USING btree ("docx_template_salary_deduction_id");
  CREATE INDEX IF NOT EXISTS "notices_settings_docx_template_warnings_idx" ON "notices_settings" USING btree ("docx_template_warnings_id");
  CREATE INDEX IF NOT EXISTS "notices_settings_created_by_idx" ON "notices_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "notices_settings_updated_by_idx" ON "notices_settings" USING btree ("updated_by_id");

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_notices_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notices_fk" FOREIGN KEY ("notices_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notices_id_idx" ON "payload_locked_documents_rels" USING btree ("notices_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notices_workflow_reviews') THEN
        ALTER TABLE "notices_workflow_reviews" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notices') THEN
        ALTER TABLE "notices" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notices_rels') THEN
        ALTER TABLE "notices_rels" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '_notices_v_version_workflow_reviews') THEN
        ALTER TABLE "_notices_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '_notices_v') THEN
        ALTER TABLE "_notices_v" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '_notices_v_rels') THEN
        ALTER TABLE "_notices_v_rels" DISABLE ROW LEVEL SECURITY;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notices_settings') THEN
        ALTER TABLE "notices_settings" DISABLE ROW LEVEL SECURITY;
      END IF;
    END $$;

  DROP TABLE IF EXISTS "notices_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "notices" CASCADE;
  DROP TABLE IF EXISTS "notices_rels" CASCADE;
  DROP TABLE IF EXISTS "_notices_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_notices_v" CASCADE;
  DROP TABLE IF EXISTS "_notices_v_rels" CASCADE;
  DROP TABLE IF EXISTS "notices_settings" CASCADE;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_notices_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notices_fk";
    END IF;
  END $$;
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_notices_id_idx";

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='notices_id') THEN
      ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notices_id";
    END IF;
  END $$;

  DROP TYPE IF EXISTS "public"."enum_notices_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_notices_type";
  DROP TYPE IF EXISTS "public"."enum_notices_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__notices_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__notices_v_version_type";
  DROP TYPE IF EXISTS "public"."enum__notices_v_version_workflow_status";
  `)
}
