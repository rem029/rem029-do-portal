import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "notify_creator" boolean DEFAULT false;
  ALTER TABLE "forms_locales" ADD COLUMN IF NOT EXISTS "creator_notification_content" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP COLUMN IF EXISTS "notify_creator";
  ALTER TABLE "forms_locales" DROP COLUMN IF EXISTS "creator_notification_content";`)
}
