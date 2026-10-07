import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "fnb_menu_events_c_carousel_images" (
    	"_order" integer NOT NULL,
    	"_parent_id" uuid NOT NULL,
    	"id" varchar PRIMARY KEY NOT NULL,
    	"image_id" uuid
    );

    CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images" (
    	"_order" integer NOT NULL,
    	"_parent_id" uuid NOT NULL,
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"image_id" uuid,
    	"_uuid" varchar
    );

    ALTER TABLE "menu_pages" ALTER COLUMN "c_show_prices" SET DEFAULT false;
    ALTER TABLE "_menu_pages_v" ALTER COLUMN "version_c_show_prices" SET DEFAULT false;
    ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_show_prices" SET DEFAULT false;
    ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_show_prices" SET DEFAULT false;

    DO $$ BEGIN
      ALTER TABLE "fnb_menu_events_c_carousel_images" ADD CONSTRAINT "fnb_menu_events_c_carousel_images_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "fnb_menu_events_c_carousel_images" ADD CONSTRAINT "fnb_menu_events_c_carousel_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" ADD CONSTRAINT "_fnb_menu_events_v_version_c_carousel_images_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" ADD CONSTRAINT "_fnb_menu_events_v_version_c_carousel_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_order_idx" ON "fnb_menu_events_c_carousel_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_parent_id_idx" ON "fnb_menu_events_c_carousel_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_image_idx" ON "fnb_menu_events_c_carousel_images" USING btree ("image_id");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_order_idx" ON "_fnb_menu_events_v_version_c_carousel_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_parent_id_idx" ON "_fnb_menu_events_v_version_c_carousel_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_image_idx" ON "_fnb_menu_events_v_version_c_carousel_images" USING btree ("image_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "fnb_menu_events_c_carousel_images" CASCADE;
    DROP TABLE IF EXISTS "_fnb_menu_events_v_version_c_carousel_images" CASCADE;

    ALTER TABLE "menu_pages" ALTER COLUMN "c_show_prices" SET DEFAULT true;
    ALTER TABLE "_menu_pages_v" ALTER COLUMN "version_c_show_prices" SET DEFAULT true;
    ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_show_prices" SET DEFAULT true;
    ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_show_prices" SET DEFAULT true;
  `)
}
