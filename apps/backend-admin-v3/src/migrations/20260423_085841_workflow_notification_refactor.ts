import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "notify_originator_on_approval";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "ignore_future_notifications";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "notify_originator_on_approval" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "ignore_future_notifications" boolean DEFAULT false;`)
}
