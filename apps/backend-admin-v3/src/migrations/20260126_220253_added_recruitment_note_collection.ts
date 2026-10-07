import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_recruitment_note_flexible_allowance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum_recruitment_note_health_insurance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum_recruitment_note_mobilization_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum_recruitment_note_repatriation_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum_recruitment_note_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_recruitment_note_social_status" AS ENUM('family', 'single');
  CREATE TYPE "public"."enum_recruitment_note_budget_status" AS ENUM('budgeted', 'out_of_budget');
  CREATE TYPE "public"."enum_recruitment_note_housing" AS ENUM('4_bedroom_villa', '3_bedroom_apartment', '2_bedroom_apartment', '1_bedroom_apartment', 'studio', 'shared_single_room', 'shared_two_per_room', 'allowance');
  CREATE TYPE "public"."enum_recruitment_note_education_allowance" AS ENUM('1', '2', '3', 'na');
  CREATE TYPE "public"."enum_recruitment_note_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__recruitment_note_v_version_flexible_allowance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum__recruitment_note_v_version_health_insurance_family" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum__recruitment_note_v_version_mobilization_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum__recruitment_note_v_version_repatriation_family_members" AS ENUM('colleague', 'spouse', '1_children', '2_childrens', '3_childrens');
  CREATE TYPE "public"."enum__recruitment_note_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__recruitment_note_v_version_social_status" AS ENUM('family', 'single');
  CREATE TYPE "public"."enum__recruitment_note_v_version_budget_status" AS ENUM('budgeted', 'out_of_budget');
  CREATE TYPE "public"."enum__recruitment_note_v_version_housing" AS ENUM('4_bedroom_villa', '3_bedroom_apartment', '2_bedroom_apartment', '1_bedroom_apartment', 'studio', 'shared_single_room', 'shared_two_per_room', 'allowance');
  CREATE TYPE "public"."enum__recruitment_note_v_version_education_allowance" AS ENUM('1', '2', '3', 'na');
  CREATE TYPE "public"."enum__recruitment_note_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "recruitment_note_flexible_allowance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_flexible_allowance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "recruitment_note_health_insurance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_health_insurance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "recruitment_note_mobilization_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_mobilization_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "recruitment_note_repatriation_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_recruitment_note_repatriation_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "recruitment_note_workflow_reviews" (
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
  	"signature" varchar
  );
  
  CREATE TABLE "recruitment_note" (
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
  
  CREATE TABLE "_recruitment_note_v_version_flexible_allowance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_flexible_allowance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_recruitment_note_v_version_health_insurance_family" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_health_insurance_family",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_recruitment_note_v_version_mobilization_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_mobilization_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_recruitment_note_v_version_repatriation_family_members" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__recruitment_note_v_version_repatriation_family_members",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_recruitment_note_v_version_workflow_reviews" (
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
  	"_uuid" varchar
  );
  
  CREATE TABLE "_recruitment_note_v" (
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
  
  CREATE TABLE "recruitment_note_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"xlsx_template_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "recruitment_note_id" uuid;
  ALTER TABLE "recruitment_note_flexible_allowance_family" ADD CONSTRAINT "recruitment_note_flexible_allowance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_note_health_insurance_family" ADD CONSTRAINT "recruitment_note_health_insurance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_note_mobilization_family_members" ADD CONSTRAINT "recruitment_note_mobilization_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_note_repatriation_family_members" ADD CONSTRAINT "recruitment_note_repatriation_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_note_workflow_reviews" ADD CONSTRAINT "recruitment_note_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note" ADD CONSTRAINT "recruitment_note_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v_version_flexible_allowance_family" ADD CONSTRAINT "_recruitment_note_v_version_flexible_allowance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v_version_health_insurance_family" ADD CONSTRAINT "_recruitment_note_v_version_health_insurance_family_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v_version_mobilization_family_members" ADD CONSTRAINT "_recruitment_note_v_version_mobilization_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v_version_repatriation_family_members" ADD CONSTRAINT "_recruitment_note_v_version_repatriation_family_members_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" ADD CONSTRAINT "_recruitment_note_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_recruitment_note_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_parent_id_recruitment_note_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."recruitment_note"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_department_id_departments_id_fk" FOREIGN KEY ("version_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_recruitment_note_v" ADD CONSTRAINT "_recruitment_note_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "recruitment_note_settings" ADD CONSTRAINT "recruitment_note_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "recruitment_note_flexible_allowance_family_order_idx" ON "recruitment_note_flexible_allowance_family" USING btree ("order");
  CREATE INDEX "recruitment_note_flexible_allowance_family_parent_idx" ON "recruitment_note_flexible_allowance_family" USING btree ("parent_id");
  CREATE INDEX "recruitment_note_health_insurance_family_order_idx" ON "recruitment_note_health_insurance_family" USING btree ("order");
  CREATE INDEX "recruitment_note_health_insurance_family_parent_idx" ON "recruitment_note_health_insurance_family" USING btree ("parent_id");
  CREATE INDEX "recruitment_note_mobilization_family_members_order_idx" ON "recruitment_note_mobilization_family_members" USING btree ("order");
  CREATE INDEX "recruitment_note_mobilization_family_members_parent_idx" ON "recruitment_note_mobilization_family_members" USING btree ("parent_id");
  CREATE INDEX "recruitment_note_repatriation_family_members_order_idx" ON "recruitment_note_repatriation_family_members" USING btree ("order");
  CREATE INDEX "recruitment_note_repatriation_family_members_parent_idx" ON "recruitment_note_repatriation_family_members" USING btree ("parent_id");
  CREATE INDEX "recruitment_note_workflow_reviews_order_idx" ON "recruitment_note_workflow_reviews" USING btree ("_order");
  CREATE INDEX "recruitment_note_workflow_reviews_parent_id_idx" ON "recruitment_note_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "recruitment_note_department_idx" ON "recruitment_note" USING btree ("department_id");
  CREATE INDEX "recruitment_note_operator_idx" ON "recruitment_note" USING btree ("operator_id");
  CREATE INDEX "recruitment_note_created_by_idx" ON "recruitment_note" USING btree ("created_by_id");
  CREATE INDEX "recruitment_note_updated_by_idx" ON "recruitment_note" USING btree ("updated_by_id");
  CREATE INDEX "recruitment_note_updated_at_idx" ON "recruitment_note" USING btree ("updated_at");
  CREATE INDEX "recruitment_note_created_at_idx" ON "recruitment_note" USING btree ("created_at");
  CREATE INDEX "_recruitment_note_v_version_flexible_allowance_family_order_idx" ON "_recruitment_note_v_version_flexible_allowance_family" USING btree ("order");
  CREATE INDEX "_recruitment_note_v_version_flexible_allowance_family_parent_idx" ON "_recruitment_note_v_version_flexible_allowance_family" USING btree ("parent_id");
  CREATE INDEX "_recruitment_note_v_version_health_insurance_family_order_idx" ON "_recruitment_note_v_version_health_insurance_family" USING btree ("order");
  CREATE INDEX "_recruitment_note_v_version_health_insurance_family_parent_idx" ON "_recruitment_note_v_version_health_insurance_family" USING btree ("parent_id");
  CREATE INDEX "_recruitment_note_v_version_mobilization_family_members_order_idx" ON "_recruitment_note_v_version_mobilization_family_members" USING btree ("order");
  CREATE INDEX "_recruitment_note_v_version_mobilization_family_members_parent_idx" ON "_recruitment_note_v_version_mobilization_family_members" USING btree ("parent_id");
  CREATE INDEX "_recruitment_note_v_version_repatriation_family_members_order_idx" ON "_recruitment_note_v_version_repatriation_family_members" USING btree ("order");
  CREATE INDEX "_recruitment_note_v_version_repatriation_family_members_parent_idx" ON "_recruitment_note_v_version_repatriation_family_members" USING btree ("parent_id");
  CREATE INDEX "_recruitment_note_v_version_workflow_reviews_order_idx" ON "_recruitment_note_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_recruitment_note_v_version_workflow_reviews_parent_id_idx" ON "_recruitment_note_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_recruitment_note_v_parent_idx" ON "_recruitment_note_v" USING btree ("parent_id");
  CREATE INDEX "_recruitment_note_v_version_version_department_idx" ON "_recruitment_note_v" USING btree ("version_department_id");
  CREATE INDEX "_recruitment_note_v_version_version_operator_idx" ON "_recruitment_note_v" USING btree ("version_operator_id");
  CREATE INDEX "_recruitment_note_v_version_version_created_by_idx" ON "_recruitment_note_v" USING btree ("version_created_by_id");
  CREATE INDEX "_recruitment_note_v_version_version_updated_by_idx" ON "_recruitment_note_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_recruitment_note_v_version_version_updated_at_idx" ON "_recruitment_note_v" USING btree ("version_updated_at");
  CREATE INDEX "_recruitment_note_v_version_version_created_at_idx" ON "_recruitment_note_v" USING btree ("version_created_at");
  CREATE INDEX "_recruitment_note_v_created_at_idx" ON "_recruitment_note_v" USING btree ("created_at");
  CREATE INDEX "_recruitment_note_v_updated_at_idx" ON "_recruitment_note_v" USING btree ("updated_at");
  CREATE INDEX "recruitment_note_settings_xlsx_template_idx" ON "recruitment_note_settings" USING btree ("xlsx_template_id");
  CREATE INDEX "recruitment_note_settings_created_by_idx" ON "recruitment_note_settings" USING btree ("created_by_id");
  CREATE INDEX "recruitment_note_settings_updated_by_idx" ON "recruitment_note_settings" USING btree ("updated_by_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_recruitment_note_fk" FOREIGN KEY ("recruitment_note_id") REFERENCES "public"."recruitment_note"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_recruitment_note_id_idx" ON "payload_locked_documents_rels" USING btree ("recruitment_note_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "recruitment_note_flexible_allowance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note_health_insurance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note_mobilization_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note_repatriation_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v_version_flexible_allowance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v_version_health_insurance_family" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v_version_mobilization_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v_version_repatriation_family_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_recruitment_note_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "recruitment_note_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "recruitment_note_flexible_allowance_family" CASCADE;
  DROP TABLE "recruitment_note_health_insurance_family" CASCADE;
  DROP TABLE "recruitment_note_mobilization_family_members" CASCADE;
  DROP TABLE "recruitment_note_repatriation_family_members" CASCADE;
  DROP TABLE "recruitment_note_workflow_reviews" CASCADE;
  DROP TABLE "recruitment_note" CASCADE;
  DROP TABLE "_recruitment_note_v_version_flexible_allowance_family" CASCADE;
  DROP TABLE "_recruitment_note_v_version_health_insurance_family" CASCADE;
  DROP TABLE "_recruitment_note_v_version_mobilization_family_members" CASCADE;
  DROP TABLE "_recruitment_note_v_version_repatriation_family_members" CASCADE;
  DROP TABLE "_recruitment_note_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_recruitment_note_v" CASCADE;
  DROP TABLE "recruitment_note_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_recruitment_note_fk";
  
  DROP INDEX "payload_locked_documents_rels_recruitment_note_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "recruitment_note_id";
  DROP TYPE "public"."enum_recruitment_note_flexible_allowance_family";
  DROP TYPE "public"."enum_recruitment_note_health_insurance_family";
  DROP TYPE "public"."enum_recruitment_note_mobilization_family_members";
  DROP TYPE "public"."enum_recruitment_note_repatriation_family_members";
  DROP TYPE "public"."enum_recruitment_note_workflow_reviews_response";
  DROP TYPE "public"."enum_recruitment_note_social_status";
  DROP TYPE "public"."enum_recruitment_note_budget_status";
  DROP TYPE "public"."enum_recruitment_note_housing";
  DROP TYPE "public"."enum_recruitment_note_education_allowance";
  DROP TYPE "public"."enum_recruitment_note_workflow_status";
  DROP TYPE "public"."enum__recruitment_note_v_version_flexible_allowance_family";
  DROP TYPE "public"."enum__recruitment_note_v_version_health_insurance_family";
  DROP TYPE "public"."enum__recruitment_note_v_version_mobilization_family_members";
  DROP TYPE "public"."enum__recruitment_note_v_version_repatriation_family_members";
  DROP TYPE "public"."enum__recruitment_note_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__recruitment_note_v_version_social_status";
  DROP TYPE "public"."enum__recruitment_note_v_version_budget_status";
  DROP TYPE "public"."enum__recruitment_note_v_version_housing";
  DROP TYPE "public"."enum__recruitment_note_v_version_education_allowance";
  DROP TYPE "public"."enum__recruitment_note_v_version_workflow_status";`)
}
