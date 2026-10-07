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
  ALTER TABLE IF EXISTS "offer_letter_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "offer_letter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_offer_letter_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "end_of_service_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "end_of_service" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_end_of_service_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_flexible_allowance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_health_insurance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_mobilization_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_repatriation_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "recruitment_note" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_flexible_allowance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_health_insurance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_mobilization_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_repatriation_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_recruitment_note_v" DISABLE ROW LEVEL SECURITY;
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
  DROP TABLE IF EXISTS "offer_letter_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "offer_letter" CASCADE;
  DROP TABLE IF EXISTS "_offer_letter_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_offer_letter_v" CASCADE;
  DROP TABLE IF EXISTS "end_of_service_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "end_of_service" CASCADE;
  DROP TABLE IF EXISTS "_end_of_service_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_end_of_service_v" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_flexible_allowance_family" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_health_insurance_family" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_mobilization_family_members" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_repatriation_family_members" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v_version_flexible_allowance_family" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v_version_health_insurance_family" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v_version_mobilization_family_members" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v_version_repatriation_family_members" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v_version_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "_recruitment_note_v" CASCADE;
  DROP TABLE IF EXISTS "business_justifications_settings" CASCADE;
  DROP TABLE IF EXISTS "offer_letter_settings" CASCADE;
  DROP TABLE IF EXISTS "end_of_service_settings" CASCADE;
  DROP TABLE IF EXISTS "recruitment_note_settings" CASCADE;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hr_requests_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_business_justifications_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_offer_letter_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_end_of_service_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_recruitment_note_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_hr_requests_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_bsn_just_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_offer_letter_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_end_of_service_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_recruitment_note_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "hr_requests_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bsn_just_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "offer_letter_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "end_of_service_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "recruitment_note_id";
  DROP TYPE IF EXISTS "public"."enum_hr_requests_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_hr_requests_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__hr_requests_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__hr_requests_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_bsn_just_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_bsn_just_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__bsn_just_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__bsn_just_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_offer_letter_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_offer_letter_social_relocation_social";
  DROP TYPE IF EXISTS "public"."enum_offer_letter_social_relocation_class_of_travel";
  DROP TYPE IF EXISTS "public"."enum_offer_letter_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__offer_letter_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__offer_letter_v_version_social_relocation_social";
  DROP TYPE IF EXISTS "public"."enum__offer_letter_v_version_social_relocation_class_of_travel";
  DROP TYPE IF EXISTS "public"."enum__offer_letter_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_end_of_service_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_end_of_service_payment_method";
  DROP TYPE IF EXISTS "public"."enum_end_of_service_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__end_of_service_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__end_of_service_v_version_payment_method";
  DROP TYPE IF EXISTS "public"."enum__end_of_service_v_version_workflow_status";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_flexible_allowance_family";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_health_insurance_family";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_mobilization_family_members";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_repatriation_family_members";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_social_status";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_budget_status";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_housing";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_education_allowance";
  DROP TYPE IF EXISTS "public"."enum_recruitment_note_workflow_status";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_flexible_allowance_family";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_health_insurance_family";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_mobilization_family_members";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_repatriation_family_members";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_social_status";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_budget_status";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_housing";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_education_allowance";
  DROP TYPE IF EXISTS "public"."enum__recruitment_note_v_version_workflow_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_hr_requests_workflow_reviews_response') THEN CREATE TYPE "public"."enum_hr_requests_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_hr_requests_workflow_status') THEN CREATE TYPE "public"."enum_hr_requests_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__hr_requests_v_version_workflow_reviews_response') THEN CREATE TYPE "public"."enum__hr_requests_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__hr_requests_v_version_workflow_status') THEN CREATE TYPE "public"."enum__hr_requests_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_bsn_just_workflow_reviews_response') THEN CREATE TYPE "public"."enum_bsn_just_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_bsn_just_workflow_status') THEN CREATE TYPE "public"."enum_bsn_just_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__bsn_just_v_version_workflow_reviews_response') THEN CREATE TYPE "public"."enum__bsn_just_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__bsn_just_v_version_workflow_status') THEN CREATE TYPE "public"."enum__bsn_just_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_offer_letter_workflow_reviews_response') THEN CREATE TYPE "public"."enum_offer_letter_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_offer_letter_social_relocation_social') THEN CREATE TYPE "public"."enum_offer_letter_social_relocation_social" AS ENUM('single', 'family'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_offer_letter_social_relocation_class_of_travel') THEN CREATE TYPE "public"."enum_offer_letter_social_relocation_class_of_travel" AS ENUM('economy', 'business'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_offer_letter_workflow_status') THEN CREATE TYPE "public"."enum_offer_letter_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__offer_letter_v_version_workflow_reviews_response') THEN CREATE TYPE "public"."enum__offer_letter_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__offer_letter_v_version_social_relocation_social') THEN CREATE TYPE "public"."enum__offer_letter_v_version_social_relocation_social" AS ENUM('single', 'family'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__offer_letter_v_version_social_relocation_class_of_travel') THEN CREATE TYPE "public"."enum__offer_letter_v_version_social_relocation_class_of_travel" AS ENUM('economy', 'business'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__offer_letter_v_version_workflow_status') THEN CREATE TYPE "public"."enum__offer_letter_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_end_of_service_workflow_reviews_response') THEN CREATE TYPE "public"."enum_end_of_service_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_end_of_service_payment_method') THEN CREATE TYPE "public"."enum_end_of_service_payment_method" AS ENUM('bank_transfer', 'check', 'cash', 'other'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_end_of_service_workflow_status') THEN CREATE TYPE "public"."enum_end_of_service_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__end_of_service_v_version_workflow_reviews_response') THEN CREATE TYPE "public"."enum__end_of_service_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__end_of_service_v_version_payment_method') THEN CREATE TYPE "public"."enum__end_of_service_v_version_payment_method" AS ENUM('bank_transfer', 'check', 'cash', 'other'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__end_of_service_v_version_workflow_status') THEN CREATE TYPE "public"."enum__end_of_service_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_flexible_allowance_family') THEN CREATE TYPE "public"."enum_recruitment_note_flexible_allowance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_health_insurance_family') THEN CREATE TYPE "public"."enum_recruitment_note_health_insurance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_mobilization_family_members') THEN CREATE TYPE "public"."enum_recruitment_note_mobilization_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_repatriation_family_members') THEN CREATE TYPE "public"."enum_recruitment_note_repatriation_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_workflow_reviews_response') THEN CREATE TYPE "public"."enum_recruitment_note_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_social_status') THEN CREATE TYPE "public"."enum_recruitment_note_social_status" AS ENUM('family', 'single'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_budget_status') THEN CREATE TYPE "public"."enum_recruitment_note_budget_status" AS ENUM('budgeted', 'out_of_budget'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_housing') THEN CREATE TYPE "public"."enum_recruitment_note_housing" AS ENUM('4_bedroom_villa', '3_bedroom_apartment', '2_bedroom_apartment', '1_bedroom_apartment', 'studio', 'shared_single_room', 'shared_two_per_room', 'allowance'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_education_allowance') THEN CREATE TYPE "public"."enum_recruitment_note_education_allowance" AS ENUM('1', '2', '3', 'na'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_recruitment_note_workflow_status') THEN CREATE TYPE "public"."enum_recruitment_note_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_flexible_allowance_family') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_flexible_allowance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_health_insurance_family') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_health_insurance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_mobilization_family_members') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_mobilization_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_repatriation_family_members') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_repatriation_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_workflow_reviews_response') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_social_status') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_social_status" AS ENUM('family', 'single'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_budget_status') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_budget_status" AS ENUM('budgeted', 'out_of_budget'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_housing') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_housing" AS ENUM('4_bedroom_villa', '3_bedroom_apartment', '2_bedroom_apartment', '1_bedroom_apartment', 'studio', 'shared_single_room', 'shared_two_per_room', 'allowance'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_education_allowance') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_education_allowance" AS ENUM('1', '2', '3', 'na'); END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__recruitment_note_v_version_workflow_status') THEN CREATE TYPE "public"."enum__recruitment_note_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected'); END IF; END $$;
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
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar
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
  	"approve_token" varchar,
  	"reject_token" varchar,
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
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar
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
  	"approve_token" varchar,
  	"reject_token" varchar,
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
  
  CREATE TABLE IF NOT EXISTS "offer_letter_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_offer_letter_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "offer_letter" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"job_candidate_name" varchar NOT NULL,
  	"job_position" varchar NOT NULL,
  	"job_grade" varchar NOT NULL,
  	"job_department_id" uuid NOT NULL,
  	"job_reports_to_name" varchar NOT NULL,
  	"job_reports_to_email" varchar NOT NULL,
  	"job_expected_joining_date" timestamp(3) with time zone NOT NULL,
  	"job_probation_period" varchar DEFAULT '6 months' NOT NULL,
  	"job_hours_per_week" numeric DEFAULT 48 NOT NULL,
  	"salary_monthly_basic" numeric NOT NULL,
  	"salary_flexible_allowance" numeric NOT NULL,
  	"salary_housing_allowance" numeric NOT NULL,
  	"salary_transportation_allowance" numeric NOT NULL,
  	"social_relocation_social" "enum_offer_letter_social_relocation_social" NOT NULL,
  	"social_relocation_class_of_travel" "enum_offer_letter_social_relocation_class_of_travel" NOT NULL,
  	"other_benefits_home_leave_ticket" varchar NOT NULL,
  	"social_relocation_eligible_dependents" varchar NOT NULL,
  	"social_relocation_declared_home_residence" varchar NOT NULL,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_offer_letter_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_offer_letter_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__offer_letter_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_offer_letter_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_job_candidate_name" varchar NOT NULL,
  	"version_job_position" varchar NOT NULL,
  	"version_job_grade" varchar NOT NULL,
  	"version_job_department_id" uuid NOT NULL,
  	"version_job_reports_to_name" varchar NOT NULL,
  	"version_job_reports_to_email" varchar NOT NULL,
  	"version_job_expected_joining_date" timestamp(3) with time zone NOT NULL,
  	"version_job_probation_period" varchar DEFAULT '6 months' NOT NULL,
  	"version_job_hours_per_week" numeric DEFAULT 48 NOT NULL,
  	"version_salary_monthly_basic" numeric NOT NULL,
  	"version_salary_flexible_allowance" numeric NOT NULL,
  	"version_salary_housing_allowance" numeric NOT NULL,
  	"version_salary_transportation_allowance" numeric NOT NULL,
  	"version_social_relocation_social" "enum__offer_letter_v_version_social_relocation_social" NOT NULL,
  	"version_social_relocation_class_of_travel" "enum__offer_letter_v_version_social_relocation_class_of_travel" NOT NULL,
  	"version_other_benefits_home_leave_ticket" varchar NOT NULL,
  	"version_social_relocation_eligible_dependents" varchar NOT NULL,
  	"version_social_relocation_declared_home_residence" varchar NOT NULL,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__offer_letter_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "end_of_service_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_end_of_service_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "end_of_service" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"staff_no" varchar NOT NULL,
  	"staff_name" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"grade" varchar NOT NULL,
  	"department_id" uuid NOT NULL,
  	"date_of_joining" timestamp(3) with time zone NOT NULL,
  	"date_of_resigning" timestamp(3) with time zone NOT NULL,
  	"last_working_date" timestamp(3) with time zone NOT NULL,
  	"basic_salary" numeric NOT NULL,
  	"housing_allowance" numeric NOT NULL,
  	"food_allowance" numeric NOT NULL,
  	"special_allowance" numeric NOT NULL,
  	"other_allowance" numeric NOT NULL,
  	"total" numeric,
  	"gratuity_pay" numeric NOT NULL,
  	"leave_pay" numeric NOT NULL,
  	"additions" numeric,
  	"deductions" numeric,
  	"note" varchar,
  	"payment_method" "enum_end_of_service_payment_method" NOT NULL,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_end_of_service_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_end_of_service_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__end_of_service_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_end_of_service_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_staff_no" varchar NOT NULL,
  	"version_staff_name" varchar NOT NULL,
  	"version_title" varchar NOT NULL,
  	"version_grade" varchar NOT NULL,
  	"version_department_id" uuid NOT NULL,
  	"version_date_of_joining" timestamp(3) with time zone NOT NULL,
  	"version_date_of_resigning" timestamp(3) with time zone NOT NULL,
  	"version_last_working_date" timestamp(3) with time zone NOT NULL,
  	"version_basic_salary" numeric NOT NULL,
  	"version_housing_allowance" numeric NOT NULL,
  	"version_food_allowance" numeric NOT NULL,
  	"version_special_allowance" numeric NOT NULL,
  	"version_other_allowance" numeric NOT NULL,
  	"version_total" numeric,
  	"version_gratuity_pay" numeric NOT NULL,
  	"version_leave_pay" numeric NOT NULL,
  	"version_additions" numeric,
  	"version_deductions" numeric,
  	"version_note" varchar,
  	"version_payment_method" "enum__end_of_service_v_version_payment_method" NOT NULL,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__end_of_service_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_flexible_allowance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_flexible_allowance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_health_insurance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_health_insurance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_mobilization_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_mobilization_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_repatriation_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_repatriation_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_recruitment_note_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "recruitment_note" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"rn_number" numeric NOT NULL,
  	"department_id" uuid NOT NULL,
  	"salary_range_min" numeric NOT NULL,
  	"salary_range_max" numeric NOT NULL,
  	"issue_date" timestamp(3) with time zone NOT NULL,
  	"candidate_name" varchar NOT NULL,
  	"current_previous_company" varchar,
  	"educational_qualifications" varchar,
  	"other_certifications" varchar,
  	"designation" varchar NOT NULL,
  	"grade" numeric NOT NULL,
  	"social_status" "enum_recruitment_note_social_status" NOT NULL,
  	"budget_status" "enum_recruitment_note_budget_status" NOT NULL,
  	"housing" "enum_recruitment_note_housing" NOT NULL,
  	"nationality" varchar NOT NULL,
  	"years_of_experience" varchar NOT NULL,
  	"expected_date" timestamp(3) with time zone,
  	"budget_start_date" timestamp(3) with time zone,
  	"monthly_basic_salary" numeric NOT NULL,
  	"monthly_flexible_allowance" numeric NOT NULL,
  	"monthly_annual_leave_fare" numeric NOT NULL,
  	"monthly_housing_allowance" numeric NOT NULL,
  	"monthly_transportation_allowance" numeric NOT NULL,
  	"monthly_food_allowance" numeric NOT NULL,
  	"education_allowance" "enum_recruitment_note_education_allowance",
  	"end_of_service_gratuity" numeric,
  	"total_salary_benefits" numeric,
  	"yearly_mobilization_colleague" numeric,
  	"yearly_mobilization_family" numeric,
  	"yearly_repatriation_colleague" numeric,
  	"yearly_repatriation_family" numeric,
  	"total_benefits" numeric,
  	"overall_cost" numeric,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_recruitment_note_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v_version_flexible_allowance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_flexible_allowance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v_version_health_insurance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_health_insurance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v_version_mobilization_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_mobilization_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v_version_repatriation_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_repatriation_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__recruitment_note_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"approve_token" varchar,
  	"reject_token" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_recruitment_note_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_rn_number" numeric NOT NULL,
  	"version_department_id" uuid NOT NULL,
  	"version_salary_range_min" numeric NOT NULL,
  	"version_salary_range_max" numeric NOT NULL,
  	"version_issue_date" timestamp(3) with time zone NOT NULL,
  	"version_candidate_name" varchar NOT NULL,
  	"version_current_previous_company" varchar,
  	"version_educational_qualifications" varchar,
  	"version_other_certifications" varchar,
  	"version_designation" varchar NOT NULL,
  	"version_grade" numeric NOT NULL,
  	"version_social_status" "enum__recruitment_note_v_version_social_status" NOT NULL,
  	"version_budget_status" "enum__recruitment_note_v_version_budget_status" NOT NULL,
  	"version_housing" "enum__recruitment_note_v_version_housing" NOT NULL,
  	"version_nationality" varchar NOT NULL,
  	"version_years_of_experience" varchar NOT NULL,
  	"version_expected_date" timestamp(3) with time zone,
  	"version_budget_start_date" timestamp(3) with time zone,
  	"version_monthly_basic_salary" numeric NOT NULL,
  	"version_monthly_flexible_allowance" numeric NOT NULL,
  	"version_monthly_annual_leave_fare" numeric NOT NULL,
  	"version_monthly_housing_allowance" numeric NOT NULL,
  	"version_monthly_transportation_allowance" numeric NOT NULL,
  	"version_monthly_food_allowance" numeric NOT NULL,
  	"version_education_allowance" "enum__recruitment_note_v_version_education_allowance",
  	"version_end_of_service_gratuity" numeric,
  	"version_total_salary_benefits" numeric,
  	"version_yearly_mobilization_colleague" numeric,
  	"version_yearly_mobilization_family" numeric,
  	"version_yearly_repatriation_colleague" numeric,
  	"version_yearly_repatriation_family" numeric,
  	"version_total_benefits" numeric,
  	"version_overall_cost" numeric,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__recruitment_note_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
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
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "hr_requests_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bsn_just_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "offer_letter_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "end_of_service_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "recruitment_note_id" uuid;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_workflow_reviews_parent_id_fk') THEN ALTER TABLE "hr_requests_workflow_reviews" ADD CONSTRAINT "hr_requests_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_employee_department_id_departments_id_fk') THEN ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_attachments_id_internal_media_id_fk') THEN ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_operator_id_operators_id_fk') THEN ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_created_by_id_users_id_fk') THEN ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hr_requests_updated_by_id_users_id_fk') THEN ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_workflow_reviews_parent_id_fk') THEN ALTER TABLE "_hr_requests_v_version_workflow_reviews" ADD CONSTRAINT "_hr_requests_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hr_requests_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_parent_id_hr_requests_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_parent_id_hr_requests_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_employee_department_id_departments_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_attachments_id_internal_media_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_operator_id_operators_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_created_by_id_users_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_hr_requests_v_version_updated_by_id_users_id_fk') THEN ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_workflow_reviews_parent_id_fk') THEN ALTER TABLE "bsn_just_workflow_reviews" ADD CONSTRAINT "bsn_just_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_employee_department_id_departments_id_fk') THEN ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_attachments_id_internal_media_id_fk') THEN ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_operator_id_operators_id_fk') THEN ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_created_by_id_users_id_fk') THEN ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bsn_just_updated_by_id_users_id_fk') THEN ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_workflow_reviews_parent_id_fk') THEN ALTER TABLE "_bsn_just_v_version_workflow_reviews" ADD CONSTRAINT "_bsn_just_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bsn_just_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_parent_id_bsn_just_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_parent_id_bsn_just_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_employee_department_id_departments_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_attachments_id_internal_media_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_operator_id_operators_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_created_by_id_users_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_bsn_just_v_version_updated_by_id_users_id_fk') THEN ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_workflow_reviews_parent_id_fk') THEN ALTER TABLE "offer_letter_workflow_reviews" ADD CONSTRAINT "offer_letter_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offer_letter"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_job_department_id_departments_id_fk') THEN ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_job_department_id_departments_id_fk" FOREIGN KEY ("job_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_operator_id_operators_id_fk') THEN ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_created_by_id_users_id_fk') THEN ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_updated_by_id_users_id_fk') THEN ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_version_workflow_reviews_parent_id_fk') THEN ALTER TABLE "_offer_letter_v_version_workflow_reviews" ADD CONSTRAINT "_offer_letter_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offer_letter_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_parent_id_offer_letter_id_fk') THEN ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_parent_id_offer_letter_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offer_letter"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_version_job_department_id_departments_id_fk') THEN ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_job_department_id_departments_id_fk" FOREIGN KEY ("version_job_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_version_operator_id_operators_id_fk') THEN ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_version_created_by_id_users_id_fk') THEN ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_offer_letter_v_version_updated_by_id_users_id_fk') THEN ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_workflow_reviews_parent_id_fk') THEN ALTER TABLE "end_of_service_workflow_reviews" ADD CONSTRAINT "end_of_service_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."end_of_service"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_department_id_departments_id_fk') THEN ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_operator_id_operators_id_fk') THEN ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_created_by_id_users_id_fk') THEN ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_updated_by_id_users_id_fk') THEN ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_version_workflow_reviews_parent_id_fk') THEN ALTER TABLE "_end_of_service_v_version_workflow_reviews" ADD CONSTRAINT "_end_of_service_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_end_of_service_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_parent_id_end_of_service_id_fk') THEN ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_parent_id_end_of_service_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."end_of_service"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_version_department_id_departments_id_fk') THEN ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_department_id_departments_id_fk" FOREIGN KEY ("version_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_version_operator_id_operators_id_fk') THEN ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_version_created_by_id_users_id_fk') THEN ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_end_of_service_v_version_updated_by_id_users_id_fk') THEN ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_flexible_allowance_family_parent_fk') THEN ALTER TABLE "recruitment_note_flexible_allowance_family" ADD CONSTRAINT "recruitment_note_flexible_allowance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_health_insurance_family_parent_fk') THEN ALTER TABLE "recruitment_note_health_insurance_family" ADD CONSTRAINT "recruitment_note_health_insurance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_mobilization_family_members_parent_fk') THEN ALTER TABLE "recruitment_note_mobilization_family_members" ADD CONSTRAINT "recruitment_note_mobilization_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_repatriation_family_members_parent_fk') THEN ALTER TABLE "recruitment_note_repatriation_family_members" ADD CONSTRAINT "recruitment_note_repatriation_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_workflow_reviews_parent_id_fk') THEN ALTER TABLE "recruitment_note_workflow_reviews" ADD CONSTRAINT "recruitment_note_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_department_id_departments_id_fk') THEN ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_operator_id_operators_id_fk') THEN ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_created_by_id_users_id_fk') THEN ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_updated_by_id_users_id_fk') THEN ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_flexible_allowance_family_parent_fk') THEN ALTER TABLE "_recruitment_note_v_version_flexible_allowance_family" ADD CONSTRAINT "_recruitment_note_v_version_flexible_allowance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_health_insurance_family_parent_fk') THEN ALTER TABLE "_recruitment_note_v_version_health_insurance_family" ADD CONSTRAINT "_recruitment_note_v_version_health_insurance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_mobilization_family_members_parent_fk') THEN ALTER TABLE "_recruitment_note_v_version_mobilization_family_members" ADD CONSTRAINT "_recruitment_note_v_version_mobilization_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_repatriation_family_members_parent_fk') THEN ALTER TABLE "_recruitment_note_v_version_repatriation_family_members" ADD CONSTRAINT "_recruitment_note_v_version_repatriation_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_workflow_reviews_parent_id_fk') THEN ALTER TABLE "_recruitment_note_v_version_workflow_reviews" ADD CONSTRAINT "_recruitment_note_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_parent_id_recruitment_note_id_fk') THEN ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_parent_id_recruitment_note_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_department_id_departments_id_fk') THEN ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_department_id_departments_id_fk" FOREIGN KEY ("version_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_operator_id_operators_id_fk') THEN ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_created_by_id_users_id_fk') THEN ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_recruitment_note_v_version_updated_by_id_users_id_fk') THEN ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_justifications_settings_created_by_id_users_id_fk') THEN ALTER TABLE "business_justifications_settings" ADD CONSTRAINT "business_justifications_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_justifications_settings_updated_by_id_users_id_fk') THEN ALTER TABLE "business_justifications_settings" ADD CONSTRAINT "business_justifications_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_header_image_id_internal_media_id_fk') THEN ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_header_image_id_internal_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_footer_image_id_internal_media_id_fk') THEN ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_footer_image_id_internal_media_id_fk" FOREIGN KEY ("footer_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_docx_template_id_internal_media_id_fk') THEN ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_created_by_id_users_id_fk') THEN ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_letter_settings_updated_by_id_users_id_fk') THEN ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_xlsx_template_id_internal_media_id_fk') THEN ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_created_by_id_users_id_fk') THEN ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'end_of_service_settings_updated_by_id_users_id_fk') THEN ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_xlsx_template_id_internal_media_id_fk') THEN ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_created_by_id_users_id_fk') THEN ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_note_settings_updated_by_id_users_id_fk') THEN ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; END IF; END $$;
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
  CREATE INDEX IF NOT EXISTS "offer_letter_workflow_reviews_order_idx" ON "offer_letter_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "offer_letter_workflow_reviews_parent_id_idx" ON "offer_letter_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_job_department_idx" ON "offer_letter" USING btree ("job_department_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_operator_idx" ON "offer_letter" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_created_by_idx" ON "offer_letter" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_updated_by_idx" ON "offer_letter" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "offer_letter_updated_at_idx" ON "offer_letter" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "offer_letter_created_at_idx" ON "offer_letter" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_workflow_reviews_order_idx" ON "_offer_letter_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_workflow_reviews_parent_id_idx" ON "_offer_letter_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_parent_idx" ON "_offer_letter_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_job_department_idx" ON "_offer_letter_v" USING btree ("version_job_department_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_operator_idx" ON "_offer_letter_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_created_by_idx" ON "_offer_letter_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_updated_by_idx" ON "_offer_letter_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_updated_at_idx" ON "_offer_letter_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_version_version_created_at_idx" ON "_offer_letter_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_created_at_idx" ON "_offer_letter_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_offer_letter_v_updated_at_idx" ON "_offer_letter_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "end_of_service_workflow_reviews_order_idx" ON "end_of_service_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "end_of_service_workflow_reviews_parent_id_idx" ON "end_of_service_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_department_idx" ON "end_of_service" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_operator_idx" ON "end_of_service" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_created_by_idx" ON "end_of_service" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_updated_by_idx" ON "end_of_service" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "end_of_service_updated_at_idx" ON "end_of_service" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "end_of_service_created_at_idx" ON "end_of_service" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_workflow_reviews_order_idx" ON "_end_of_service_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_workflow_reviews_parent_id_idx" ON "_end_of_service_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_parent_idx" ON "_end_of_service_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_department_idx" ON "_end_of_service_v" USING btree ("version_department_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_operator_idx" ON "_end_of_service_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_created_by_idx" ON "_end_of_service_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_updated_by_idx" ON "_end_of_service_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_updated_at_idx" ON "_end_of_service_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_version_version_created_at_idx" ON "_end_of_service_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_created_at_idx" ON "_end_of_service_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_end_of_service_v_updated_at_idx" ON "_end_of_service_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "recruitment_note_flexible_allowance_family_order_idx" ON "recruitment_note_flexible_allowance_family" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "recruitment_note_flexible_allowance_family_parent_idx" ON "recruitment_note_flexible_allowance_family" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_health_insurance_family_order_idx" ON "recruitment_note_health_insurance_family" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "recruitment_note_health_insurance_family_parent_idx" ON "recruitment_note_health_insurance_family" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_mobilization_family_members_order_idx" ON "recruitment_note_mobilization_family_members" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "recruitment_note_mobilization_family_members_parent_idx" ON "recruitment_note_mobilization_family_members" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_repatriation_family_members_order_idx" ON "recruitment_note_repatriation_family_members" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "recruitment_note_repatriation_family_members_parent_idx" ON "recruitment_note_repatriation_family_members" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_workflow_reviews_order_idx" ON "recruitment_note_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "recruitment_note_workflow_reviews_parent_id_idx" ON "recruitment_note_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_department_idx" ON "recruitment_note" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_operator_idx" ON "recruitment_note" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_created_by_idx" ON "recruitment_note" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_updated_by_idx" ON "recruitment_note" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "recruitment_note_updated_at_idx" ON "recruitment_note" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "recruitment_note_created_at_idx" ON "recruitment_note" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_flexible_allowance_family_order_idx" ON "_recruitment_note_v_version_flexible_allowance_family" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_flexible_allowance_family_parent_idx" ON "_recruitment_note_v_version_flexible_allowance_family" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_health_insurance_family_order_idx" ON "_recruitment_note_v_version_health_insurance_family" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_health_insurance_family_parent_idx" ON "_recruitment_note_v_version_health_insurance_family" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_mobilization_family_members_order_idx" ON "_recruitment_note_v_version_mobilization_family_members" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_mobilization_family_members_parent_idx" ON "_recruitment_note_v_version_mobilization_family_members" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_repatriation_family_members_order_idx" ON "_recruitment_note_v_version_repatriation_family_members" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_repatriation_family_members_parent_idx" ON "_recruitment_note_v_version_repatriation_family_members" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_workflow_reviews_order_idx" ON "_recruitment_note_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_workflow_reviews_parent_id_idx" ON "_recruitment_note_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_parent_idx" ON "_recruitment_note_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_department_idx" ON "_recruitment_note_v" USING btree ("version_department_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_operator_idx" ON "_recruitment_note_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_created_by_idx" ON "_recruitment_note_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_updated_by_idx" ON "_recruitment_note_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_updated_at_idx" ON "_recruitment_note_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_version_version_created_at_idx" ON "_recruitment_note_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_created_at_idx" ON "_recruitment_note_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_recruitment_note_v_updated_at_idx" ON "_recruitment_note_v" USING btree ("updated_at");
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
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hr_requests_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_requests_fk" FOREIGN KEY ("hr_requests_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_business_justifications_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_justifications_fk" FOREIGN KEY ("bsn_just_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_offer_letter_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offer_letter_fk" FOREIGN KEY ("offer_letter_id") REFERENCES "public"."offer_letter"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_end_of_service_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_end_of_service_fk" FOREIGN KEY ("end_of_service_id") REFERENCES "public"."end_of_service"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_recruitment_note_fk') THEN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_recruitment_note_fk" FOREIGN KEY ("recruitment_note_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action; END IF; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hr_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_requests_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bsn_just_id_idx" ON "payload_locked_documents_rels" USING btree ("bsn_just_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_offer_letter_id_idx" ON "payload_locked_documents_rels" USING btree ("offer_letter_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_end_of_service_id_idx" ON "payload_locked_documents_rels" USING btree ("end_of_service_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_recruitment_note_id_idx" ON "payload_locked_documents_rels" USING btree ("recruitment_note_id");`)
}
