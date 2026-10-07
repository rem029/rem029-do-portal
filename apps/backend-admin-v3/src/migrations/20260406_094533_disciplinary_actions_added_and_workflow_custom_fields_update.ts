import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_steps_custom_fields_type') THEN
      CREATE TYPE "public"."enum_workflow_steps_custom_fields_type" AS ENUM('text', 'number', 'select');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_steps_skip_condition_operator') THEN
      CREATE TYPE "public"."enum_workflow_steps_skip_condition_operator" AS ENUM('equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_disciplinary_actions_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum_disciplinary_actions_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected', 'skipped', 'auto_completed', 'acknowledged');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_disciplinary_actions_workflow_status') THEN
      CREATE TYPE "public"."enum_disciplinary_actions_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__disciplinary_actions_v_version_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum__disciplinary_actions_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected', 'skipped', 'auto_completed', 'acknowledged');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__disciplinary_actions_v_version_workflow_status') THEN
      CREATE TYPE "public"."enum__disciplinary_actions_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "workflow_steps_custom_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_steps_custom_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"type" "enum_workflow_steps_custom_fields_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"default_value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "disciplinary_actions_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_disciplinary_actions_workflow_reviews_response",
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
  	"additional_reviewer_tokens" jsonb,
  	"custom_fields_definition" jsonb,
  	"custom_field_responses" jsonb,
  	"skip_condition" jsonb
  );
  
  CREATE TABLE IF NOT EXISTS "disciplinary_actions" (
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
  	"workflow_status" "enum_disciplinary_actions_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "disciplinary_actions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_disciplinary_actions_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__disciplinary_actions_v_version_workflow_reviews_response",
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
  	"additional_reviewer_tokens" jsonb,
  	"custom_fields_definition" jsonb,
  	"custom_field_responses" jsonb,
  	"skip_condition" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_disciplinary_actions_v" (
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
  	"version_workflow_status" "enum__disciplinary_actions_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_disciplinary_actions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "disciplinary_actions_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"docx_template_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_enabled') THEN
      ALTER TABLE "workflow_steps" ADD COLUMN "skip_condition_enabled" boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_field_name') THEN
      ALTER TABLE "workflow_steps" ADD COLUMN "skip_condition_field_name" varchar;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_operator') THEN
      ALTER TABLE "workflow_steps" ADD COLUMN "skip_condition_operator" "enum_workflow_steps_skip_condition_operator" DEFAULT 'equals';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_value') THEN
      ALTER TABLE "workflow_steps" ADD COLUMN "skip_condition_value" varchar;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "warnings_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "warnings_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "warnings_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "notices_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "notices_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "notices_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='additional_reviewer_tokens') THEN
      ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN "additional_reviewer_tokens" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN "custom_fields_definition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN "custom_field_responses" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN "skip_condition" jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='disciplinary_actions_id') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "disciplinary_actions_id" uuid;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='workflow_steps_custom_fields_options_parent_id_fk') THEN
      ALTER TABLE "workflow_steps_custom_fields_options" ADD CONSTRAINT "workflow_steps_custom_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_steps_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='workflow_steps_custom_fields_parent_id_fk') THEN
      ALTER TABLE "workflow_steps_custom_fields" ADD CONSTRAINT "workflow_steps_custom_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_steps"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "disciplinary_actions_workflow_reviews" ADD CONSTRAINT "disciplinary_actions_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."disciplinary_actions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_employee_id_users_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_operator_id_operators_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_created_by_id_users_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_updated_by_id_users_id_fk') THEN
      ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_rels_parent_fk') THEN
      ALTER TABLE "disciplinary_actions_rels" ADD CONSTRAINT "disciplinary_actions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."disciplinary_actions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_rels_internal_media_fk') THEN
      ALTER TABLE "disciplinary_actions_rels" ADD CONSTRAINT "disciplinary_actions_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v_version_workflow_reviews" ADD CONSTRAINT "_disciplinary_actions_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_disciplinary_actions_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_parent_id_disciplinary_actions_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_parent_id_disciplinary_actions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."disciplinary_actions"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_employee_id_users_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_employee_id_users_id_fk" FOREIGN KEY ("version_employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_operator_id_operators_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_created_by_id_users_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_version_updated_by_id_users_id_fk') THEN
      ALTER TABLE "_disciplinary_actions_v" ADD CONSTRAINT "_disciplinary_actions_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_rels_parent_fk') THEN
      ALTER TABLE "_disciplinary_actions_v_rels" ADD CONSTRAINT "_disciplinary_actions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_disciplinary_actions_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='_disciplinary_actions_v_rels_internal_media_fk') THEN
      ALTER TABLE "_disciplinary_actions_v_rels" ADD CONSTRAINT "_disciplinary_actions_v_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_settings_docx_template_id_internal_media_id_fk') THEN
      ALTER TABLE "disciplinary_actions_settings" ADD CONSTRAINT "disciplinary_actions_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "disciplinary_actions_settings" ADD CONSTRAINT "disciplinary_actions_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='disciplinary_actions_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "disciplinary_actions_settings" ADD CONSTRAINT "disciplinary_actions_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payload_locked_documents_rels_disciplinary_actions_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_disciplinary_actions_fk" FOREIGN KEY ("disciplinary_actions_id") REFERENCES "public"."disciplinary_actions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_options_order_idx" ON "workflow_steps_custom_fields_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_options_parent_id_idx" ON "workflow_steps_custom_fields_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_order_idx" ON "workflow_steps_custom_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_parent_id_idx" ON "workflow_steps_custom_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_workflow_reviews_order_idx" ON "disciplinary_actions_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_workflow_reviews_parent_id_idx" ON "disciplinary_actions_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_employee_department_idx" ON "disciplinary_actions" USING btree ("employee_department_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_employee_idx" ON "disciplinary_actions" USING btree ("employee_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_attachments_idx" ON "disciplinary_actions" USING btree ("attachments_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_operator_idx" ON "disciplinary_actions" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_created_by_idx" ON "disciplinary_actions" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_updated_by_idx" ON "disciplinary_actions" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_updated_at_idx" ON "disciplinary_actions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_created_at_idx" ON "disciplinary_actions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_rels_order_idx" ON "disciplinary_actions_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_rels_parent_idx" ON "disciplinary_actions_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_rels_path_idx" ON "disciplinary_actions_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_rels_internal_media_id_idx" ON "disciplinary_actions_rels" USING btree ("internal_media_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_workflow_reviews_order_idx" ON "_disciplinary_actions_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_workflow_reviews_parent_id_idx" ON "_disciplinary_actions_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_parent_idx" ON "_disciplinary_actions_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_employee_departm_idx" ON "_disciplinary_actions_v" USING btree ("version_employee_department_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_employee_idx" ON "_disciplinary_actions_v" USING btree ("version_employee_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_attachments_idx" ON "_disciplinary_actions_v" USING btree ("version_attachments_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_operator_idx" ON "_disciplinary_actions_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_created_by_idx" ON "_disciplinary_actions_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_updated_by_idx" ON "_disciplinary_actions_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_updated_at_idx" ON "_disciplinary_actions_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_version_version_created_at_idx" ON "_disciplinary_actions_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_created_at_idx" ON "_disciplinary_actions_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_updated_at_idx" ON "_disciplinary_actions_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_rels_order_idx" ON "_disciplinary_actions_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_rels_parent_idx" ON "_disciplinary_actions_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_rels_path_idx" ON "_disciplinary_actions_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_disciplinary_actions_v_rels_internal_media_id_idx" ON "_disciplinary_actions_v_rels" USING btree ("internal_media_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_settings_docx_template_idx" ON "disciplinary_actions_settings" USING btree ("docx_template_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_settings_created_by_idx" ON "disciplinary_actions_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "disciplinary_actions_settings_updated_by_idx" ON "disciplinary_actions_settings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_disciplinary_actions_id_idx" ON "payload_locked_documents_rels" USING btree ("disciplinary_actions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps_custom_fields_options') THEN
      ALTER TABLE "workflow_steps_custom_fields_options" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps_custom_fields') THEN
      ALTER TABLE "workflow_steps_custom_fields" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_actions_workflow_reviews') THEN
      ALTER TABLE "disciplinary_actions_workflow_reviews" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_actions') THEN
      ALTER TABLE "disciplinary_actions" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_actions_rels') THEN
      ALTER TABLE "disciplinary_actions_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_disciplinary_actions_v_version_workflow_reviews') THEN
      ALTER TABLE "_disciplinary_actions_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_disciplinary_actions_v') THEN
      ALTER TABLE "_disciplinary_actions_v" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_disciplinary_actions_v_rels') THEN
      ALTER TABLE "_disciplinary_actions_v_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disciplinary_actions_settings') THEN
      ALTER TABLE "disciplinary_actions_settings" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;

  DROP TABLE IF EXISTS "workflow_steps_custom_fields_options" CASCADE;
  DROP TABLE IF EXISTS "workflow_steps_custom_fields" CASCADE;
  DROP TABLE IF EXISTS "disciplinary_actions_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "disciplinary_actions" CASCADE;
  DROP TABLE IF EXISTS "disciplinary_actions_rels" CASCADE;
  DROP TABLE IF EXISTS "_disciplinary_actions_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_disciplinary_actions_v" CASCADE;
  DROP TABLE IF EXISTS "_disciplinary_actions_v_rels" CASCADE;
  DROP TABLE IF EXISTS "disciplinary_actions_settings" CASCADE;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='payload_locked_documents_rels_disciplinary_actions_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_disciplinary_actions_fk";
    END IF;
  END $$;
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_disciplinary_actions_id_idx";

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_enabled') THEN
      ALTER TABLE "workflow_steps" DROP COLUMN "skip_condition_enabled";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_field_name') THEN
      ALTER TABLE "workflow_steps" DROP COLUMN "skip_condition_field_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_operator') THEN
      ALTER TABLE "workflow_steps" DROP COLUMN "skip_condition_operator";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workflow_steps' AND column_name='skip_condition_value') THEN
      ALTER TABLE "workflow_steps" DROP COLUMN "skip_condition_value";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sal_ded_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_sal_ded_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "warnings_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "warnings_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warnings_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "warnings_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_warnings_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "notices_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "notices_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notices_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "notices_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_notices_v_version_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "_notices_v_version_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='additional_reviewer_tokens') THEN
      ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN "additional_reviewer_tokens";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='custom_fields_definition') THEN
      ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN "custom_fields_definition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='custom_field_responses') THEN
      ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN "custom_field_responses";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_submissions_workflow_reviews' AND column_name='skip_condition') THEN
      ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN "skip_condition";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='disciplinary_actions_id') THEN
      ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "disciplinary_actions_id";
    END IF;
  END $$;

  DROP TYPE IF EXISTS "public"."enum_workflow_steps_custom_fields_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_steps_skip_condition_operator";
  DROP TYPE IF EXISTS "public"."enum_disciplinary_actions_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_disciplinary_actions_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__disciplinary_actions_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__disciplinary_actions_v_version_workflow_status";`)
}
