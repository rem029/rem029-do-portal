import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_text_c_title_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_text_c_title_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'base-content');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_text_c_description_size" AS ENUM('lg', 'md', 'sm', 'xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_text_c_description_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'base-content');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_c_theme" AS ENUM('printemps', 'dohaoasis', 'dohaoasis-new', 'dohaquest', 'dohaquest-new', 'banyan-tree-lululemon');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_text_c_title_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_text_c_title_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'base-content');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_text_c_description_size" AS ENUM('lg', 'md', 'sm', 'xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_text_c_description_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'base-content');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_version_c_theme" AS ENUM('printemps', 'dohaoasis', 'dohaoasis-new', 'dohaquest', 'dohaquest-new', 'banyan-tree-lululemon');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "site_pages_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_buttons_c_variant";
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_buttons_c_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'ghost', 'link', 'outline');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "site_pages_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE "public"."enum_site_pages_blocks_buttons_c_variant" USING "c_variant"::"public"."enum_site_pages_blocks_buttons_c_variant";
  ALTER TABLE "_site_pages_v_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_buttons_c_variant";
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_buttons_c_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'ghost', 'link', 'outline');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "_site_pages_v_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE "public"."enum__site_pages_v_blocks_buttons_c_variant" USING "c_variant"::"public"."enum__site_pages_v_blocks_buttons_c_variant";
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_title_size" "enum_site_pages_blocks_text_c_title_size";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_title_variant" "enum_site_pages_blocks_text_c_title_variant";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_description_size" "enum_site_pages_blocks_text_c_description_size";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_description_variant" "enum_site_pages_blocks_text_c_description_variant";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "c_use_custom_theme" boolean DEFAULT false;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "c_theme" "enum_site_pages_c_theme" DEFAULT 'dohaquest-new';
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "c_custom_theme_name" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "c_custom_theme_css" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "qr_png_id" uuid;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "qr_svg_id" uuid;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_title_size" "enum__site_pages_v_blocks_text_c_title_size";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_title_variant" "enum__site_pages_v_blocks_text_c_title_variant";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_description_size" "enum__site_pages_v_blocks_text_c_description_size";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" ADD COLUMN IF NOT EXISTS "c_description_variant" "enum__site_pages_v_blocks_text_c_description_variant";
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_c_use_custom_theme" boolean DEFAULT false;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_c_theme" "enum__site_pages_v_version_c_theme" DEFAULT 'dohaquest-new';
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_c_custom_theme_name" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_c_custom_theme_css" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_qr_png_id" uuid;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD COLUMN IF NOT EXISTS "version_qr_svg_id" uuid;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_qr_png_id_media_id_fk" FOREIGN KEY ("qr_png_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_qr_svg_id_media_id_fk" FOREIGN KEY ("qr_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_version_qr_png_id_media_id_fk" FOREIGN KEY ("version_qr_png_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_version_qr_svg_id_media_id_fk" FOREIGN KEY ("version_qr_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  CREATE INDEX IF NOT EXISTS "site_pages_qr_png_idx" ON "site_pages" USING btree ("qr_png_id");
  CREATE INDEX IF NOT EXISTS "site_pages_qr_svg_idx" ON "site_pages" USING btree ("qr_svg_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_qr_png_idx" ON "_site_pages_v" USING btree ("version_qr_png_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_qr_svg_idx" ON "_site_pages_v" USING btree ("version_qr_svg_id");
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_primary";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_primary_contrast";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_bg";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_bg_card";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_text";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" DROP COLUMN IF EXISTS "c_neutral";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_primary";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_primary_contrast";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_bg";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_bg_card";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_text";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" DROP COLUMN IF EXISTS "version_c_neutral";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    ALTER TABLE "site_pages" DROP CONSTRAINT IF EXISTS "site_pages_qr_png_id_media_id_fk";
   EXCEPTION
    WHEN undefined_object THEN null;
   END $$;
  
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP CONSTRAINT IF EXISTS "site_pages_qr_svg_id_media_id_fk";
   EXCEPTION
    WHEN undefined_object THEN null;
   END $$;
  
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP CONSTRAINT IF EXISTS "_site_pages_v_version_qr_png_id_media_id_fk";
   EXCEPTION
    WHEN undefined_object THEN null;
   END $$;
  
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP CONSTRAINT IF EXISTS "_site_pages_v_version_qr_svg_id_media_id_fk";
   EXCEPTION
    WHEN undefined_object THEN null;
   END $$;
  
  ALTER TABLE "site_pages_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_buttons_c_variant";
  DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_buttons_c_variant" AS ENUM('primary', 'primary-contrast', 'background', 'background-card', 'neutral', 'text');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "site_pages_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE "public"."enum_site_pages_blocks_buttons_c_variant" USING "c_variant"::"public"."enum_site_pages_blocks_buttons_c_variant";
  ALTER TABLE "_site_pages_v_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_buttons_c_variant";
  DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_buttons_c_variant" AS ENUM('primary', 'primary-contrast', 'background', 'background-card', 'neutral', 'text');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
  ALTER TABLE "_site_pages_v_blocks_buttons_locales" ALTER COLUMN "c_variant" SET DATA TYPE "public"."enum__site_pages_v_blocks_buttons_c_variant" USING "c_variant"::"public"."enum__site_pages_v_blocks_buttons_c_variant";
  DROP INDEX IF EXISTS "site_pages_qr_png_idx";
  DROP INDEX IF EXISTS "site_pages_qr_svg_idx";
  DROP INDEX IF EXISTS "_site_pages_v_version_version_qr_png_idx";
  DROP INDEX IF EXISTS "_site_pages_v_version_version_qr_svg_idx";
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_primary" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_primary_contrast" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_bg" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_bg_card" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_text" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_locales" ADD COLUMN IF NOT EXISTS "c_neutral" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_primary" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_primary_contrast" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_bg" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_bg_card" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_text" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_c_neutral" varchar;
   EXCEPTION
    WHEN duplicate_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" DROP COLUMN IF EXISTS "c_title_size";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" DROP COLUMN IF EXISTS "c_title_variant";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" DROP COLUMN IF EXISTS "c_description_size";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_text_locales" DROP COLUMN IF EXISTS "c_description_variant";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "c_use_custom_theme";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "c_theme";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "c_custom_theme_name";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "c_custom_theme_css";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "qr_png_id";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "site_pages" DROP COLUMN IF EXISTS "qr_svg_id";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" DROP COLUMN IF EXISTS "c_title_size";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" DROP COLUMN IF EXISTS "c_title_variant";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" DROP COLUMN IF EXISTS "c_description_size";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_text_locales" DROP COLUMN IF EXISTS "c_description_variant";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_c_use_custom_theme";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_c_theme";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_c_custom_theme_name";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_c_custom_theme_css";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_qr_png_id";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v" DROP COLUMN IF EXISTS "version_qr_svg_id";
   EXCEPTION
    WHEN undefined_column THEN null;
   END $$;
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_text_c_title_size";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_text_c_title_variant";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_text_c_description_size";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_text_c_description_variant";
  DROP TYPE IF EXISTS "public"."enum_site_pages_c_theme";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_text_c_title_size";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_text_c_title_variant";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_text_c_description_size";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_text_c_description_variant";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_version_c_theme";`)
}
