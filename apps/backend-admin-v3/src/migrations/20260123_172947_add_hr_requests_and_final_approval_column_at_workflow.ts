import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hr_requests_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_hr_requests_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__hr_requests_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__hr_requests_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "hr_requests_workflow_reviews" (
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
  
  CREATE TABLE "hr_requests" (
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
  	"workflow_status" "enum_hr_requests_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_hr_requests_v_version_workflow_reviews" (
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
  
  CREATE TABLE "_hr_requests_v" (
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
  
  ALTER TABLE "workflow_steps" ADD COLUMN "final_approval" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_requests_id" uuid;
  ALTER TABLE "hr_requests_settings" ADD COLUMN "cutoff_day" numeric DEFAULT 15 NOT NULL;
  ALTER TABLE "business_justifications_settings" ADD COLUMN "cutoff_day" numeric DEFAULT 15 NOT NULL;
  ALTER TABLE "hr_requests_workflow_reviews" ADD CONSTRAINT "hr_requests_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_requests" ADD CONSTRAINT "hr_requests_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" ADD CONSTRAINT "_hr_requests_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hr_requests_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_parent_id_hr_requests_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_requests_v" ADD CONSTRAINT "_hr_requests_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hr_requests_workflow_reviews_order_idx" ON "hr_requests_workflow_reviews" USING btree ("_order");
  CREATE INDEX "hr_requests_workflow_reviews_parent_id_idx" ON "hr_requests_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "hr_requests_employee_department_idx" ON "hr_requests" USING btree ("employee_department_id");
  CREATE INDEX "hr_requests_attachments_idx" ON "hr_requests" USING btree ("attachments_id");
  CREATE INDEX "hr_requests_operator_idx" ON "hr_requests" USING btree ("operator_id");
  CREATE INDEX "hr_requests_created_by_idx" ON "hr_requests" USING btree ("created_by_id");
  CREATE INDEX "hr_requests_updated_by_idx" ON "hr_requests" USING btree ("updated_by_id");
  CREATE INDEX "hr_requests_updated_at_idx" ON "hr_requests" USING btree ("updated_at");
  CREATE INDEX "hr_requests_created_at_idx" ON "hr_requests" USING btree ("created_at");
  CREATE INDEX "_hr_requests_v_version_workflow_reviews_order_idx" ON "_hr_requests_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_hr_requests_v_version_workflow_reviews_parent_id_idx" ON "_hr_requests_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_hr_requests_v_parent_idx" ON "_hr_requests_v" USING btree ("parent_id");
  CREATE INDEX "_hr_requests_v_version_version_employee_department_idx" ON "_hr_requests_v" USING btree ("version_employee_department_id");
  CREATE INDEX "_hr_requests_v_version_version_attachments_idx" ON "_hr_requests_v" USING btree ("version_attachments_id");
  CREATE INDEX "_hr_requests_v_version_version_operator_idx" ON "_hr_requests_v" USING btree ("version_operator_id");
  CREATE INDEX "_hr_requests_v_version_version_created_by_idx" ON "_hr_requests_v" USING btree ("version_created_by_id");
  CREATE INDEX "_hr_requests_v_version_version_updated_by_idx" ON "_hr_requests_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_hr_requests_v_version_version_updated_at_idx" ON "_hr_requests_v" USING btree ("version_updated_at");
  CREATE INDEX "_hr_requests_v_version_version_created_at_idx" ON "_hr_requests_v" USING btree ("version_created_at");
  CREATE INDEX "_hr_requests_v_created_at_idx" ON "_hr_requests_v" USING btree ("created_at");
  CREATE INDEX "_hr_requests_v_updated_at_idx" ON "_hr_requests_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_requests_fk" FOREIGN KEY ("hr_requests_id") REFERENCES "public"."hr_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hr_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_requests_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hr_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hr_requests_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hr_requests_workflow_reviews" CASCADE;
  DROP TABLE "hr_requests" CASCADE;
  DROP TABLE "_hr_requests_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_hr_requests_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_hr_requests_id_idx";
  ALTER TABLE "workflow_steps" DROP COLUMN "final_approval";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_requests_id";
  ALTER TABLE "hr_requests_settings" DROP COLUMN "cutoff_day";
  ALTER TABLE "business_justifications_settings" DROP COLUMN "cutoff_day";
  DROP TYPE "public"."enum_hr_requests_workflow_reviews_response";
  DROP TYPE "public"."enum_hr_requests_workflow_status";
  DROP TYPE "public"."enum__hr_requests_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__hr_requests_v_version_workflow_status";`)
}
