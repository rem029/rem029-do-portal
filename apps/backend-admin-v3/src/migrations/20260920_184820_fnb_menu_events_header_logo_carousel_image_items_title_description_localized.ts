import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "fnb_menu_events_c_carousel_images_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );

  ALTER TABLE "fnb_menu_events_c_carousel_images" DROP CONSTRAINT IF EXISTS "fnb_menu_events_c_carousel_images_image_id_menu_media_id_fk";

  ALTER TABLE "fnb_menu_events" DROP CONSTRAINT IF EXISTS "fnb_menu_events_c_header_logo_id_menu_media_id_fk";

  ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_version_c_carousel_images_image_id_menu_media_id_fk";

  ALTER TABLE "_fnb_menu_events_v" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_version_c_header_logo_id_menu_media_id_fk";

  DROP INDEX IF EXISTS "fnb_menu_events_c_carousel_images_image_idx";
  DROP INDEX IF EXISTS "fnb_menu_events_c_header_c_header_logo_idx";
  DROP INDEX IF EXISTS "_fnb_menu_events_v_version_c_carousel_images_image_idx";
  DROP INDEX IF EXISTS "_fnb_menu_events_v_version_c_header_version_c_header_log_idx";
  ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_handlers" SET DEFAULT 'boh_only';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_primary" SET DEFAULT '#072c1b';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_primary_contrast" SET DEFAULT '#c8b46e';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_bg" SET DEFAULT '#eae7dc';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_text" SET DEFAULT '#252120';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_neutral" SET DEFAULT '#252120';
  ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_handlers" SET DEFAULT 'boh_only';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_primary" SET DEFAULT '#072c1b';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_primary_contrast" SET DEFAULT '#c8b46e';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_bg" SET DEFAULT '#eae7dc';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_text" SET DEFAULT '#252120';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_neutral" SET DEFAULT '#252120';
  ALTER TABLE "fnb_menu_events_locales" ADD COLUMN IF NOT EXISTS "c_header_logo_id" uuid;
  ALTER TABLE "fnb_menu_events_locales" ADD COLUMN IF NOT EXISTS "c_items_title" varchar DEFAULT 'Our Selection';
  ALTER TABLE "fnb_menu_events_locales" ADD COLUMN IF NOT EXISTS "c_items_description" varchar DEFAULT 'Fresh and delicious';
  ALTER TABLE "_fnb_menu_events_v_locales" ADD COLUMN IF NOT EXISTS "version_c_header_logo_id" uuid;
  ALTER TABLE "_fnb_menu_events_v_locales" ADD COLUMN IF NOT EXISTS "version_c_items_title" varchar DEFAULT 'Our Selection';
  ALTER TABLE "_fnb_menu_events_v_locales" ADD COLUMN IF NOT EXISTS "version_c_items_description" varchar DEFAULT 'Fresh and delicious';

  DO $$ BEGIN
   ALTER TABLE "fnb_menu_events_c_carousel_images_locales" ADD CONSTRAINT "fnb_menu_events_c_carousel_images_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "fnb_menu_events_c_carousel_images_locales" ADD CONSTRAINT "fnb_menu_events_c_carousel_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_c_carousel_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images_locales" ADD CONSTRAINT "_fnb_menu_events_v_version_c_carousel_images_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images_locales" ADD CONSTRAINT "_fnb_menu_events_v_version_c_carousel_images_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_version_c_carousel_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_image_idx" ON "fnb_menu_events_c_carousel_images_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_locales_locale_parent_id_u" ON "fnb_menu_events_c_carousel_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_image_idx" ON "_fnb_menu_events_v_version_c_carousel_images_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_locales_locale_" ON "_fnb_menu_events_v_version_c_carousel_images_locales" USING btree ("_locale","_parent_id");
  DO $$ BEGIN
   ALTER TABLE "fnb_menu_events_locales" ADD CONSTRAINT "fnb_menu_events_locales_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_fnb_menu_events_v_locales" ADD CONSTRAINT "_fnb_menu_events_v_locales_version_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("version_c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_header_c_header_logo_idx" ON "fnb_menu_events_locales" USING btree ("c_header_logo_id","_locale");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_header_version_c_header_log_idx" ON "_fnb_menu_events_v_locales" USING btree ("version_c_header_logo_id","_locale");

  -- Preserve pre-existing (previously un-localized) data into the new 'en'
  -- locale rows before the old columns are dropped below. Other localized
  -- fields on this collection (header.label, theme colors, SEO) mean every
  -- real document already has an 'en' row in these _locales tables, so this
  -- is effectively an UPDATE; the upsert only guards edge cases. ON CONFLICT
  -- already makes these safe to re-run on their own.
  INSERT INTO "fnb_menu_events_c_carousel_images_locales" ("_locale", "_parent_id", "image_id")
  SELECT 'en'::"_locales", "id", "image_id"
  FROM "fnb_menu_events_c_carousel_images"
  WHERE "image_id" IS NOT NULL
  ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "image_id" = EXCLUDED."image_id";

  INSERT INTO "_fnb_menu_events_v_version_c_carousel_images_locales" ("_locale", "_parent_id", "image_id")
  SELECT 'en'::"_locales", "id", "image_id"
  FROM "_fnb_menu_events_v_version_c_carousel_images"
  WHERE "image_id" IS NOT NULL
  ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "image_id" = EXCLUDED."image_id";

  INSERT INTO "fnb_menu_events_locales" ("_locale", "_parent_id", "c_header_logo_id", "c_items_title", "c_items_description")
  SELECT 'en'::"_locales", "id", "c_header_logo_id", "c_items_title", "c_items_description"
  FROM "fnb_menu_events"
  WHERE "c_header_logo_id" IS NOT NULL OR "c_items_title" IS NOT NULL OR "c_items_description" IS NOT NULL
  ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
    "c_header_logo_id" = EXCLUDED."c_header_logo_id",
    "c_items_title" = EXCLUDED."c_items_title",
    "c_items_description" = EXCLUDED."c_items_description";

  INSERT INTO "_fnb_menu_events_v_locales" ("_locale", "_parent_id", "version_c_header_logo_id", "version_c_items_title", "version_c_items_description")
  SELECT 'en'::"_locales", "id", "version_c_header_logo_id", "version_c_items_title", "version_c_items_description"
  FROM "_fnb_menu_events_v"
  WHERE "version_c_header_logo_id" IS NOT NULL OR "version_c_items_title" IS NOT NULL OR "version_c_items_description" IS NOT NULL
  ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
    "version_c_header_logo_id" = EXCLUDED."version_c_header_logo_id",
    "version_c_items_title" = EXCLUDED."version_c_items_title",
    "version_c_items_description" = EXCLUDED."version_c_items_description";

  ALTER TABLE "fnb_menu_events_c_carousel_images" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "c_header_logo_id";
  ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "c_items_title";
  ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "c_items_description";
  ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_c_header_logo_id";
  ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_c_items_title";
  ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_c_items_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fnb_menu_events_c_carousel_images" ADD COLUMN IF NOT EXISTS "image_id" uuid;
  ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" ADD COLUMN IF NOT EXISTS "image_id" uuid;

  -- Restore the 'en' locale's carousel image data back into the unlocalized
  -- columns while the locale tables still exist, before they're dropped below.
  UPDATE "fnb_menu_events_c_carousel_images" t
  SET "image_id" = l."image_id"
  FROM "fnb_menu_events_c_carousel_images_locales" l
  WHERE l."_parent_id" = t."id" AND l."_locale" = 'en'::"_locales";

  UPDATE "_fnb_menu_events_v_version_c_carousel_images" t
  SET "image_id" = l."image_id"
  FROM "_fnb_menu_events_v_version_c_carousel_images_locales" l
  WHERE l."_parent_id" = t."id" AND l."_locale" = 'en'::"_locales";

  DO $$ BEGIN
   IF to_regclass('public.fnb_menu_events_c_carousel_images_locales') IS NOT NULL THEN
    ALTER TABLE "fnb_menu_events_c_carousel_images_locales" DISABLE ROW LEVEL SECURITY;
   END IF;
   IF to_regclass('public._fnb_menu_events_v_version_c_carousel_images_locales') IS NOT NULL THEN
    ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images_locales" DISABLE ROW LEVEL SECURITY;
   END IF;
  END $$;
  DROP TABLE IF EXISTS "fnb_menu_events_c_carousel_images_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_version_c_carousel_images_locales" CASCADE;
  ALTER TABLE "fnb_menu_events_locales" DROP CONSTRAINT IF EXISTS "fnb_menu_events_locales_c_header_logo_id_menu_media_id_fk";

  ALTER TABLE "_fnb_menu_events_v_locales" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_locales_version_c_header_logo_id_menu_media_id_fk";

  DROP INDEX IF EXISTS "fnb_menu_events_c_header_c_header_logo_idx";
  DROP INDEX IF EXISTS "_fnb_menu_events_v_version_c_header_version_c_header_log_idx";
  ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_handlers" SET DEFAULT 'waiter_boh';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_primary" DROP DEFAULT;
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_primary_contrast" SET DEFAULT '#ffffff';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_bg" SET DEFAULT '#ffffff';
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_text" DROP DEFAULT;
  ALTER TABLE "fnb_menu_events_locales" ALTER COLUMN "c_neutral" DROP DEFAULT;
  ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_handlers" SET DEFAULT 'waiter_boh';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_primary" DROP DEFAULT;
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_primary_contrast" SET DEFAULT '#ffffff';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_bg" SET DEFAULT '#ffffff';
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_text" DROP DEFAULT;
  ALTER TABLE "_fnb_menu_events_v_locales" ALTER COLUMN "version_c_neutral" DROP DEFAULT;
  ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "c_header_logo_id" uuid;
  ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "c_items_title" varchar DEFAULT 'Our Selection';
  ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "c_items_description" varchar DEFAULT 'Fresh and delicious';
  ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_c_header_logo_id" uuid;
  ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_c_items_title" varchar DEFAULT 'Our Selection';
  ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_c_items_description" varchar DEFAULT 'Fresh and delicious';

  -- Restore the 'en' locale's header logo / items title / description data
  -- back into the unlocalized columns while the locale columns still exist,
  -- before they're dropped below.
  UPDATE "fnb_menu_events" t
  SET "c_header_logo_id" = l."c_header_logo_id",
      "c_items_title" = l."c_items_title",
      "c_items_description" = l."c_items_description"
  FROM "fnb_menu_events_locales" l
  WHERE l."_parent_id" = t."id" AND l."_locale" = 'en'::"_locales";

  UPDATE "_fnb_menu_events_v" t
  SET "version_c_header_logo_id" = l."version_c_header_logo_id",
      "version_c_items_title" = l."version_c_items_title",
      "version_c_items_description" = l."version_c_items_description"
  FROM "_fnb_menu_events_v_locales" l
  WHERE l."_parent_id" = t."id" AND l."_locale" = 'en'::"_locales";

  DO $$ BEGIN
   ALTER TABLE "fnb_menu_events_c_carousel_images" ADD CONSTRAINT "fnb_menu_events_c_carousel_images_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_fnb_menu_events_v_version_c_carousel_images" ADD CONSTRAINT "_fnb_menu_events_v_version_c_carousel_images_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("version_c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_carousel_images_image_idx" ON "fnb_menu_events_c_carousel_images" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_header_c_header_logo_idx" ON "fnb_menu_events" USING btree ("c_header_logo_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_carousel_images_image_idx" ON "_fnb_menu_events_v_version_c_carousel_images" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_header_version_c_header_log_idx" ON "_fnb_menu_events_v" USING btree ("version_c_header_logo_id");

  ALTER TABLE "fnb_menu_events_locales" DROP COLUMN IF EXISTS "c_header_logo_id";
  ALTER TABLE "fnb_menu_events_locales" DROP COLUMN IF EXISTS "c_items_title";
  ALTER TABLE "fnb_menu_events_locales" DROP COLUMN IF EXISTS "c_items_description";
  ALTER TABLE "_fnb_menu_events_v_locales" DROP COLUMN IF EXISTS "version_c_header_logo_id";
  ALTER TABLE "_fnb_menu_events_v_locales" DROP COLUMN IF EXISTS "version_c_items_title";
  ALTER TABLE "_fnb_menu_events_v_locales" DROP COLUMN IF EXISTS "version_c_items_description";`)
}
