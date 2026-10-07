import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_end_of_service_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_end_of_service_payment_method" AS ENUM('bank_transfer', 'check', 'cash', 'other');
  CREATE TYPE "public"."enum_end_of_service_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__end_of_service_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__end_of_service_v_version_payment_method" AS ENUM('bank_transfer', 'check', 'cash', 'other');
  CREATE TYPE "public"."enum__end_of_service_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "end_of_service_workflow_reviews" (
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
  	"signature" varchar
  );
  
  CREATE TABLE "end_of_service" (
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
  
  CREATE TABLE "_end_of_service_v_version_workflow_reviews" (
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
  	"_uuid" varchar
  );
  
  CREATE TABLE "_end_of_service_v" (
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
  
  CREATE TABLE "end_of_service_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"xlsx_template_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "end_of_service_id" uuid;
  ALTER TABLE "end_of_service_workflow_reviews" ADD CONSTRAINT "end_of_service_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."end_of_service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service" ADD CONSTRAINT "end_of_service_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" ADD CONSTRAINT "_end_of_service_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_end_of_service_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_parent_id_end_of_service_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."end_of_service"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_department_id_departments_id_fk" FOREIGN KEY ("version_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_end_of_service_v" ADD CONSTRAINT "_end_of_service_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_xlsx_template_id_internal_media_id_fk" FOREIGN KEY ("xlsx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "end_of_service_settings" ADD CONSTRAINT "end_of_service_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "end_of_service_workflow_reviews_order_idx" ON "end_of_service_workflow_reviews" USING btree ("_order");
  CREATE INDEX "end_of_service_workflow_reviews_parent_id_idx" ON "end_of_service_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "end_of_service_department_idx" ON "end_of_service" USING btree ("department_id");
  CREATE INDEX "end_of_service_operator_idx" ON "end_of_service" USING btree ("operator_id");
  CREATE INDEX "end_of_service_created_by_idx" ON "end_of_service" USING btree ("created_by_id");
  CREATE INDEX "end_of_service_updated_by_idx" ON "end_of_service" USING btree ("updated_by_id");
  CREATE INDEX "end_of_service_updated_at_idx" ON "end_of_service" USING btree ("updated_at");
  CREATE INDEX "end_of_service_created_at_idx" ON "end_of_service" USING btree ("created_at");
  CREATE INDEX "_end_of_service_v_version_workflow_reviews_order_idx" ON "_end_of_service_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_end_of_service_v_version_workflow_reviews_parent_id_idx" ON "_end_of_service_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_end_of_service_v_parent_idx" ON "_end_of_service_v" USING btree ("parent_id");
  CREATE INDEX "_end_of_service_v_version_version_department_idx" ON "_end_of_service_v" USING btree ("version_department_id");
  CREATE INDEX "_end_of_service_v_version_version_operator_idx" ON "_end_of_service_v" USING btree ("version_operator_id");
  CREATE INDEX "_end_of_service_v_version_version_created_by_idx" ON "_end_of_service_v" USING btree ("version_created_by_id");
  CREATE INDEX "_end_of_service_v_version_version_updated_by_idx" ON "_end_of_service_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_end_of_service_v_version_version_updated_at_idx" ON "_end_of_service_v" USING btree ("version_updated_at");
  CREATE INDEX "_end_of_service_v_version_version_created_at_idx" ON "_end_of_service_v" USING btree ("version_created_at");
  CREATE INDEX "_end_of_service_v_created_at_idx" ON "_end_of_service_v" USING btree ("created_at");
  CREATE INDEX "_end_of_service_v_updated_at_idx" ON "_end_of_service_v" USING btree ("updated_at");
  CREATE INDEX "end_of_service_settings_xlsx_template_idx" ON "end_of_service_settings" USING btree ("xlsx_template_id");
  CREATE INDEX "end_of_service_settings_created_by_idx" ON "end_of_service_settings" USING btree ("created_by_id");
  CREATE INDEX "end_of_service_settings_updated_by_idx" ON "end_of_service_settings" USING btree ("updated_by_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_end_of_service_fk" FOREIGN KEY ("end_of_service_id") REFERENCES "public"."end_of_service"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_end_of_service_id_idx" ON "payload_locked_documents_rels" USING btree ("end_of_service_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "end_of_service_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "end_of_service" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_end_of_service_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "end_of_service_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "end_of_service_workflow_reviews" CASCADE;
  DROP TABLE "end_of_service" CASCADE;
  DROP TABLE "_end_of_service_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_end_of_service_v" CASCADE;
  DROP TABLE "end_of_service_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_end_of_service_fk";
  
  DROP INDEX "payload_locked_documents_rels_end_of_service_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "end_of_service_id";
  DROP TYPE "public"."enum_end_of_service_workflow_reviews_response";
  DROP TYPE "public"."enum_end_of_service_payment_method";
  DROP TYPE "public"."enum_end_of_service_workflow_status";
  DROP TYPE "public"."enum__end_of_service_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__end_of_service_v_version_payment_method";
  DROP TYPE "public"."enum__end_of_service_v_version_workflow_status";`)
}
