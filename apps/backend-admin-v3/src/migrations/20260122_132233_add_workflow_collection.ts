import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workflow_steps_approver_type" AS ENUM('email', 'department', 'requestor_department');
  CREATE TYPE "public"."enum_workflow_steps_rejection_policy" AS ENUM('start', 'previous');
  CREATE TABLE "workflow_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"approver_type" "enum_workflow_steps_approver_type",
  	"approver_email" varchar,
  	"department_id" uuid,
  	"rejection_policy" "enum_workflow_steps_rejection_policy" DEFAULT 'start'
  );
  
  CREATE TABLE "workflow" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"operator_id" uuid NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"slug" varchar NOT NULL,
  	"operator_slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workflow_id" uuid;
  ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workflow" ADD CONSTRAINT "workflow_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow" ADD CONSTRAINT "workflow_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workflow" ADD CONSTRAINT "workflow_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "workflow_steps_order_idx" ON "workflow_steps" USING btree ("_order");
  CREATE INDEX "workflow_steps_parent_id_idx" ON "workflow_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "workflow_steps_slug_idx" ON "workflow_steps" USING btree ("slug");
  CREATE INDEX "workflow_steps_department_idx" ON "workflow_steps" USING btree ("department_id");
  CREATE INDEX "workflow_operator_idx" ON "workflow" USING btree ("operator_id");
  CREATE INDEX "workflow_created_by_idx" ON "workflow" USING btree ("created_by_id");
  CREATE INDEX "workflow_updated_by_idx" ON "workflow" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX "workflow_operator_slug_idx" ON "workflow" USING btree ("operator_slug");
  CREATE INDEX "workflow_updated_at_idx" ON "workflow" USING btree ("updated_at");
  CREATE INDEX "workflow_created_at_idx" ON "workflow" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workflow_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_workflow_id_idx" ON "payload_locked_documents_rels" USING btree ("workflow_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workflow" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "workflow_steps" CASCADE;
  DROP TABLE "workflow" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workflow_fk";
  
  DROP INDEX "payload_locked_documents_rels_workflow_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workflow_id";
  DROP TYPE "public"."enum_workflow_steps_approver_type";
  DROP TYPE "public"."enum_workflow_steps_rejection_policy";`)
}
