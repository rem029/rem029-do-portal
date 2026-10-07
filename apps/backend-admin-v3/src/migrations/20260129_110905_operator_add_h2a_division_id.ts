import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'h2a-oasys-sync-department' BEFORE 'cleanup-payload-auditor-log';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TYPE "public"."enum_payload_jobs_log_parent_task_slug" ADD VALUE 'h2a-oasys-sync-department' BEFORE 'cleanup-payload-auditor-log';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'h2a-oasys-sync-department' BEFORE 'cleanup-payload-auditor-log';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "operators" ADD COLUMN IF NOT EXISTS "h2a_division_id" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "operators_h2a_division_id_idx" ON "operators" USING btree ("h2a_division_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'cleanup-payload-auditor-log');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_parent_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'cleanup-payload-auditor-log');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "parent_task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_parent_task_slug" USING "parent_task_slug"::"public"."enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'h2a-oasys-refresh', 'cleanup-payload-auditor-log');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "operators_h2a_division_id_idx";
  ALTER TABLE "operators" DROP COLUMN IF EXISTS "h2a_division_id";`)
}
