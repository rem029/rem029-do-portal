import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_offer_letter_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_offer_letter_social_relocation_social" AS ENUM('single', 'family');
  CREATE TYPE "public"."enum_offer_letter_social_relocation_class_of_travel" AS ENUM('economy', 'business');
  CREATE TYPE "public"."enum_offer_letter_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__offer_letter_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__offer_letter_v_version_social_relocation_social" AS ENUM('single', 'family');
  CREATE TYPE "public"."enum__offer_letter_v_version_social_relocation_class_of_travel" AS ENUM('economy', 'business');
  CREATE TYPE "public"."enum__offer_letter_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "offer_letter_workflow_reviews" (
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
  	"signature" varchar
  );
  
  CREATE TABLE "offer_letter" (
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
  
  CREATE TABLE "_offer_letter_v_version_workflow_reviews" (
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
  	"_uuid" varchar
  );
  
  CREATE TABLE "_offer_letter_v" (
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
  
  CREATE TABLE "offer_letter_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"header_image_id" uuid,
  	"footer_image_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "offer_letter_id" uuid;
  ALTER TABLE "offer_letter_workflow_reviews" ADD CONSTRAINT "offer_letter_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offer_letter"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_job_department_id_departments_id_fk" FOREIGN KEY ("job_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter" ADD CONSTRAINT "offer_letter_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" ADD CONSTRAINT "_offer_letter_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offer_letter_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_parent_id_offer_letter_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offer_letter"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_job_department_id_departments_id_fk" FOREIGN KEY ("version_job_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offer_letter_v" ADD CONSTRAINT "_offer_letter_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_header_image_id_internal_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_footer_image_id_internal_media_id_fk" FOREIGN KEY ("footer_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "offer_letter_workflow_reviews_order_idx" ON "offer_letter_workflow_reviews" USING btree ("_order");
  CREATE INDEX "offer_letter_workflow_reviews_parent_id_idx" ON "offer_letter_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "offer_letter_job_department_idx" ON "offer_letter" USING btree ("job_department_id");
  CREATE INDEX "offer_letter_operator_idx" ON "offer_letter" USING btree ("operator_id");
  CREATE INDEX "offer_letter_created_by_idx" ON "offer_letter" USING btree ("created_by_id");
  CREATE INDEX "offer_letter_updated_by_idx" ON "offer_letter" USING btree ("updated_by_id");
  CREATE INDEX "offer_letter_updated_at_idx" ON "offer_letter" USING btree ("updated_at");
  CREATE INDEX "offer_letter_created_at_idx" ON "offer_letter" USING btree ("created_at");
  CREATE INDEX "_offer_letter_v_version_workflow_reviews_order_idx" ON "_offer_letter_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_offer_letter_v_version_workflow_reviews_parent_id_idx" ON "_offer_letter_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_offer_letter_v_parent_idx" ON "_offer_letter_v" USING btree ("parent_id");
  CREATE INDEX "_offer_letter_v_version_version_job_department_idx" ON "_offer_letter_v" USING btree ("version_job_department_id");
  CREATE INDEX "_offer_letter_v_version_version_operator_idx" ON "_offer_letter_v" USING btree ("version_operator_id");
  CREATE INDEX "_offer_letter_v_version_version_created_by_idx" ON "_offer_letter_v" USING btree ("version_created_by_id");
  CREATE INDEX "_offer_letter_v_version_version_updated_by_idx" ON "_offer_letter_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_offer_letter_v_version_version_updated_at_idx" ON "_offer_letter_v" USING btree ("version_updated_at");
  CREATE INDEX "_offer_letter_v_version_version_created_at_idx" ON "_offer_letter_v" USING btree ("version_created_at");
  CREATE INDEX "_offer_letter_v_created_at_idx" ON "_offer_letter_v" USING btree ("created_at");
  CREATE INDEX "_offer_letter_v_updated_at_idx" ON "_offer_letter_v" USING btree ("updated_at");
  CREATE INDEX "offer_letter_settings_header_image_idx" ON "offer_letter_settings" USING btree ("header_image_id");
  CREATE INDEX "offer_letter_settings_footer_image_idx" ON "offer_letter_settings" USING btree ("footer_image_id");
  CREATE INDEX "offer_letter_settings_created_by_idx" ON "offer_letter_settings" USING btree ("created_by_id");
  CREATE INDEX "offer_letter_settings_updated_by_idx" ON "offer_letter_settings" USING btree ("updated_by_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offer_letter_fk" FOREIGN KEY ("offer_letter_id") REFERENCES "public"."offer_letter"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_offer_letter_id_idx" ON "payload_locked_documents_rels" USING btree ("offer_letter_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offer_letter_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offer_letter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offer_letter_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offer_letter_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "offer_letter_workflow_reviews" CASCADE;
  DROP TABLE "offer_letter" CASCADE;
  DROP TABLE "_offer_letter_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_offer_letter_v" CASCADE;
  DROP TABLE "offer_letter_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_offer_letter_fk";
  
  DROP INDEX "payload_locked_documents_rels_offer_letter_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "offer_letter_id";
  DROP TYPE "public"."enum_offer_letter_workflow_reviews_response";
  DROP TYPE "public"."enum_offer_letter_social_relocation_social";
  DROP TYPE "public"."enum_offer_letter_social_relocation_class_of_travel";
  DROP TYPE "public"."enum_offer_letter_workflow_status";
  DROP TYPE "public"."enum__offer_letter_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__offer_letter_v_version_social_relocation_social";
  DROP TYPE "public"."enum__offer_letter_v_version_social_relocation_class_of_travel";
  DROP TYPE "public"."enum__offer_letter_v_version_workflow_status";`)
}
