import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "event_enabled" boolean DEFAULT false;
    ALTER TABLE "_restaurants_v" ADD COLUMN IF NOT EXISTS "version_event_enabled" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "event_enabled";
    ALTER TABLE "_restaurants_v" DROP COLUMN IF EXISTS "version_event_enabled";
  `)
}
