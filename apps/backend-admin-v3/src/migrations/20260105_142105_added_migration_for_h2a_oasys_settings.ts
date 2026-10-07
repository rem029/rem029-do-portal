import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'cleanup-payload-auditor-log');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'h2a-oasys-refresh' BEFORE 'cleanup-payload-auditor-log';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'h2a-oasys-refresh' BEFORE 'cleanup-payload-auditor-log';
  CREATE TABLE "h2a_oasys_settings_divisions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "h2a_oasys_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"base_url" varchar,
  	"client_id" varchar,
  	"secret" varchar,
  	"last_token_response" varchar,
  	"last_token_response_updated_by" timestamp(3) with time zone,
  	"employee_info_last_updated_at" timestamp(3) with time zone,
  	"employee_info" varchar,
  	"employee_doj_last_updated_at" timestamp(3) with time zone,
  	"employee_doj" varchar,
  	"employee_budget_last_updated_at" timestamp(3) with time zone,
  	"employee_budget" varchar,
  	"employee_probation_last_updated_at" timestamp(3) with time zone,
  	"employee_probation" varchar,
  	"employee_on_leave_last_updated_at" timestamp(3) with time zone,
  	"employee_on_leave" varchar,
  	"employee_leave_history_last_updated_at" timestamp(3) with time zone,
  	"employee_on_leave_history" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_jobs_log" ADD COLUMN "parent_task_slug" "enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs_log" ADD COLUMN "parent_task_i_d" varchar;
  ALTER TABLE "h2a_oasys_settings_divisions" ADD CONSTRAINT "h2a_oasys_settings_divisions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."h2a_oasys_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "h2a_oasys_settings" ADD CONSTRAINT "h2a_oasys_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "h2a_oasys_settings" ADD CONSTRAINT "h2a_oasys_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "h2a_oasys_settings_divisions_order_idx" ON "h2a_oasys_settings_divisions" USING btree ("_order");
  CREATE INDEX "h2a_oasys_settings_divisions_parent_id_idx" ON "h2a_oasys_settings_divisions" USING btree ("_parent_id");
  CREATE INDEX "h2a_oasys_settings_created_by_idx" ON "h2a_oasys_settings" USING btree ("created_by_id");
  CREATE INDEX "h2a_oasys_settings_updated_by_idx" ON "h2a_oasys_settings" USING btree ("updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "h2a_oasys_settings_divisions" CASCADE;
  DROP TABLE "h2a_oasys_settings" CASCADE;
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'cleanup-payload-auditor-log');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'cleanup-payload-auditor-log');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "payload_jobs_log" DROP COLUMN "parent_task_slug";
  ALTER TABLE "payload_jobs_log" DROP COLUMN "parent_task_i_d";
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";`)
}
