import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_dashboard_settings" ADD COLUMN IF NOT EXISTS "background_image_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "home_dashboard_settings" ADD CONSTRAINT "home_dashboard_settings_background_image_id_internal_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "home_dashboard_settings_background_image_idx" ON "home_dashboard_settings" USING btree ("background_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_dashboard_settings" DROP CONSTRAINT IF EXISTS "home_dashboard_settings_background_image_id_internal_media_id_fk";
  DROP INDEX IF EXISTS "home_dashboard_settings_background_image_idx";
  ALTER TABLE "home_dashboard_settings" DROP COLUMN IF EXISTS "background_image_id";`)
}
