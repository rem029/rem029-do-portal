import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_steps_additional_emails_type') THEN
        CREATE TYPE "public"."enum_workflow_steps_additional_emails_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_warnings_workflow_reviews_response') THEN
        CREATE TYPE "public"."enum_warnings_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_warnings_workflow_status') THEN
        CREATE TYPE "public"."enum_warnings_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__warnings_v_version_workflow_reviews_response') THEN
        CREATE TYPE "public"."enum__warnings_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__warnings_v_version_workflow_status') THEN
        CREATE TYPE "public"."enum__warnings_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "warnings_workflow_reviews" (
    	"_order" integer NOT NULL,
    	"_parent_id" uuid NOT NULL,
    	"id" varchar PRIMARY KEY NOT NULL,
    	"label" varchar,
    	"comments" varchar,
    	"reviewer" varchar,
    	"status_slug" varchar,
    	"response" "enum_warnings_workflow_reviews_response",
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
    	"reject_label" varchar DEFAULT 'Reject'
    );
    
    CREATE TABLE IF NOT EXISTS "warnings" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"override_department" boolean DEFAULT false,
    	"employee_department_id" uuid,
    	"employee_id" uuid NOT NULL,
    	"bypass_day_restriction" boolean DEFAULT false,
    	"subject" varchar NOT NULL,
    	"description" jsonb NOT NULL,
    	"attachments_id" uuid,
    	"wants_to_sign" boolean DEFAULT false,
    	"requestor_signature" varchar,
    	"workflow_status" "enum_warnings_workflow_status" DEFAULT 'draft',
    	"_workflow_status" varchar DEFAULT 'draft',
    	"operator_id" uuid,
    	"created_by_id" uuid,
    	"updated_by_id" uuid,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "warnings_rels" (
    	"id" serial PRIMARY KEY NOT NULL,
    	"order" integer,
    	"parent_id" uuid NOT NULL,
    	"path" varchar NOT NULL,
    	"internal_media_id" uuid
    );
    
    CREATE TABLE IF NOT EXISTS "_warnings_v_version_workflow_reviews" (
    	"_order" integer NOT NULL,
    	"_parent_id" uuid NOT NULL,
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"label" varchar,
    	"comments" varchar,
    	"reviewer" varchar,
    	"status_slug" varchar,
    	"response" "enum__warnings_v_version_workflow_reviews_response",
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
    	"_uuid" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "_warnings_v" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"parent_id" uuid,
    	"version_override_department" boolean DEFAULT false,
    	"version_employee_department_id" uuid,
    	"version_employee_id" uuid NOT NULL,
    	"version_bypass_day_restriction" boolean DEFAULT false,
    	"version_subject" varchar NOT NULL,
    	"version_description" jsonb NOT NULL,
    	"version_attachments_id" uuid,
    	"version_wants_to_sign" boolean DEFAULT false,
    	"version_requestor_signature" varchar,
    	"version_workflow_status" "enum__warnings_v_version_workflow_status" DEFAULT 'draft',
    	"version__workflow_status" varchar DEFAULT 'draft',
    	"version_operator_id" uuid,
    	"version_created_by_id" uuid,
    	"version_updated_by_id" uuid,
    	"version_updated_at" timestamp(3) with time zone,
    	"version_created_at" timestamp(3) with time zone,
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "_warnings_v_rels" (
    	"id" serial PRIMARY KEY NOT NULL,
    	"order" integer,
    	"parent_id" uuid NOT NULL,
    	"path" varchar NOT NULL,
    	"internal_media_id" uuid
    );
    
    CREATE TABLE IF NOT EXISTS "warnings_settings" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"workflow_slug" varchar,
    	"cutoff_day" numeric DEFAULT 15 NOT NULL,
    	"header_image_id" uuid,
    	"footer_image_id" uuid,
    	"docx_template_id" uuid,
    	"created_by_id" uuid,
    	"updated_by_id" uuid,
    	"updated_at" timestamp(3) with time zone,
    	"created_at" timestamp(3) with time zone
    );
    
    ALTER TABLE IF EXISTS "workflow_steps_additional_emails" ALTER COLUMN "email" DROP NOT NULL;
    
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps_additional_emails' AND column_name='type') THEN
        ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN "type" "enum_workflow_steps_additional_emails_type" DEFAULT 'email';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps_additional_emails' AND column_name='department_id') THEN
        ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN "department_id" uuid;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='enable_comment') THEN
        ALTER TABLE "workflow_steps" ADD COLUMN "enable_comment" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='enable_signature') THEN
        ALTER TABLE "workflow_steps" ADD COLUMN "enable_signature" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='attachment_label') THEN
        ALTER TABLE "workflow_steps" ADD COLUMN "attachment_label" varchar;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='enable_comment') THEN
        ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "enable_comment" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='enable_signature') THEN
        ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "enable_signature" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='attachment_label') THEN
        ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "attachment_label" varchar;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='enable_comment') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "enable_comment" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='enable_signature') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "enable_signature" boolean DEFAULT true;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='attachment_label') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "attachment_label" varchar;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='warnings_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "warnings_id" uuid;
      END IF;
    END $$;

    -- Add constraints (using drop + add pattern for simplicity within DO block if needed, but here using direct pattern if possible)
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_workflow_reviews_parent_id_fk') THEN
        ALTER TABLE "warnings_workflow_reviews" ADD CONSTRAINT "warnings_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."warnings"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_employee_department_id_departments_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_employee_id_users_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_attachments_id_internal_media_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_operator_id_operators_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_created_by_id_users_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_updated_by_id_users_id_fk') THEN
        ALTER TABLE "warnings" ADD CONSTRAINT "warnings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_rels_parent_fk') THEN
        ALTER TABLE "warnings_rels" ADD CONSTRAINT "warnings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."warnings"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_rels_internal_media_fk') THEN
        ALTER TABLE "warnings_rels" ADD CONSTRAINT "warnings_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_workflow_reviews_parent_id_fk') THEN
        ALTER TABLE "_warnings_v_version_workflow_reviews" ADD CONSTRAINT "_warnings_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_warnings_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_parent_id_warnings_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_parent_id_warnings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."warnings"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_employee_department_id_departments_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_employee_id_users_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_employee_id_users_id_fk" FOREIGN KEY ("version_employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_attachments_id_internal_media_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_warnings_v" ADD CONSTRAINT "_warnings_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_rels_parent_fk') THEN
        ALTER TABLE "_warnings_v_rels" ADD CONSTRAINT "_warnings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_warnings_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_warnings_v_rels_internal_media_fk') THEN
        ALTER TABLE "_warnings_v_rels" ADD CONSTRAINT "_warnings_v_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_settings_header_image_id_internal_media_id_fk') THEN
        ALTER TABLE "warnings_settings" ADD CONSTRAINT "warnings_settings_header_image_id_internal_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_settings_footer_image_id_internal_media_id_fk') THEN
        ALTER TABLE "warnings_settings" ADD CONSTRAINT "warnings_settings_footer_image_id_internal_media_id_fk" FOREIGN KEY ("footer_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_settings_docx_template_id_internal_media_id_fk') THEN
        ALTER TABLE "warnings_settings" ADD CONSTRAINT "warnings_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_settings_created_by_id_users_id_fk') THEN
        ALTER TABLE "warnings_settings" ADD CONSTRAINT "warnings_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='warnings_settings_updated_by_id_users_id_fk') THEN
        ALTER TABLE "warnings_settings" ADD CONSTRAINT "warnings_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='workflow_steps_additional_emails_department_id_departments_id_fk') THEN
        ALTER TABLE "workflow_steps_additional_emails" ADD CONSTRAINT "workflow_steps_additional_emails_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payload_locked_documents_rels_warnings_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_warnings_fk" FOREIGN KEY ("warnings_id") REFERENCES "public"."warnings"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "warnings_workflow_reviews_order_idx" ON "warnings_workflow_reviews" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "warnings_workflow_reviews_parent_id_idx" ON "warnings_workflow_reviews" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "warnings_employee_department_idx" ON "warnings" USING btree ("employee_department_id");
    CREATE INDEX IF NOT EXISTS "warnings_employee_idx" ON "warnings" USING btree ("employee_id");
    CREATE INDEX IF NOT EXISTS "warnings_attachments_idx" ON "warnings" USING btree ("attachments_id");
    CREATE INDEX IF NOT EXISTS "warnings_operator_idx" ON "warnings" USING btree ("operator_id");
    CREATE INDEX IF NOT EXISTS "warnings_created_by_idx" ON "warnings" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "warnings_updated_by_idx" ON "warnings" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "warnings_updated_at_idx" ON "warnings" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "warnings_created_at_idx" ON "warnings" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "warnings_rels_order_idx" ON "warnings_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "warnings_rels_parent_idx" ON "warnings_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "warnings_rels_path_idx" ON "warnings_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "warnings_rels_internal_media_id_idx" ON "warnings_rels" USING btree ("internal_media_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_workflow_reviews_order_idx" ON "_warnings_v_version_workflow_reviews" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_workflow_reviews_parent_id_idx" ON "_warnings_v_version_workflow_reviews" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_parent_idx" ON "_warnings_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_employee_department_idx" ON "_warnings_v" USING btree ("version_employee_department_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_employee_idx" ON "_warnings_v" USING btree ("version_employee_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_attachments_idx" ON "_warnings_v" USING btree ("version_attachments_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_operator_idx" ON "_warnings_v" USING btree ("version_operator_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_created_by_idx" ON "_warnings_v" USING btree ("version_created_by_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_updated_by_idx" ON "_warnings_v" USING btree ("version_updated_by_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_updated_at_idx" ON "_warnings_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_warnings_v_version_version_created_at_idx" ON "_warnings_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_warnings_v_created_at_idx" ON "_warnings_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_warnings_v_updated_at_idx" ON "_warnings_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_warnings_v_rels_order_idx" ON "_warnings_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_warnings_v_rels_parent_idx" ON "_warnings_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_warnings_v_rels_path_idx" ON "_warnings_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_warnings_v_rels_internal_media_id_idx" ON "_warnings_v_rels" USING btree ("internal_media_id");
    CREATE INDEX IF NOT EXISTS "warnings_settings_header_image_idx" ON "warnings_settings" USING btree ("header_image_id");
    CREATE INDEX IF NOT EXISTS "warnings_settings_footer_image_idx" ON "warnings_settings" USING btree ("footer_image_id");
    CREATE INDEX IF NOT EXISTS "warnings_settings_docx_template_idx" ON "warnings_settings" USING btree ("docx_template_id");
    CREATE INDEX IF NOT EXISTS "warnings_settings_created_by_idx" ON "warnings_settings" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "warnings_settings_updated_by_idx" ON "warnings_settings" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "workflow_steps_additional_emails_department_idx" ON "workflow_steps_additional_emails" USING btree ("department_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_warnings_id_idx" ON "payload_locked_documents_rels" USING btree ("warnings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "warnings_workflow_reviews" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "warnings" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "warnings_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "_warnings_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "_warnings_v" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "_warnings_v_rels" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "warnings_settings" DISABLE ROW LEVEL SECURITY;

    DROP TABLE IF EXISTS "warnings_workflow_reviews" CASCADE;
    DROP TABLE IF EXISTS "warnings" CASCADE;
    DROP TABLE IF EXISTS "warnings_rels" CASCADE;
    DROP TABLE IF EXISTS "_warnings_v_version_workflow_reviews" CASCADE;
    DROP TABLE IF EXISTS "_warnings_v" CASCADE;
    DROP TABLE IF EXISTS "_warnings_v_rels" CASCADE;
    DROP TABLE IF EXISTS "warnings_settings" CASCADE;

    ALTER TABLE IF EXISTS "workflow_steps_additional_emails" DROP CONSTRAINT IF EXISTS "workflow_steps_additional_emails_department_id_departments_id_fk";
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_warnings_fk";
    
    DROP INDEX IF EXISTS "workflow_steps_additional_emails_department_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_warnings_id_idx";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps_additional_emails' AND column_name='email') THEN
        ALTER TABLE "workflow_steps_additional_emails" ALTER COLUMN "email" SET NOT NULL;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps_additional_emails' AND column_name='type') THEN
        ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "type";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps_additional_emails' AND column_name='department_id') THEN
        ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "department_id";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='enable_comment') THEN
        ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "enable_comment";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='enable_signature') THEN
        ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "enable_signature";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='attachment_label') THEN
        ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "attachment_label";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='enable_comment') THEN
        ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "enable_comment";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='enable_signature') THEN
        ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "enable_signature";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='attachment_label') THEN
        ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "attachment_label";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='enable_comment') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "enable_comment";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='enable_signature') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "enable_signature";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='attachment_label') THEN
        ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "attachment_label";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='warnings_id') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "warnings_id";
      END IF;
    END $$;

    DROP TYPE IF EXISTS "public"."enum_workflow_steps_additional_emails_type";
    DROP TYPE IF EXISTS "public"."enum_warnings_workflow_reviews_response";
    DROP TYPE IF EXISTS "public"."enum_warnings_workflow_status";
    DROP TYPE IF EXISTS "public"."enum__warnings_v_version_workflow_reviews_response";
    DROP TYPE IF EXISTS "public"."enum__warnings_v_version_workflow_status";`)
}
