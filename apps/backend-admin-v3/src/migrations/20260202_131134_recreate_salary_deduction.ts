import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sal_ded_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_sal_ded_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TYPE "public"."enum__sal_ded_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__sal_ded_v_version_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
  CREATE TABLE "sal_ded_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum_sal_ded_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar
  );
  
  CREATE TABLE "sal_ded" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"override_department" boolean DEFAULT false,
  	"employee_department_id" uuid,
  	"employee_id" uuid NOT NULL,
  	"employee_name" varchar,
  	"employee_h2a_id" varchar,
  	"employee_designation" varchar,
  	"employee_department_name" varchar,
  	"employee_operator_name" varchar,
  	"employee_email" varchar,
  	"employee_doj" timestamp(3) with time zone,
  	"subject" varchar NOT NULL,
  	"description" jsonb NOT NULL,
  	"attachments_id" uuid,
  	"wants_to_sign" boolean DEFAULT false,
  	"requestor_signature" varchar,
  	"bypass_day_restriction" boolean DEFAULT false,
  	"workflow_status" "enum_sal_ded_workflow_status" DEFAULT 'draft',
  	"_workflow_status" varchar DEFAULT 'draft',
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sal_ded_v_version_workflow_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"comments" varchar,
  	"reviewer" varchar,
  	"status_slug" varchar,
  	"response" "enum__sal_ded_v_version_workflow_reviews_response",
  	"reviewed_by" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"signature" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sal_ded_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_override_department" boolean DEFAULT false,
  	"version_employee_department_id" uuid,
  	"version_employee_id" uuid NOT NULL,
  	"version_employee_name" varchar,
  	"version_employee_h2a_id" varchar,
  	"version_employee_designation" varchar,
  	"version_employee_department_name" varchar,
  	"version_employee_operator_name" varchar,
  	"version_employee_email" varchar,
  	"version_employee_doj" timestamp(3) with time zone,
  	"version_subject" varchar NOT NULL,
  	"version_description" jsonb NOT NULL,
  	"version_attachments_id" uuid,
  	"version_wants_to_sign" boolean DEFAULT false,
  	"version_requestor_signature" varchar,
  	"version_bypass_day_restriction" boolean DEFAULT false,
  	"version_workflow_status" "enum__sal_ded_v_version_workflow_status" DEFAULT 'draft',
  	"version__workflow_status" varchar DEFAULT 'draft',
  	"version_operator_id" uuid,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sal_ded_id" uuid;
  ALTER TABLE "sal_ded_workflow_reviews" ADD CONSTRAINT "sal_ded_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sal_ded"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_employee_department_id_departments_id_fk" FOREIGN KEY ("employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_attachments_id_internal_media_id_fk" FOREIGN KEY ("attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD CONSTRAINT "_sal_ded_v_version_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sal_ded_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_parent_id_sal_ded_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sal_ded"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_employee_department_id_departments_id_fk" FOREIGN KEY ("version_employee_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_employee_id_users_id_fk" FOREIGN KEY ("version_employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_attachments_id_internal_media_id_fk" FOREIGN KEY ("version_attachments_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "sal_ded_workflow_reviews_order_idx" ON "sal_ded_workflow_reviews" USING btree ("_order");
  CREATE INDEX "sal_ded_workflow_reviews_parent_id_idx" ON "sal_ded_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "sal_ded_employee_department_idx" ON "sal_ded" USING btree ("employee_department_id");
  CREATE INDEX "sal_ded_employee_idx" ON "sal_ded" USING btree ("employee_id");
  CREATE INDEX "sal_ded_attachments_idx" ON "sal_ded" USING btree ("attachments_id");
  CREATE INDEX "sal_ded_operator_idx" ON "sal_ded" USING btree ("operator_id");
  CREATE INDEX "sal_ded_created_by_idx" ON "sal_ded" USING btree ("created_by_id");
  CREATE INDEX "sal_ded_updated_by_idx" ON "sal_ded" USING btree ("updated_by_id");
  CREATE INDEX "sal_ded_updated_at_idx" ON "sal_ded" USING btree ("updated_at");
  CREATE INDEX "sal_ded_created_at_idx" ON "sal_ded" USING btree ("created_at");
  CREATE INDEX "_sal_ded_v_version_workflow_reviews_order_idx" ON "_sal_ded_v_version_workflow_reviews" USING btree ("_order");
  CREATE INDEX "_sal_ded_v_version_workflow_reviews_parent_id_idx" ON "_sal_ded_v_version_workflow_reviews" USING btree ("_parent_id");
  CREATE INDEX "_sal_ded_v_parent_idx" ON "_sal_ded_v" USING btree ("parent_id");
  CREATE INDEX "_sal_ded_v_version_version_employee_department_idx" ON "_sal_ded_v" USING btree ("version_employee_department_id");
  CREATE INDEX "_sal_ded_v_version_version_employee_idx" ON "_sal_ded_v" USING btree ("version_employee_id");
  CREATE INDEX "_sal_ded_v_version_version_attachments_idx" ON "_sal_ded_v" USING btree ("version_attachments_id");
  CREATE INDEX "_sal_ded_v_version_version_operator_idx" ON "_sal_ded_v" USING btree ("version_operator_id");
  CREATE INDEX "_sal_ded_v_version_version_created_by_idx" ON "_sal_ded_v" USING btree ("version_created_by_id");
  CREATE INDEX "_sal_ded_v_version_version_updated_by_idx" ON "_sal_ded_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_sal_ded_v_version_version_updated_at_idx" ON "_sal_ded_v" USING btree ("version_updated_at");
  CREATE INDEX "_sal_ded_v_version_version_created_at_idx" ON "_sal_ded_v" USING btree ("version_created_at");
  CREATE INDEX "_sal_ded_v_created_at_idx" ON "_sal_ded_v" USING btree ("created_at");
  CREATE INDEX "_sal_ded_v_updated_at_idx" ON "_sal_ded_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_salary_deduction_fk" FOREIGN KEY ("sal_ded_id") REFERENCES "public"."sal_ded"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sal_ded_id_idx" ON "payload_locked_documents_rels" USING btree ("sal_ded_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sal_ded" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sal_ded_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sal_ded_workflow_reviews" CASCADE;
  DROP TABLE "sal_ded" CASCADE;
  DROP TABLE "_sal_ded_v_version_workflow_reviews" CASCADE;
  DROP TABLE "_sal_ded_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_salary_deduction_fk";
  
  DROP INDEX "payload_locked_documents_rels_sal_ded_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sal_ded_id";
  DROP TYPE "public"."enum_sal_ded_workflow_reviews_response";
  DROP TYPE "public"."enum_sal_ded_workflow_status";
  DROP TYPE "public"."enum__sal_ded_v_version_workflow_reviews_response";
  DROP TYPE "public"."enum__sal_ded_v_version_workflow_status";`)
}
