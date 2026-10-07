import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_pages_blocks_carousel_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_images_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_embed_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_text_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_buttons_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_header_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_filter_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "menu_pages_blocks_items_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_carousel_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_images_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_embed_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_text_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_buttons_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_header_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_filter_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;
  ALTER TABLE "_menu_pages_v_blocks_items_locales" ADD COLUMN IF NOT EXISTS "settings_class_name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_pages_blocks_carousel_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_images_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_embed_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_text_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_buttons_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_header_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_filter_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "menu_pages_blocks_items_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_carousel_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_images_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_embed_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_text_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_buttons_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_header_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_filter_locales" DROP COLUMN IF EXISTS "settings_class_name";
  ALTER TABLE "_menu_pages_v_blocks_items_locales" DROP COLUMN IF EXISTS "settings_class_name";`)
}
