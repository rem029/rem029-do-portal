import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_sky_view_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_shisha_garden_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_sushi_bar_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_traiteur_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_odc_special_contracts_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_di_capri_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_le_cigalon_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_lobby_lounge_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_mini_bar_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_orangery_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_room_service_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_banquets_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "fb_sales_ramadan_tent_guests" numeric;
  ALTER TABLE "lacigale_sales" ADD COLUMN "total_fb_guests" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_sky_view_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_shisha_garden_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_sushi_bar_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_traiteur_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_odc_special_contracts_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_di_capri_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_le_cigalon_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_lobby_lounge_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_mini_bar_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_orangery_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_room_service_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_banquets_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "fb_sales_ramadan_tent_guests";
  ALTER TABLE "lacigale_sales" DROP COLUMN "total_fb_guests";`)
}
