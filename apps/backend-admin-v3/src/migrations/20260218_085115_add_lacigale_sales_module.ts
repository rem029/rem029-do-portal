import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "lacigale_sales" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "date" timestamp(3) with time zone NOT NULL,
    "rooms_no_rooms_occupied" numeric,
    "rooms_complimentary_house_use" numeric,
    "rooms_occupancy_percentage" numeric,
    "rooms_average_room_rate" numeric,
    "rooms_rooms_revenue" numeric,
    "fb_sales_sky_view" numeric,
    "fb_sales_shisha_garden" numeric,
    "fb_sales_sushi_bar" numeric,
    "fb_sales_traiteur" numeric,
    "fb_sales_odc_special_contracts" numeric,
    "fb_sales_di_capri" numeric,
    "fb_sales_le_cigalon" numeric,
    "fb_sales_lobby_lounge" numeric,
    "fb_sales_mini_bar" numeric,
    "fb_sales_orangery" numeric,
    "fb_sales_room_service" numeric,
    "fb_sales_banquets" numeric,
    "fb_sales_ramadan_tent" numeric,
    "misc_telephone" numeric,
    "misc_business_center" numeric,
    "misc_laundry" numeric,
    "misc_spa_and_recreation" numeric,
    "misc_hotel_taxi" numeric,
    "misc_cigar_shop" numeric,
    "misc_space_rental" numeric,
    "misc_flower_shop" numeric,
    "misc_other_misc" numeric,
    "total_fb_sales" numeric,
    "total_misc_sales" numeric,
    "grand_total_column" numeric,
    "created_by_id" uuid,
    "updated_by_id" uuid,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "lacigale_sales_report" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );
  
  
  ALTER TABLE IF EXISTS "lacigale_fb_sales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_lacigale_fb_sales_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "lacigale_fb_sales" CASCADE;
  DROP TABLE IF EXISTS "_lacigale_fb_sales_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lacigale_fb_sales_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_lacigale_fb_sales_id_idx";

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lacigale_sales_id" uuid;
  ALTER TABLE "lacigale_sales" ADD CONSTRAINT "lacigale_sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lacigale_sales" ADD CONSTRAINT "lacigale_sales_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX IF NOT EXISTS "lacigale_sales_date_idx" ON "lacigale_sales" USING btree ("date");
  CREATE INDEX IF NOT EXISTS "lacigale_sales_created_by_idx" ON "lacigale_sales" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "lacigale_sales_updated_by_idx" ON "lacigale_sales" USING btree ("updated_at"); -- Re-synced with typical Payload indexing
  CREATE INDEX IF NOT EXISTS "lacigale_sales_updated_at_idx" ON "lacigale_sales" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "lacigale_sales_created_at_idx" ON "lacigale_sales" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lacigale_sales_fk" FOREIGN KEY ("lacigale_sales_id") REFERENCES "public"."lacigale_sales"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lacigale_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("lacigale_sales_id");
  
  
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lacigale_fb_sales_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Down migration adjustments to match Up changes
  ALTER TABLE IF EXISTS "lacigale_sales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "lacigale_sales_report" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "lacigale_sales" CASCADE;
  DROP TABLE IF EXISTS "lacigale_sales_report" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lacigale_sales_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_lacigale_sales_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lacigale_fb_sales_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lacigale_sales_id";`)
}
