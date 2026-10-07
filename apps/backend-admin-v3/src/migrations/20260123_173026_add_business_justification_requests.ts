import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bsn_just_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_bsn_just_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__bsn_just_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__bsn_just_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "bsn_just_workflow_reviews" (
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
  
  CREATE TABLE "bsn_just" (
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
  	"workflow_status" "enum_bsn_just_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_bsn_just_v_version_workflow_reviews" (
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
  
  CREATE TABLE "_bsn_just_v" (
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
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bsn_just_id" uuid;
  ALTER TABLE "bsn_just_workflow_reviews" ADD CONSTRAINT "bsn_just_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bsn_just" ADD CONSTRAINT "bsn_just_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" ADD CONSTRAINT "_bsn_just_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bsn_just_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_parent_id_bsn_just_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bsn_just"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bsn_just_v" ADD CONSTRAINT "_bsn_just_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "bsn_just_workflow_reviews_order_idx" ON "bsn_just_workflow_reviews" USING btree ("_order");
  CREATE INDEX "bsn_just_workflow_reviews_parent_id_idx" ON "bsn_just_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "bsn_just_employee_department_idx" ON "bsn_just" USING btree ("employee_department_id");
  CREATE INDEX "bsn_just_attachments_idx" ON "bsn_just" USING btree ("attachments_id");
  CREATE INDEX "bsn_just_operator_idx" ON "bsn_just" USING btree ("operator_id");
  CREATE INDEX "bsn_just_created_by_idx" ON "bsn_just" USING btree ("created_by_id");
  CREATE INDEX "bsn_just_updated_by_idx" ON "bsn_just" USING btree ("updated_by_id");
  CREATE INDEX "bsn_just_updated_at_idx" ON "bsn_just" USING btree ("updated_at");
  CREATE INDEX "bsn_just_created_at_idx" ON "bsn_just" USING btree ("created_at");
  CREATE INDEX "_bsn_just_v_version_workflow_reviews_order_idx" ON "_bsn_just_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_bsn_just_v_version_workflow_reviews_parent_id_idx" ON "_bsn_just_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_bsn_just_v_parent_idx" ON "_bsn_just_v" USING btree ("parent_id");
  CREATE INDEX "_bsn_just_v_version_version_employee_department_idx" ON "_bsn_just_v" USING btree ("version_employee_department_id");
  CREATE INDEX "_bsn_just_v_version_version_attachments_idx" ON "_bsn_just_v" USING btree ("version_attachments_id");
  CREATE INDEX "_bsn_just_v_version_version_operator_idx" ON "_bsn_just_v" USING btree ("version_operator_id");
  CREATE INDEX "_bsn_just_v_version_version_created_by_idx" ON "_bsn_just_v" USING btree ("version_created_by_id");
  CREATE INDEX "_bsn_just_v_version_version_updated_by_idx" ON "_bsn_just_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_bsn_just_v_version_version_updated_at_idx" ON "_bsn_just_v" USING btree ("version_updated_at");
  CREATE INDEX "_bsn_just_v_version_version_created_at_idx" ON "_bsn_just_v" USING btree ("version_created_at");
  CREATE INDEX "_bsn_just_v_created_at_idx" ON "_bsn_just_v" USING btree ("created_at");
  CREATE INDEX "_bsn_just_v_updated_at_idx" ON "_bsn_just_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_justifications_fk" FOREIGN KEY ("bsn_just_id") REFERENCES "public"."bsn_just"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bsn_just_id_idx" ON "payload_locked_documents_rels" USING btree ("bsn_just_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bsn_just_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bsn_just" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bsn_just_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bsn_just_workflow_reviews" CASCADE;
  DROP TABLE "bsn_just" CASCADE;
  DROP TABLE "_bsn_just_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_bsn_just_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_business_justifications_fk";
  
  DROP INDEX "payload_locked_documents_rels_bsn_just_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bsn_just_id";
  DROP TYPE "public"."enum_bsn_just_workflow_reviews_response";
  DROP TYPE "public"."enum_bsn_just_workflow_status";
  DROP TYPE "public"."enum__bsn_just_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__bsn_just_v_version_workflow_status";`)
}
