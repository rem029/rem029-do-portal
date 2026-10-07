import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_pages_blocks_filter" ADD COLUMN IF NOT EXISTS "c_show_availability_filters" boolean DEFAULT false;
  ALTER TABLE "_menu_pages_v_blocks_filter" ADD COLUMN IF NOT EXISTS "c_show_availability_filters" boolean DEFAULT false;
  ALTER TABLE "fnb_menu_events_blocks_filter" ADD COLUMN IF NOT EXISTS "c_show_availability_filters" boolean DEFAULT false;
  ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "c_filter_show_availability_filters" boolean DEFAULT false;
  ALTER TABLE "_fnb_menu_events_v_blocks_filter" ADD COLUMN IF NOT EXISTS "c_show_availability_filters" boolean DEFAULT false;
  ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_c_filter_show_availability_filters" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_pages_blocks_filter" DROP COLUMN IF EXISTS "c_show_availability_filters";
  ALTER TABLE "_menu_pages_v_blocks_filter" DROP COLUMN IF EXISTS "c_show_availability_filters";
  ALTER TABLE "fnb_menu_events_blocks_filter" DROP COLUMN IF EXISTS "c_show_availability_filters";
  ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "c_filter_show_availability_filters";
  ALTER TABLE "_fnb_menu_events_v_blocks_filter" DROP COLUMN IF EXISTS "c_show_availability_filters";
  ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_c_filter_show_availability_filters";`)
}
