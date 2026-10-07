import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_analytics_event_type' AND e.enumlabel = 'search') THEN
        ALTER TYPE "public"."enum_analytics_event_type" ADD VALUE 'search';
      END IF;
    END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "analytics" ALTER COLUMN "event_type" SET DATA TYPE text;
    DROP TYPE IF EXISTS "public"."enum_analytics_event_type";
    CREATE TYPE "public"."enum_analytics_event_type" AS ENUM('page_view', 'click', 'form_submission', 'error', 'video_started', 'video_ended');
    ALTER TABLE "analytics" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_analytics_event_type" USING "event_type"::"public"."enum_analytics_event_type";`)
}
