import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_dashboard_settings_dashboard_items" ADD COLUMN IF NOT EXISTS "title" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_dashboard_settings_dashboard_items" DROP COLUMN IF EXISTS "title";`)
}
