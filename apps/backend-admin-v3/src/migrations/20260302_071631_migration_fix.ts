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
    	"fb_sales_sky_view_guests" numeric,
    	"fb_sales_shisha_garden" numeric,
    	"fb_sales_shisha_garden_guests" numeric,
    	"fb_sales_sushi_bar" numeric,
    	"fb_sales_sushi_bar_guests" numeric,
    	"fb_sales_traiteur" numeric,
    	"fb_sales_traiteur_guests" numeric,
    	"fb_sales_odc_special_contracts" numeric,
    	"fb_sales_odc_special_contracts_guests" numeric,
    	"fb_sales_di_capri" numeric,
    	"fb_sales_di_capri_guests" numeric,
    	"fb_sales_le_cigalon" numeric,
    	"fb_sales_le_cigalon_guests" numeric,
    	"fb_sales_lobby_lounge" numeric,
    	"fb_sales_lobby_lounge_guests" numeric,
    	"fb_sales_mini_bar" numeric,
    	"fb_sales_mini_bar_guests" numeric,
    	"fb_sales_orangery" numeric,
    	"fb_sales_orangery_guests" numeric,
    	"fb_sales_room_service" numeric,
    	"fb_sales_room_service_guests" numeric,
    	"fb_sales_banquets" numeric,
    	"fb_sales_banquets_guests" numeric,
    	"fb_sales_ramadan_tent" numeric,
    	"fb_sales_ramadan_tent_guests" numeric,
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
    	"total_fb_guests" numeric,
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
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "lacigale_sales_id" uuid;
    ALTER TABLE "lacigale_sales" DROP CONSTRAINT IF EXISTS "lacigale_sales_created_by_id_users_id_fk";
    ALTER TABLE "lacigale_sales" ADD CONSTRAINT "lacigale_sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "lacigale_sales" DROP CONSTRAINT IF EXISTS "lacigale_sales_updated_by_id_users_id_fk";
    ALTER TABLE "lacigale_sales" ADD CONSTRAINT "lacigale_sales_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX IF NOT EXISTS "lacigale_sales_date_idx" ON "lacigale_sales" USING btree ("date");
    CREATE INDEX IF NOT EXISTS "lacigale_sales_created_by_idx" ON "lacigale_sales" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "lacigale_sales_updated_by_idx" ON "lacigale_sales" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "lacigale_sales_updated_at_idx" ON "lacigale_sales" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "lacigale_sales_created_at_idx" ON "lacigale_sales" USING btree ("created_at");
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lacigale_sales_fk";
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lacigale_sales_fk" FOREIGN KEY ("lacigale_sales_id") REFERENCES "public"."lacigale_sales"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lacigale_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("lacigale_sales_id");
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lacigale_fb_sales_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lacigale_fb_sales" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"date" timestamp(3) with time zone,
    	"fb_sales_sky_view" numeric DEFAULT 0,
    	"fb_sales_shisha_garden" numeric DEFAULT 0,
    	"fb_sales_sushi_bar" numeric DEFAULT 0,
    	"fb_sales_traiteur" numeric DEFAULT 0,
    	"fb_sales_odc_special_contracts" numeric DEFAULT 0,
    	"fb_sales_di_capri" numeric DEFAULT 0,
    	"fb_sales_le_cigalon" numeric DEFAULT 0,
    	"fb_sales_lobby" numeric DEFAULT 0,
    	"fb_sales_mini_bar" numeric DEFAULT 0,
    	"fb_sales_orangery" numeric DEFAULT 0,
    	"fb_sales_room_service" numeric DEFAULT 0,
    	"fb_sales_banquets" numeric DEFAULT 0,
    	"fb_sales_ramadan_tent" numeric DEFAULT 0,
    	"misc_hotel_rooms_revenue" numeric DEFAULT 0,
    	"misc_telephone" numeric DEFAULT 0,
    	"misc_business_center" numeric DEFAULT 0,
    	"misc_laundry" numeric DEFAULT 0,
    	"misc_spa_and_recreation" numeric DEFAULT 0,
    	"misc_hotel_and_taxi" numeric DEFAULT 0,
    	"misc_cigar_shop" numeric DEFAULT 0,
    	"misc_other_misc_al_maha" numeric DEFAULT 0,
    	"misc_space_rental" numeric DEFAULT 0,
    	"misc_flower_shop" numeric DEFAULT 0,
    	"misc_other_misc" numeric DEFAULT 0,
    	"created_by_id" uuid,
    	"updated_by_id" uuid,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "_lacigale_fb_sales_v" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"parent_id" uuid,
    	"version_date" timestamp(3) with time zone,
    	"version_fb_sales_sky_view" numeric DEFAULT 0,
    	"version_fb_sales_shisha_garden" numeric DEFAULT 0,
    	"version_fb_sales_sushi_bar" numeric DEFAULT 0,
    	"version_fb_sales_traiteur" numeric DEFAULT 0,
    	"version_fb_sales_odc_special_contracts" numeric DEFAULT 0,
    	"version_fb_sales_di_capri" numeric DEFAULT 0,
    	"version_fb_sales_le_cigalon" numeric DEFAULT 0,
    	"version_fb_sales_lobby" numeric DEFAULT 0,
    	"version_fb_sales_mini_bar" numeric DEFAULT 0,
    	"version_fb_sales_orangery" numeric DEFAULT 0,
    	"version_fb_sales_room_service" numeric DEFAULT 0,
    	"version_fb_sales_banquets" numeric DEFAULT 0,
    	"version_fb_sales_ramadan_tent" numeric DEFAULT 0,
    	"version_misc_hotel_rooms_revenue" numeric DEFAULT 0,
    	"version_misc_telephone" numeric DEFAULT 0,
    	"version_misc_business_center" numeric DEFAULT 0,
    	"version_misc_laundry" numeric DEFAULT 0,
    	"version_misc_spa_and_recreation" numeric DEFAULT 0,
    	"version_misc_hotel_and_taxi" numeric DEFAULT 0,
    	"version_misc_cigar_shop" numeric DEFAULT 0,
    	"version_misc_other_misc_al_maha" numeric DEFAULT 0,
    	"version_misc_space_rental" numeric DEFAULT 0,
    	"version_misc_flower_shop" numeric DEFAULT 0,
    	"version_misc_other_misc" numeric DEFAULT 0,
    	"version_created_by_id" uuid,
    	"version_updated_by_id" uuid,
    	"version_updated_at" timestamp(3) with time zone,
    	"version_created_at" timestamp(3) with time zone,
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    ALTER TABLE IF EXISTS "lacigale_sales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "lacigale_sales_report" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "lacigale_sales" CASCADE;
    DROP TABLE IF EXISTS "lacigale_sales_report" CASCADE;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lacigale_sales_fk";
    
    DROP INDEX IF EXISTS "payload_locked_documents_rels_lacigale_sales_id_idx";
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "lacigale_fb_sales_id" uuid;
    ALTER TABLE "lacigale_fb_sales" DROP CONSTRAINT IF EXISTS "lacigale_fb_sales_created_by_id_users_id_fk";
    ALTER TABLE "lacigale_fb_sales" ADD CONSTRAINT "lacigale_fb_sales_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "lacigale_fb_sales" DROP CONSTRAINT IF EXISTS "lacigale_fb_sales_updated_by_id_users_id_fk";
    ALTER TABLE "lacigale_fb_sales" ADD CONSTRAINT "lacigale_fb_sales_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_lacigale_fb_sales_v" DROP CONSTRAINT IF EXISTS "_lacigale_fb_sales_v_parent_id_lacigale_fb_sales_id_fk";
    ALTER TABLE "_lacigale_fb_sales_v" ADD CONSTRAINT "_lacigale_fb_sales_v_parent_id_lacigale_fb_sales_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lacigale_fb_sales"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_lacigale_fb_sales_v" DROP CONSTRAINT IF EXISTS "_lacigale_fb_sales_v_version_created_by_id_users_id_fk";
    ALTER TABLE "_lacigale_fb_sales_v" ADD CONSTRAINT "_lacigale_fb_sales_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_lacigale_fb_sales_v" DROP CONSTRAINT IF EXISTS "_lacigale_fb_sales_v_version_updated_by_id_users_id_fk";
    ALTER TABLE "_lacigale_fb_sales_v" ADD CONSTRAINT "_lacigale_fb_sales_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX IF NOT EXISTS "lacigale_fb_sales_date_idx" ON "lacigale_fb_sales" USING btree ("date");
    CREATE INDEX IF NOT EXISTS "lacigale_fb_sales_created_by_idx" ON "lacigale_fb_sales" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "lacigale_fb_sales_updated_by_idx" ON "lacigale_fb_sales" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "lacigale_fb_sales_updated_at_idx" ON "lacigale_fb_sales" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "lacigale_fb_sales_created_at_idx" ON "lacigale_fb_sales" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_parent_idx" ON "_lacigale_fb_sales_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_version_version_date_idx" ON "_lacigale_fb_sales_v" USING btree ("version_date");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_version_version_created_by_idx" ON "_lacigale_fb_sales_v" USING btree ("version_created_by_id");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_version_version_updated_by_idx" ON "_lacigale_fb_sales_v" USING btree ("version_updated_by_id");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_version_version_updated_at_idx" ON "_lacigale_fb_sales_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_version_version_created_at_idx" ON "_lacigale_fb_sales_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_created_at_idx" ON "_lacigale_fb_sales_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_lacigale_fb_sales_v_updated_at_idx" ON "_lacigale_fb_sales_v" USING btree ("updated_at");
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_lacigale_fb_sales_fk";
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lacigale_fb_sales_fk" FOREIGN KEY ("lacigale_fb_sales_id") REFERENCES "public"."lacigale_fb_sales"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lacigale_fb_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("lacigale_fb_sales_id");
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "lacigale_sales_id";`)
}
