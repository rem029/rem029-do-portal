import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payload_jobs_stats') THEN
        ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DROP TABLE IF EXISTS "audit_logs" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_audit_logs_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DELETE FROM "payload_jobs_log" WHERE "task_slug" = 'cleanup-payload-auditor-log';
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'h2a-oasys-sync-department');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE text;
  DELETE FROM "payload_jobs_log" WHERE "parent_task_slug" = 'cleanup-payload-auditor-log';
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_parent_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'h2a-oasys-sync-department');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_parent_task_slug" USING "parent_task_slug"::"public"."enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DELETE FROM "payload_jobs" WHERE "task_slug" = 'cleanup-payload-auditor-log';
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'h2a-oasys-sync-department');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "payload_jobs" DROP COLUMN IF EXISTS "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "audit_logs_id";
  DROP TYPE IF EXISTS "public"."enum_audit_logs_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_logs_type" AS ENUM('info', 'debug', 'warning', 'error', 'audit', 'security', 'unknown');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'cleanup-payload-auditor-log';
  ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'cleanup-payload-auditor-log';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'cleanup-payload-auditor-log';
  CREATE TABLE "audit_logs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operation" varchar NOT NULL,
  	"on_collection" varchar NOT NULL,
  	"document_id" varchar,
  	"user_id" uuid NOT NULL,
  	"user_agent" varchar,
  	"hook" varchar,
  	"type" "enum_audit_logs_type" DEFAULT 'info' NOT NULL,
  	"created_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" uuid;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)
}
