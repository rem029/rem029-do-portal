import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "hr_requests_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "hr_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_hr_requests_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_hr_requests_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "bsn_just_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "bsn_just" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_bsn_just_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_bsn_just_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "hr_requests_settings_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "hr_requests_settings_allowed_requestors_on_behalf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "hr_requests_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "business_justifications_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "offer_letter_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "end_of_service_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_settings" DISABLE ROW LEVEL SECURITY;

  DROP TABLE IF EXISTS "hr_requests_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "hr_requests" CASCADE;
  DROP TABLE IF EXISTS "_hr_requests_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_hr_requests_v" CASCADE;
  DROP TABLE IF EXISTS "bsn_just_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "bsn_just" CASCADE;
  DROP TABLE IF EXISTS "_bsn_just_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_bsn_just_v" CASCADE;
  DROP TABLE IF EXISTS "hr_requests_settings_types" CASCADE;
  DROP TABLE IF EXISTS "hr_requests_settings_allowed_requestors_on_behalf" CASCADE;
  DROP TABLE IF EXISTS "hr_requests_settings" CASCADE;
  DROP TABLE IF EXISTS "business_justifications_settings" CASCADE;
  DROP TABLE IF EXISTS "offer_letter_settings" CASCADE;
  DROP TABLE IF EXISTS "end_of_service_settings" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_settings" CASCADE;

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hr_requests_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_business_justifications_fk";
  ALTER TABLE IF EXISTS "employee_history" DROP CONSTRAINT IF EXISTS "employee_history_created_by_id_users_id_fk";
  ALTER TABLE IF EXISTS "employee_history" DROP CONSTRAINT IF EXISTS "employee_history_updated_by_id_users_id_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_hr_requests_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_bsn_just_id_idx";
  DROP INDEX IF EXISTS "employee_history_created_by_idx";
  DROP INDEX IF EXISTS "employee_history_updated_by_idx";

  ALTER TABLE IF EXISTS "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "sal_ded" ADD COLUMN IF NOT EXISTS "days_deducted" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_days_deducted" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "offer_letter_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "offer_letter_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "end_of_service_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "end_of_service_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "recruitment_note_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "recruitment_note_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "token" varchar;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "approver_type" varchar;

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "hr_requests_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bsn_just_id";
  ALTER TABLE IF EXISTS "employee_history" DROP COLUMN IF EXISTS "created_by_id";
  ALTER TABLE IF EXISTS "employee_history" DROP COLUMN IF EXISTS "updated_by_id";

  DROP TYPE IF EXISTS "public"."enum_hr_requests_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_hr_requests_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__hr_requests_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__hr_requests_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_bsn_just_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_bsn_just_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__bsn_just_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__bsn_just_v_version_workflow_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_hr_requests_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum_hr_requests_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_hr_requests_workflow_status') THEN
      CREATE TYPE "public"."enum_hr_requests_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__hr_requests_v_version_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum__hr_requests_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__hr_requests_v_version_workflow_status') THEN
      CREATE TYPE "public"."enum__hr_requests_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_bsn_just_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum_bsn_just_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_bsn_just_workflow_status') THEN
      CREATE TYPE "public"."enum_bsn_just_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__bsn_just_v_version_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum__bsn_just_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__bsn_just_v_version_workflow_status') THEN
      CREATE TYPE "public"."enum__bsn_just_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
  END $$;
  CREATE TABLE IF NOT EXISTS "hr_requests_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_hr_requests_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "hr_requests" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"request_for_staff" boolean DEFAULT false,
  	"employee_name" varchar NOT NULL,
  	"employee_id" varchar NOT NULL,
  	"employee_designation" varchar NOT NULL,
  	"employee_department_id" uuid,
  	"employee_email" varchar,
  	"subject" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"attachments_id" uuid,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_hr_requests_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_hr_requests_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__hr_requests_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_hr_requests_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_request_for_staff" boolean DEFAULT false,
  	"version_employee_name" varchar NOT NULL,
  	"version_employee_id" varchar NOT NULL,
  	"version_employee_designation" varchar NOT NULL,
  	"version_employee_department_id" uuid,
  	"version_employee_email" varchar,
  	"version_subject" varchar NOT NULL,
  	"version_description" varchar NOT NULL,
  	"version_attachments_id" uuid,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__hr_requests_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bsn_just_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_bsn_just_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "bsn_just" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"employee_name" varchar NOT NULL,
  	"employee_id" varchar NOT NULL,
  	"employee_designation" varchar NOT NULL,
  	"employee_department_id" uuid NOT NULL,
  	"employee_email" varchar,
  	"doj" timestamp(3) with time zone,
  	"current_basic_salary" numeric NOT NULL,
  	"current_housing_allowance" numeric NOT NULL,
  	"current_transport_allowance" numeric NOT NULL,
  	"current_flexible_allowance" numeric NOT NULL,
  	"current_other_allowance" numeric NOT NULL,
  	"current_total" numeric NOT NULL,
  	"current_grade" numeric NOT NULL,
  	"proposed_basic_salary" numeric NOT NULL,
  	"proposed_housing_allowance" numeric NOT NULL,
  	"proposed_transport_allowance" numeric NOT NULL,
  	"proposed_flexible_allowance" numeric NOT NULL,
  	"proposed_other_allowance" numeric NOT NULL,
  	"proposed_total" numeric NOT NULL,
  	"proposed_grade" numeric NOT NULL,
  	"proposed_designation" varchar NOT NULL,
  	"attachments_id" uuid,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_bsn_just_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bsn_just_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__bsn_just_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bsn_just_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_employee_name" varchar NOT NULL,
  	"version_employee_id" varchar NOT NULL,
  	"version_employee_designation" varchar NOT NULL,
  	"version_employee_department_id" uuid NOT NULL,
  	"version_employee_email" varchar,
  	"version_doj" timestamp(3) with time zone,
  	"version_current_basic_salary" numeric NOT NULL,
  	"version_current_housing_allowance" numeric NOT NULL,
  	"version_current_transport_allowance" numeric NOT NULL,
  	"version_current_flexible_allowance" numeric NOT NULL,
  	"version_current_other_allowance" numeric NOT NULL,
  	"version_current_total" numeric NOT NULL,
  	"version_current_grade" numeric NOT NULL,
  	"version_proposed_basic_salary" numeric NOT NULL,
  	"version_proposed_housing_allowance" numeric NOT NULL,
  	"version_proposed_transport_allowance" numeric NOT NULL,
  	"version_proposed_flexible_allowance" numeric NOT NULL,
  	"version_proposed_other_allowance" numeric NOT NULL,
  	"version_proposed_total" numeric NOT NULL,
  	"version_proposed_grade" numeric NOT NULL,
  	"version_proposed_designation" varchar NOT NULL,
  	"version_attachments_id" uuid,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__bsn_just_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "hr_requests_settings_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "hr_requests_settings_allowed_requestors_on_behalf" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "hr_requests_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "business_justifications_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "offer_letter_settings" (
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
  
  CREATE TABLE IF NOT EXISTS "end_of_service_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"xlsx_template_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"xlsx_template_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "hr_requests_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bsn_just_id" uuid;
  ALTER TABLE IF EXISTS "employee_history" ADD COLUMN IF NOT EXISTS "created_by_id" uuid;
  ALTER TABLE IF EXISTS "employee_history" ADD COLUMN IF NOT EXISTS "updated_by_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "hr_requests_workflow_reviews" ADD CONSTRAINT "hr_requests_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_operator_id_operators_id_fk') THEN
      ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_created_by_id_users_id_fk') THEN
      ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_updated_by_id_users_id_fk') THEN
      ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "_hr_requests_v_version_workflow_reviews" ADD CONSTRAINT "_hr_requests_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hr_requests_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_parent_id_hr_requests_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_parent_id_hr_requests_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_operator_id_operators_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_created_by_id_users_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_updated_by_id_users_id_fk') THEN
      ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "bsn_just_workflow_reviews" ADD CONSTRAINT "bsn_just_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_operator_id_operators_id_fk') THEN
      ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_created_by_id_users_id_fk') THEN
      ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_updated_by_id_users_id_fk') THEN
      ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "_bsn_just_v_version_workflow_reviews" ADD CONSTRAINT "_bsn_just_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bsn_just_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_parent_id_bsn_just_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_parent_id_bsn_just_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_employee_department_id_departments_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_attachments_id_internal_media_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_operator_id_operators_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_created_by_id_users_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_updated_by_id_users_id_fk') THEN
      ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_settings_types_parent_id_fk') THEN
      ALTER TABLE "hr_requests_settings_types" ADD CONSTRAINT "hr_requests_settings_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests_settings"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_settings_allowed_requestors_on_behalf_parent_id_fk') THEN
      ALTER TABLE "hr_requests_settings_allowed_requestors_on_behalf" ADD CONSTRAINT "hr_requests_settings_allowed_requestors_on_behalf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests_settings"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "hr_requests_settings" ADD CONSTRAINT "hr_requests_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "hr_requests_settings" ADD CONSTRAINT "hr_requests_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_justifications_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "business_justifications_settings" ADD CONSTRAINT "business_justifications_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_justifications_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "business_justifications_settings" ADD CONSTRAINT "business_justifications_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_header_image_id_internal_media_id_fk') THEN
      ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_header_image_id_internal_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_footer_image_id_internal_media_id_fk') THEN
      ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_footer_image_id_internal_media_id_fk" FOREIGN KEY ("footer_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_docx_template_id_internal_media_id_fk') THEN
      ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_xlsx_template_id_internal_media_id_fk') THEN
      ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_xlsx_template_id_internal_media_id_fk') THEN
      ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_created_by_id_users_id_fk') THEN
      ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_updated_by_id_users_id_fk') THEN
      ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "hr_requests_workflow_reviews_order_idx" ON "hr_requests_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "hr_requests_workflow_reviews_parent_id_idx" ON "hr_requests_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_employee_department_idx" ON "hr_requests" USING btree ("employee_department_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_attachments_idx" ON "hr_requests" USING btree ("attachments_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_operator_idx" ON "hr_requests" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_created_by_idx" ON "hr_requests" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_updated_by_idx" ON "hr_requests" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_updated_at_idx" ON "hr_requests" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "hr_requests_created_at_idx" ON "hr_requests" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_workflow_reviews_order_idx" ON "_hr_requests_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_workflow_reviews_parent_id_idx" ON "_hr_requests_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_parent_idx" ON "_hr_requests_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_employee_department_idx" ON "_hr_requests_v" USING btree ("version_employee_department_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_attachments_idx" ON "_hr_requests_v" USING btree ("version_attachments_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_operator_idx" ON "_hr_requests_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_created_by_idx" ON "_hr_requests_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_updated_by_idx" ON "_hr_requests_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_updated_at_idx" ON "_hr_requests_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_version_version_created_at_idx" ON "_hr_requests_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_created_at_idx" ON "_hr_requests_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_hr_requests_v_updated_at_idx" ON "_hr_requests_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "bsn_just_workflow_reviews_order_idx" ON "bsn_just_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bsn_just_workflow_reviews_parent_id_idx" ON "bsn_just_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_employee_department_idx" ON "bsn_just" USING btree ("employee_department_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_attachments_idx" ON "bsn_just" USING btree ("attachments_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_operator_idx" ON "bsn_just" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_created_by_idx" ON "bsn_just" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_updated_by_idx" ON "bsn_just" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "bsn_just_updated_at_idx" ON "bsn_just" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "bsn_just_created_at_idx" ON "bsn_just" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_workflow_reviews_order_idx" ON "_bsn_just_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_workflow_reviews_parent_id_idx" ON "_bsn_just_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_parent_idx" ON "_bsn_just_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_employee_department_idx" ON "_bsn_just_v" USING btree ("version_employee_department_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_attachments_idx" ON "_bsn_just_v" USING btree ("version_attachments_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_operator_idx" ON "_bsn_just_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_created_by_idx" ON "_bsn_just_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_updated_by_idx" ON "_bsn_just_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_updated_at_idx" ON "_bsn_just_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_version_version_created_at_idx" ON "_bsn_just_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_created_at_idx" ON "_bsn_just_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_bsn_just_v_updated_at_idx" ON "_bsn_just_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_types_order_idx" ON "hr_requests_settings_types" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_types_parent_id_idx" ON "hr_requests_settings_types" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "hr_requests_settings_types_slug_idx" ON "hr_requests_settings_types" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_allowed_requestors_on_behalf_order_idx" ON "hr_requests_settings_allowed_requestors_on_behalf" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_allowed_requestors_on_behalf_parent_id_idx" ON "hr_requests_settings_allowed_requestors_on_behalf" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_created_by_idx" ON "hr_requests_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "hr_requests_settings_updated_by_idx" ON "hr_requests_settings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "business_justifications_settings_created_by_idx" ON "business_justifications_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "business_justifications_settings_updated_by_idx" ON "business_justifications_settings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_settings_header_image_idx" ON "offer_letter_settings" USING btree ("header_image_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_settings_footer_image_idx" ON "offer_letter_settings" USING btree ("footer_image_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_settings_docx_template_idx" ON "offer_letter_settings" USING btree ("docx_template_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_settings_created_by_idx" ON "offer_letter_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_settings_updated_by_idx" ON "offer_letter_settings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_settings_xlsx_template_idx" ON "end_of_service_settings" USING btree ("xlsx_template_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_settings_created_by_idx" ON "end_of_service_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_settings_updated_by_idx" ON "end_of_service_settings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_settings_xlsx_template_idx" ON "recruitment_note_settings" USING btree ("xlsx_template_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_settings_created_by_idx" ON "recruitment_note_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_settings_updated_by_idx" ON "recruitment_note_settings" USING btree ("updated_by_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hr_requests_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_requests_fk" FOREIGN KEY ("hr_requests_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_business_justifications_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_justifications_fk" FOREIGN KEY ("bsn_just_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_history_created_by_id_users_id_fk') THEN
      ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_history_updated_by_id_users_id_fk') THEN
      ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hr_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_requests_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bsn_just_id_idx" ON "payload_locked_documents_rels" USING btree ("bsn_just_id");
  CREATE INDEX IF NOT EXISTS "employee_history_created_by_idx" ON "employee_history" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "employee_history_updated_by_idx" ON "employee_history" USING btree ("updated_by_id");
  ALTER TABLE IF EXISTS "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "sal_ded" DROP COLUMN IF EXISTS "days_deducted";
  ALTER TABLE IF EXISTS "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "_sal_ded_v" DROP COLUMN IF EXISTS "version_days_deducted";
  ALTER TABLE IF EXISTS "offer_letter_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "offer_letter_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "end_of_service_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "end_of_service_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "recruitment_note_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "recruitment_note_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" DROP COLUMN IF EXISTS "token";
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" DROP COLUMN IF EXISTS "approver_type";
  `)
}
