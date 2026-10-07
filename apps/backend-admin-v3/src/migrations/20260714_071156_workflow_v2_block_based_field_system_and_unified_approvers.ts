import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_workflow_v2_approval_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
   EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_rejection_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_blocks_select_options_related_type" AS ENUM('store_department', 'department', 'user', 'email');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_approvers_approver_type" AS ENUM('email', 'department', 'requestor_department', 'created_by', 'employee', 'document_department_field', 'form_field_email', 'workflow_field_email', 'store_department_field', 'workflow_custom_field_department');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_on_reaching_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_on_approval_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_on_rejection_notifications_type" AS ENUM('email', 'form_email', 'department', 'requestor_department', 'created_by', 'employee', 'document_field');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_skip_condition_source" AS ENUM('workflow_field', 'document_field');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_skip_condition_operator" AS ENUM('equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_v2_steps_rejection_policy" AS ENUM('end', 'previous', 'specific_step');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_instances_reviews_response" AS ENUM('pending', 'approved', 'acknowledged', 'rejected', 'skipped', 'auto_completed');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_instances_event_logs_type" AS ENUM('responded', 'auto_skipped', 'loop_back', 'completed', 'rejected', 'notification_sent', 'reassigned', 'blueprint_synced');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_workflow_instances_status" AS ENUM('pending', 'in_review', 'completed', 'rejected');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_forms_blocks_select_store_departments_variant" AS ENUM('default', 'label-on-top');
  EXCEPTION WHEN duplicate_object THEN null; END $$;
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
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"default_value" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_number" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"default_value" numeric,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_textarea" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"default_value" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_signature" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_file" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"related_type" "enum_workflow_v2_blocks_select_options_related_type",
  	"related_department_id" uuid,
  	"related_dept_id" uuid,
  	"related_user_id" uuid,
  	"related_email" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_operators" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"add_all" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_restaurants" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"add_all" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"add_all" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_store_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"add_all" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps_approvers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"approver_type" "enum_workflow_v2_steps_approvers_approver_type",
  	"approver_email" varchar,
  	"department_id" uuid,
  	"document_department_field_path" varchar,
  	"approver_form_field_path" varchar,
  	"approver_workflow_field_name" varchar,
  	"approver_store_department_field_path" varchar,
  	"approver_custom_field_name" varchar,
  	"approver_custom_field_step_slug" varchar
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
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_global_field_ref" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"global_field_name" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
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
  	"can_skip" boolean DEFAULT false,
  	"can_generate_wordfile" boolean DEFAULT false,
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
  
  CREATE TABLE IF NOT EXISTS "workflow_v2_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"operators_id" uuid,
  	"restaurants_id" uuid,
  	"departments_id" uuid,
  	"store_departments_id" uuid
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
  	"before_response_fields" jsonb,
  	"after_response_approved_fields" jsonb,
  	"after_response_rejected_fields" jsonb,
  	"after_response_acknowledged_fields" jsonb,
  	"field_responses" jsonb,
  	"additional_reviewer_tokens" jsonb,
  	"reviewer_tokens" jsonb,
  	"approver_form_field_path" varchar,
  	"approver_workflow_field_name" varchar,
  	"approver_custom_field_name" varchar,
  	"approver_custom_field_step_slug" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_instances_event_logs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_instances_event_logs_type",
  	"timestamp" timestamp(3) with time zone,
  	"actor" varchar,
  	"step_label" varchar,
  	"step_slug" varchar,
  	"details" jsonb
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
  	"notification_tokens" jsonb,
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
  
  CREATE TABLE IF NOT EXISTS "workflow_dashboard" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "use_workflow_v2" boolean DEFAULT false;
  ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "store_departments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "store_departments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workflow_v2_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "workflow_instances_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_approval_notifications" ADD CONSTRAINT "workflow_v2_approval_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_approval_notifications" ADD CONSTRAINT "workflow_v2_approval_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rejection_notifications" ADD CONSTRAINT "workflow_v2_rejection_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rejection_notifications" ADD CONSTRAINT "workflow_v2_rejection_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_text" ADD CONSTRAINT "workflow_v2_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_number" ADD CONSTRAINT "workflow_v2_blocks_number_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_textarea" ADD CONSTRAINT "workflow_v2_blocks_textarea_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_signature" ADD CONSTRAINT "workflow_v2_blocks_signature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_file" ADD CONSTRAINT "workflow_v2_blocks_file_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_options" ADD CONSTRAINT "workflow_v2_blocks_select_options_related_department_id_store_departments_id_fk" FOREIGN KEY ("related_department_id") REFERENCES "public"."store_departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_options" ADD CONSTRAINT "workflow_v2_blocks_select_options_related_dept_id_departments_id_fk" FOREIGN KEY ("related_dept_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_options" ADD CONSTRAINT "workflow_v2_blocks_select_options_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_options" ADD CONSTRAINT "workflow_v2_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select" ADD CONSTRAINT "workflow_v2_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_operators" ADD CONSTRAINT "workflow_v2_blocks_select_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_restaurants" ADD CONSTRAINT "workflow_v2_blocks_select_restaurants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_departments" ADD CONSTRAINT "workflow_v2_blocks_select_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_select_store_departments" ADD CONSTRAINT "workflow_v2_blocks_select_store_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_approvers" ADD CONSTRAINT "workflow_v2_steps_approvers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_approvers" ADD CONSTRAINT "workflow_v2_steps_approvers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_reaching_notifications" ADD CONSTRAINT "workflow_v2_steps_on_reaching_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_reaching_notifications" ADD CONSTRAINT "workflow_v2_steps_on_reaching_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_approval_notifications" ADD CONSTRAINT "workflow_v2_steps_on_approval_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_approval_notifications" ADD CONSTRAINT "workflow_v2_steps_on_approval_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_rejection_notifications" ADD CONSTRAINT "workflow_v2_steps_on_rejection_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps_on_rejection_notifications" ADD CONSTRAINT "workflow_v2_steps_on_rejection_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_global_field_ref" ADD CONSTRAINT "workflow_v2_blocks_global_field_ref_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_steps" ADD CONSTRAINT "workflow_v2_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2" ADD CONSTRAINT "workflow_v2_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_operators_fk" FOREIGN KEY ("operators_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_store_departments_fk" FOREIGN KEY ("store_departments_id") REFERENCES "public"."store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances_reviews" ADD CONSTRAINT "workflow_instances_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances_event_logs" ADD CONSTRAINT "workflow_instances_event_logs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_v2_id_workflow_v2_id_fk" FOREIGN KEY ("workflow_v2_id") REFERENCES "public"."workflow_v2"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_case_owner_id_users_id_fk" FOREIGN KEY ("case_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances_rels" ADD CONSTRAINT "workflow_instances_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_instances_rels" ADD CONSTRAINT "workflow_instances_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_select_store_departments" ADD CONSTRAINT "forms_blocks_select_store_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_select_store_departments_locales" ADD CONSTRAINT "forms_blocks_select_store_departments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "store_departments_manager_idx" ON "store_departments" USING btree ("manager_id");
  CREATE INDEX IF NOT EXISTS "store_departments_created_by_idx" ON "store_departments" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "store_departments_updated_by_idx" ON "store_departments" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "store_departments_slug_idx" ON "store_departments" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "store_departments_updated_at_idx" ON "store_departments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "store_departments_created_at_idx" ON "store_departments" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_order_idx" ON "workflow_v2_approval_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_parent_id_idx" ON "workflow_v2_approval_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_approval_notifications_department_idx" ON "workflow_v2_approval_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_order_idx" ON "workflow_v2_rejection_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_parent_id_idx" ON "workflow_v2_rejection_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rejection_notifications_department_idx" ON "workflow_v2_rejection_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_text_order_idx" ON "workflow_v2_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_text_parent_id_idx" ON "workflow_v2_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_text_path_idx" ON "workflow_v2_blocks_text" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_number_order_idx" ON "workflow_v2_blocks_number" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_number_parent_id_idx" ON "workflow_v2_blocks_number" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_number_path_idx" ON "workflow_v2_blocks_number" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_textarea_order_idx" ON "workflow_v2_blocks_textarea" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_textarea_parent_id_idx" ON "workflow_v2_blocks_textarea" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_textarea_path_idx" ON "workflow_v2_blocks_textarea" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_signature_order_idx" ON "workflow_v2_blocks_signature" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_signature_parent_id_idx" ON "workflow_v2_blocks_signature" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_signature_path_idx" ON "workflow_v2_blocks_signature" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_file_order_idx" ON "workflow_v2_blocks_file" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_file_parent_id_idx" ON "workflow_v2_blocks_file" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_file_path_idx" ON "workflow_v2_blocks_file" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_order_idx" ON "workflow_v2_blocks_select_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_parent_id_idx" ON "workflow_v2_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_related_department_idx" ON "workflow_v2_blocks_select_options" USING btree ("related_department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_related_dept_idx" ON "workflow_v2_blocks_select_options" USING btree ("related_dept_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_related_user_idx" ON "workflow_v2_blocks_select_options" USING btree ("related_user_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_order_idx" ON "workflow_v2_blocks_select" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_parent_id_idx" ON "workflow_v2_blocks_select" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_path_idx" ON "workflow_v2_blocks_select" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_operators_order_idx" ON "workflow_v2_blocks_select_operators" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_operators_parent_id_idx" ON "workflow_v2_blocks_select_operators" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_operators_path_idx" ON "workflow_v2_blocks_select_operators" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_restaurants_order_idx" ON "workflow_v2_blocks_select_restaurants" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_restaurants_parent_id_idx" ON "workflow_v2_blocks_select_restaurants" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_restaurants_path_idx" ON "workflow_v2_blocks_select_restaurants" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_departments_order_idx" ON "workflow_v2_blocks_select_departments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_departments_parent_id_idx" ON "workflow_v2_blocks_select_departments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_departments_path_idx" ON "workflow_v2_blocks_select_departments" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_store_departments_order_idx" ON "workflow_v2_blocks_select_store_departments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_store_departments_parent_id_idx" ON "workflow_v2_blocks_select_store_departments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_store_departments_path_idx" ON "workflow_v2_blocks_select_store_departments" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_approvers_order_idx" ON "workflow_v2_steps_approvers" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_approvers_parent_id_idx" ON "workflow_v2_steps_approvers" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_approvers_department_idx" ON "workflow_v2_steps_approvers" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_order_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_parent_id_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_reaching_notifications_department_idx" ON "workflow_v2_steps_on_reaching_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_order_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_parent_id_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_approval_notifications_department_idx" ON "workflow_v2_steps_on_approval_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_order_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_parent_id_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_on_rejection_notifications_department_idx" ON "workflow_v2_steps_on_rejection_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_global_field_ref_order_idx" ON "workflow_v2_blocks_global_field_ref" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_global_field_ref_parent_id_idx" ON "workflow_v2_blocks_global_field_ref" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_global_field_ref_path_idx" ON "workflow_v2_blocks_global_field_ref" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_order_idx" ON "workflow_v2_steps" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_steps_parent_id_idx" ON "workflow_v2_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "workflow_v2_steps_slug_idx" ON "workflow_v2_steps" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "workflow_v2_operator_idx" ON "workflow_v2" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_created_by_idx" ON "workflow_v2" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_updated_by_idx" ON "workflow_v2" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "workflow_v2_operator_slug_idx" ON "workflow_v2" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "workflow_v2_updated_at_idx" ON "workflow_v2" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "workflow_v2_created_at_idx" ON "workflow_v2" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_order_idx" ON "workflow_v2_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_parent_idx" ON "workflow_v2_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_path_idx" ON "workflow_v2_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_operators_id_idx" ON "workflow_v2_rels" USING btree ("operators_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_restaurants_id_idx" ON "workflow_v2_rels" USING btree ("restaurants_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_departments_id_idx" ON "workflow_v2_rels" USING btree ("departments_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_rels_store_departments_id_idx" ON "workflow_v2_rels" USING btree ("store_departments_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_reviews_order_idx" ON "workflow_instances_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_instances_reviews_parent_id_idx" ON "workflow_instances_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_instances_event_logs_order_idx" ON "workflow_instances_event_logs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_instances_event_logs_parent_id_idx" ON "workflow_instances_event_logs" USING btree ("_parent_id");
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
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_order_idx" ON "forms_blocks_select_store_departments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_parent_id_idx" ON "forms_blocks_select_store_departments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_path_idx" ON "forms_blocks_select_store_departments" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_store_departments_locales_locale_parent_" ON "forms_blocks_select_store_departments_locales" USING btree ("_locale","_parent_id");
  DO $$ BEGIN
   ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_store_departments_fk" FOREIGN KEY ("store_departments_id") REFERENCES "public"."store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_store_departments_fk" FOREIGN KEY ("store_departments_id") REFERENCES "public"."store_departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_v2_fk" FOREIGN KEY ("workflow_v2_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_instances_fk" FOREIGN KEY ("workflow_instances_id") REFERENCES "public"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "forms_rels_store_departments_id_idx" ON "forms_rels" USING btree ("store_departments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_store_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("store_departments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workflow_v2_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_v2_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_workflow_instances_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_instances_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "store_departments" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_approval_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_rejection_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_number" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_textarea" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_signature" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_file" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select_options" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select_operators" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select_restaurants" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select_departments" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_select_store_departments" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_approvers" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_reaching_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_approval_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps_on_rejection_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_global_field_ref" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_steps" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_rels" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances_reviews" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances_event_logs" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances" CASCADE;
  DROP TABLE IF EXISTS "workflow_instances_rels" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_select_store_departments" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_select_store_departments_locales" CASCADE;
  DROP TABLE IF EXISTS "workflow_dashboard" CASCADE;
  ALTER TABLE "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_store_departments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_store_departments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_workflow_v2_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_workflow_instances_fk";
  
  DROP INDEX IF EXISTS "forms_rels_store_departments_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_store_departments_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_workflow_v2_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_workflow_instances_id_idx";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "use_workflow_v2";
  ALTER TABLE "forms_rels" DROP COLUMN IF EXISTS "store_departments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "store_departments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workflow_v2_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "workflow_instances_id";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_approval_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_rejection_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_blocks_select_options_related_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_approvers_approver_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_reaching_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_approval_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_on_rejection_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_skip_condition_source";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_skip_condition_operator";
  DROP TYPE IF EXISTS "public"."enum_workflow_v2_steps_rejection_policy";
  DROP TYPE IF EXISTS "public"."enum_workflow_instances_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_workflow_instances_event_logs_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_instances_status";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_store_departments_variant";`)
}
