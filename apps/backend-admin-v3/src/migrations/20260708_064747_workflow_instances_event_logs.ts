import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_workflow_instances_event_logs_type" AS ENUM(
        'responded', 'auto_skipped', 'loop_back', 'completed', 'rejected',
        'notification_sent', 'reassigned', 'blueprint_synced'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "workflow_instances_event_logs" (
      "_order"     integer NOT NULL,
      "_parent_id" uuid    NOT NULL,
      "id"         varchar PRIMARY KEY NOT NULL,
      "type"       "enum_workflow_instances_event_logs_type",
      "timestamp"  timestamp(3) with time zone,
      "actor"      varchar,
      "step_label" varchar,
      "step_slug"  varchar,
      "details"    jsonb
    );

    DO $$ BEGIN
      ALTER TABLE "workflow_instances_event_logs"
        ADD CONSTRAINT "workflow_instances_event_logs_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_instances"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "workflow_instances_event_logs_order_idx"
      ON "workflow_instances_event_logs" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "workflow_instances_event_logs_parent_id_idx"
      ON "workflow_instances_event_logs" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "workflow_instances_event_logs" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_workflow_instances_event_logs_type";
  `)
}
