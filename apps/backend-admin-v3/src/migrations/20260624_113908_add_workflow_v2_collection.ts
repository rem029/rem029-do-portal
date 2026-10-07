import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_approval_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_rejection_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_global_custom_fields_type" AS ENUM('text', 'number', 'select');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_additional_approvers_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_custom_fields_type" AS ENUM('text', 'number', 'select');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_on_reaching_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_on_approval_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_on_rejection_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_skip_condition_source" AS ENUM('workflow_field', 'document_field');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_skip_condition_operator" AS ENUM('equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_steps_rejection_policy" AS ENUM('end', 'previous', 'specific_step');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_instances_reviews_response" AS ENUM('pending', 'approved', 'acknowledged', 'rejected', 'skipped', 'auto_completed');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_instances_status" AS ENUM('pending', 'in_review', 'completed', 'rejected');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "workflow_v2_approval_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_v2_approval_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"document_field_path" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_rejection_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_v2_rejection_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"document_field_path" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_global_custom_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_global_custom_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"type" "enum_workflow_v2_global_custom_fields_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"default_value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_additional_approvers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"approver_type" "enum_workflow_v2_steps_additional_approvers_approver_type",
  	"approver_email" varchar,
  	"department_id" uuid,
  	"document_department_field_path" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_selected_global_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_name" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_custom_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_custom_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"type" "enum_workflow_v2_steps_custom_fields_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"default_value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_v2_steps_on_reaching_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"document_field_path" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_on_approval_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_v2_steps_on_approval_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"document_field_path" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_v2_steps_on_rejection_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"document_field_path" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"approver_type" "enum_workflow_v2_steps_approver_type",
  	"approver_email" varchar,
  	"department_id" uuid,
  	"document_department_field_path" varchar,
  	"final_approval" boolean DEFAULT false,
  	"auto_complete" boolean DEFAULT false,
  	"skip_condition_enabled" boolean DEFAULT false,
  	"skip_condition_source" "enum_workflow_v2_steps_skip_condition_source" DEFAULT 'workflow_field',
  	"skip_condition_field_name" varchar,
  	"skip_condition_operator" "enum_workflow_v2_steps_skip_condition_operator" DEFAULT 'equals',
  	"skip_condition_value" varchar,
  	"rejection_policy" "enum_workflow_v2_steps_rejection_policy" DEFAULT 'end',
  	"rejection_target_step" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar,
  	"can_acknowledge" boolean DEFAULT false,
  	"can_approve" boolean DEFAULT true,
  	"can_reject" boolean DEFAULT true,
  	"can_attach" boolean DEFAULT false,
  	"can_skip" boolean DEFAULT false,
  	"can_generate_wordfile" boolean DEFAULT false,
  	"enable_comment" boolean DEFAULT true,
  	"enable_signature" boolean DEFAULT true,
  	"attachment_label" varchar,
  	"acknowledge_label" varchar DEFAULT 'Acknowledge',
  	"approve_label" varchar DEFAULT 'Approve',
  	"reject_label" varchar DEFAULT 'Reject',
  	"skip_label" varchar DEFAULT 'Skip'
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"operator_id" uuid NOT NULL,
  	"notify_on_complete" boolean DEFAULT true,
  	"notify_on_update" boolean DEFAULT true,
  	"notify_on_reject" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"slug" varchar NOT NULL,
  	"operator_slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_instances_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"status_slug" varchar,
  	"iteration" numeric DEFAULT 1,
  	"response" "enum_workflow_instances_reviews_response" DEFAULT 'pending',
  	"reviewer" varchar,
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"comments" varchar,
  	"signature" varchar,
  	"approver_type" varchar,
  	"can_acknowledge" boolean DEFAULT false,
  	"can_approve" boolean DEFAULT true,
  	"can_reject" boolean DEFAULT true,
  	"can_attach" boolean DEFAULT false,
  	"can_skip" boolean DEFAULT false,
  	"can_generate_wordfile" boolean DEFAULT false,
  	"enable_comment" boolean DEFAULT true,
  	"enable_signature" boolean DEFAULT true,
  	"auto_complete" boolean DEFAULT false,
  	"token" varchar,
  	"acknowledge_label" varchar DEFAULT 'Acknowledge',
  	"approve_label" varchar DEFAULT 'Approve',
  	"reject_label" varchar DEFAULT 'Reject',
  	"skip_label" varchar DEFAULT 'Skip',
  	"attachment_label" varchar,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar,
  	"skip_condition" jsonb,
  	"rejection_policy" varchar,
  	"rejection_target_step" varchar,
  	"custom_fields_definition" jsonb,
  	"custom_field_responses" jsonb,
  	"additional_reviewer_tokens" jsonb
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_instances" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"operator_id" uuid NOT NULL,
  	"workflow_v2_id" uuid NOT NULL,
  	"document_collection" varchar NOT NULL,
  	"document_id" varchar NOT NULL,
  	"status" "enum_workflow_instances_status" DEFAULT 'pending' NOT NULL,
  	"current_step" varchar,
  	"current_step_label" varchar,
  	"case_owner_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"operator_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_instances_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "use_workflow_v2" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workflow_v2_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workflow_instances_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_approval_notifications" ADD CONSTRAINT "workflow_v2_approval_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_approval_notifications" ADD CONSTRAINT "workflow_v2_approval_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_rejection_notifications" ADD CONSTRAINT "workflow_v2_rejection_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_rejection_notifications" ADD CONSTRAINT "workflow_v2_rejection_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_global_custom_fields_options" ADD CONSTRAINT "workflow_v2_global_custom_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_global_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_global_custom_fields" ADD CONSTRAINT "workflow_v2_global_custom_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_additional_approvers" ADD CONSTRAINT "workflow_v2_steps_additional_approvers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_additional_approvers" ADD CONSTRAINT "workflow_v2_steps_additional_approvers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_selected_global_fields" ADD CONSTRAINT "workflow_v2_steps_selected_global_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_custom_fields_options" ADD CONSTRAINT "workflow_v2_steps_custom_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_custom_fields" ADD CONSTRAINT "workflow_v2_steps_custom_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_reaching_notifications" ADD CONSTRAINT "workflow_v2_steps_on_reaching_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_reaching_notifications" ADD CONSTRAINT "workflow_v2_steps_on_reaching_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_approval_notifications" ADD CONSTRAINT "workflow_v2_steps_on_approval_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_approval_notifications" ADD CONSTRAINT "workflow_v2_steps_on_approval_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_rejection_notifications" ADD CONSTRAINT "workflow_v2_steps_on_rejection_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps_on_rejection_notifications" ADD CONSTRAINT "workflow_v2_steps_on_rejection_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps" ADD CONSTRAINT "workflow_v2_steps_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2_steps" ADD CONSTRAINT "workflow_v2_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances_reviews" ADD CONSTRAINT "workflow_instances_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_v2_id_workflow_v2_id_fk" FOREIGN KEY ("workflow_v2_id") REFERENCES "public"."workflow_v2"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_case_owner_id_users_id_fk" FOREIGN KEY ("case_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances_rels" ADD CONSTRAINT "workflow_instances_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "workflow_instances_rels" ADD CONSTRAINT "workflow_instances_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_order_idx" ON "workflow_v2_approval_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_parent_id_idx" ON "workflow_v2_approval_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_department_idx" ON "workflow_v2_approval_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_order_idx" ON "workflow_v2_rejection_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_parent_id_idx" ON "workflow_v2_rejection_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_department_idx" ON "workflow_v2_rejection_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_options_order_idx" ON "workflow_v2_global_custom_fields_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_options_parent_id_idx" ON "workflow_v2_global_custom_fields_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_order_idx" ON "workflow_v2_global_custom_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_global_custom_fields_parent_id_idx" ON "workflow_v2_global_custom_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_additional_approvers_order_idx" ON "workflow_v2_steps_additional_approvers" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_additional_approvers_parent_id_idx" ON "workflow_v2_steps_additional_approvers" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_additional_approvers_department_idx" ON "workflow_v2_steps_additional_approvers" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_selected_global_fields_order_idx" ON "workflow_v2_steps_selected_global_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_selected_global_fields_parent_id_idx" ON "workflow_v2_steps_selected_global_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_options_order_idx" ON "workflow_v2_steps_custom_fields_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_options_parent_id_idx" ON "workflow_v2_steps_custom_fields_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_order_idx" ON "workflow_v2_steps_custom_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_custom_fields_parent_id_idx" ON "workflow_v2_steps_custom_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_order_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_parent_id_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_department_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_order_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_parent_id_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_department_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_order_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_parent_id_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_department_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_order_idx" ON "workflow_v2_steps" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_parent_id_idx" ON "workflow_v2_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "workflow_v2_steps_slug_idx" ON "workflow_v2_steps" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_department_idx" ON "workflow_v2_steps" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_operator_idx" ON "workflow_v2" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_created_by_idx" ON "workflow_v2" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_updated_by_idx" ON "workflow_v2" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "workflow_v2_operator_slug_idx" ON "workflow_v2" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "workflow_v2_updated_at_idx" ON "workflow_v2" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "workflow_v2_created_at_idx" ON "workflow_v2" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "workflow_instances_reviews_order_idx" ON "workflow_instances_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_instances_reviews_parent_id_idx" ON "workflow_instances_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_operator_idx" ON "workflow_instances" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_workflow_v2_idx" ON "workflow_instances" USING btree ("workflow_v2_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_case_owner_idx" ON "workflow_instances" USING btree ("case_owner_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_created_by_idx" ON "workflow_instances" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_updated_by_idx" ON "workflow_instances" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_updated_at_idx" ON "workflow_instances" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "workflow_instances_created_at_idx" ON "workflow_instances" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "workflow_instances_rels_order_idx" ON "workflow_instances_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "workflow_instances_rels_parent_idx" ON "workflow_instances_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_rels_path_idx" ON "workflow_instances_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "workflow_instances_rels_internal_media_id_idx" ON "workflow_instances_rels" USING btree ("internal_media_id");

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_v2_fk" FOREIGN KEY ("workflow_v2_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_instances_fk" FOREIGN KEY ("workflow_instances_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workflow_v2_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_v2_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workflow_instances_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_instances_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "workflow_v2_approval_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_rejection_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_global_custom_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_global_custom_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_additional_approvers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_selected_global_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_custom_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_custom_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_on_reaching_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_on_approval_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps_on_rejection_notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_v2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_instances_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_instances" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "workflow_instances_rels" DISABLE ROW LEVEL SECURITY;

  DROP TABLE IF EXISTS "workflow_v2_approval_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_rejection_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_global_custom_fields_options" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_global_custom_fields" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_additional_approvers" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_selected_global_fields" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_custom_fields_options" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_custom_fields" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_reaching_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_approval_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_rejection_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances_reviews" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances_rels" CASCADE;

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_workflow_v2_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_workflow_instances_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_workflow_v2_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_workflow_instances_id_idx";

  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "use_workflow_v2";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workflow_v2_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workflow_instances_id";

  DROP TYPE IF EXISTS "public"."enum_workflow_v2_approval_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_rejection_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_global_custom_fields_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_additional_approvers_approver_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_custom_fields_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_reaching_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_approval_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_rejection_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_approver_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_skip_condition_source";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_skip_condition_operator";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_rejection_policy";
  DROP TYPE IF EXISTS "public"."enum_workflow_instances_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_workflow_instances_status";`)
}
