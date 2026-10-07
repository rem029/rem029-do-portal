import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
  CREATE TYPE "public"."enum_fnb_menu_events_c_handlers" AS ENUM('waiter_boh', 'boh_only');
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_fnb_menu_events_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__fnb_menu_events_v_version_c_handlers" AS ENUM('waiter_boh', 'boh_only');
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__fnb_menu_events_v_version_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__fnb_menu_events_v_published_locale" AS ENUM('en', 'ar', 'fr');
EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_carousel_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_images_locales" (
  	"c_image_id" uuid,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_embed_locales" (
  	"c_html" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_text_locales" (
  	"c_label" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c_show_language" boolean DEFAULT true,
  	"c_show_notification" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_header_locales" (
  	"c_label" varchar,
  	"c_logo_id" uuid,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_filter" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c_show_search" boolean DEFAULT true,
  	"c_show_allergen_filters" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_filter_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_items_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"restaurant_id" uuid,
  	"info_slug_override" boolean,
  	"info_slug" varchar,
  	"c_ordering_enabled" boolean DEFAULT true,
  	"c_handlers" "enum_fnb_menu_events_c_handlers" DEFAULT 'waiter_boh',
  	"c_show_prices" boolean DEFAULT true,
  	"c_header_logo_id" uuid,
  	"c_header_show_language" boolean DEFAULT true,
  	"c_header_show_notification" boolean DEFAULT false,
  	"c_filter_enabled" boolean DEFAULT true,
  	"c_filter_show_search" boolean DEFAULT true,
  	"c_filter_show_allergen_filters" boolean DEFAULT true,
  	"c_items_title" varchar DEFAULT 'Our Selection',
  	"c_items_description" varchar DEFAULT 'Fresh and delicious',
  	"adv_show_layout" boolean DEFAULT false,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_fnb_menu_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_locales" (
  	"info_title" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" uuid,
  	"c_font_primary_id" uuid,
  	"c_font_secondary_id" uuid,
  	"c_primary" varchar,
  	"c_primary_contrast" varchar,
  	"c_bg" varchar,
  	"c_bg_card" varchar,
  	"c_text" varchar,
  	"c_neutral" varchar,
  	"c_header_label" varchar,
  	"adv_class_name" varchar,
  	"adv_css" varchar,
  	"adv_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_menu_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_images_locales" (
  	"c_image_id" uuid,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_embed_locales" (
  	"c_html" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_text_locales" (
  	"c_label" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"c_show_language" boolean DEFAULT true,
  	"c_show_notification" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_header_locales" (
  	"c_label" varchar,
  	"c_logo_id" uuid,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_filter" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"c_show_search" boolean DEFAULT true,
  	"c_show_allergen_filters" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_filter_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_items_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_restaurant_id" uuid,
  	"version_info_slug_override" boolean,
  	"version_info_slug" varchar,
  	"version_c_ordering_enabled" boolean DEFAULT true,
  	"version_c_handlers" "enum__fnb_menu_events_v_version_c_handlers" DEFAULT 'waiter_boh',
  	"version_c_show_prices" boolean DEFAULT true,
  	"version_c_header_logo_id" uuid,
  	"version_c_header_show_language" boolean DEFAULT true,
  	"version_c_header_show_notification" boolean DEFAULT false,
  	"version_c_filter_enabled" boolean DEFAULT true,
  	"version_c_filter_show_search" boolean DEFAULT true,
  	"version_c_filter_show_allergen_filters" boolean DEFAULT true,
  	"version_c_items_title" varchar DEFAULT 'Our Selection',
  	"version_c_items_description" varchar DEFAULT 'Fresh and delicious',
  	"version_adv_show_layout" boolean DEFAULT false,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__fnb_menu_events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__fnb_menu_events_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_locales" (
  	"version_info_title" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" uuid,
  	"version_c_font_primary_id" uuid,
  	"version_c_font_secondary_id" uuid,
  	"version_c_primary" varchar,
  	"version_c_primary_contrast" varchar,
  	"version_c_bg" varchar,
  	"version_c_bg_card" varchar,
  	"version_c_text" varchar,
  	"version_c_neutral" varchar,
  	"version_c_header_label" varchar,
  	"version_adv_class_name" varchar,
  	"version_adv_css" varchar,
  	"version_adv_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_menu_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "fnb_menu_events_id" uuid;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_carousel_c_slides" ADD CONSTRAINT "fnb_menu_events_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_carousel_c_slides_locales" ADD CONSTRAINT "fnb_menu_events_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_carousel_c_slides_locales" ADD CONSTRAINT "fnb_menu_events_blocks_carousel_c_slides_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_carousel" ADD CONSTRAINT "fnb_menu_events_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_carousel_locales" ADD CONSTRAINT "fnb_menu_events_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_images" ADD CONSTRAINT "fnb_menu_events_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_images_locales" ADD CONSTRAINT "fnb_menu_events_blocks_images_locales_c_image_id_menu_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_images_locales" ADD CONSTRAINT "fnb_menu_events_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_embed" ADD CONSTRAINT "fnb_menu_events_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_embed_locales" ADD CONSTRAINT "fnb_menu_events_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_text" ADD CONSTRAINT "fnb_menu_events_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_text_locales" ADD CONSTRAINT "fnb_menu_events_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_buttons" ADD CONSTRAINT "fnb_menu_events_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_buttons_locales" ADD CONSTRAINT "fnb_menu_events_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_header" ADD CONSTRAINT "fnb_menu_events_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_header_locales" ADD CONSTRAINT "fnb_menu_events_blocks_header_locales_c_logo_id_menu_media_id_fk" FOREIGN KEY ("c_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_header_locales" ADD CONSTRAINT "fnb_menu_events_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_filter" ADD CONSTRAINT "fnb_menu_events_blocks_filter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_filter_locales" ADD CONSTRAINT "fnb_menu_events_blocks_filter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_filter"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_items" ADD CONSTRAINT "fnb_menu_events_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_items_locales" ADD CONSTRAINT "fnb_menu_events_blocks_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_section" ADD CONSTRAINT "fnb_menu_events_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_blocks_section_locales" ADD CONSTRAINT "fnb_menu_events_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_locales" ADD CONSTRAINT "fnb_menu_events_locales_seo_image_id_menu_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_locales" ADD CONSTRAINT "fnb_menu_events_locales_c_font_primary_id_menu_media_id_fk" FOREIGN KEY ("c_font_primary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_locales" ADD CONSTRAINT "fnb_menu_events_locales_c_font_secondary_id_menu_media_id_fk" FOREIGN KEY ("c_font_secondary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_locales" ADD CONSTRAINT "fnb_menu_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_rels" ADD CONSTRAINT "fnb_menu_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "fnb_menu_events_rels" ADD CONSTRAINT "fnb_menu_events_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_carousel_c_slides" ADD CONSTRAINT "_fnb_menu_events_v_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_carousel_c_slides_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_carousel" ADD CONSTRAINT "_fnb_menu_events_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_carousel_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_images" ADD CONSTRAINT "_fnb_menu_events_v_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_images_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_images_locales_c_image_id_menu_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_images_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_embed" ADD CONSTRAINT "_fnb_menu_events_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_embed_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_text" ADD CONSTRAINT "_fnb_menu_events_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_text_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_buttons" ADD CONSTRAINT "_fnb_menu_events_v_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_buttons_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_header" ADD CONSTRAINT "_fnb_menu_events_v_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_header_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_header_locales_c_logo_id_menu_media_id_fk" FOREIGN KEY ("c_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_header_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_filter" ADD CONSTRAINT "_fnb_menu_events_v_blocks_filter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_filter_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_filter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_filter"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_items" ADD CONSTRAINT "_fnb_menu_events_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_items_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_section" ADD CONSTRAINT "_fnb_menu_events_v_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_blocks_section_locales" ADD CONSTRAINT "_fnb_menu_events_v_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_parent_id_fnb_menu_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_c_header_logo_id_menu_media_id_fk" FOREIGN KEY ("version_c_header_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_locales" ADD CONSTRAINT "_fnb_menu_events_v_locales_version_seo_image_id_menu_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_locales" ADD CONSTRAINT "_fnb_menu_events_v_locales_version_c_font_primary_id_menu_media_id_fk" FOREIGN KEY ("version_c_font_primary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_locales" ADD CONSTRAINT "_fnb_menu_events_v_locales_version_c_font_secondary_id_menu_media_id_fk" FOREIGN KEY ("version_c_font_secondary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_locales" ADD CONSTRAINT "_fnb_menu_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_rels" ADD CONSTRAINT "_fnb_menu_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_fnb_menu_events_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
  ALTER TABLE "_fnb_menu_events_v_rels" ADD CONSTRAINT "_fnb_menu_events_v_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides_order_idx" ON "fnb_menu_events_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides_parent_id_idx" ON "fnb_menu_events_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides_image_idx" ON "fnb_menu_events_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_c_slides_locales_locale_pare" ON "fnb_menu_events_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_order_idx" ON "fnb_menu_events_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_parent_id_idx" ON "fnb_menu_events_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_path_idx" ON "fnb_menu_events_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_carousel_locales_locale_parent_id_uni" ON "fnb_menu_events_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_images_order_idx" ON "fnb_menu_events_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_images_parent_id_idx" ON "fnb_menu_events_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_images_path_idx" ON "fnb_menu_events_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_images_c_c_image_idx" ON "fnb_menu_events_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_images_locales_locale_parent_id_uniqu" ON "fnb_menu_events_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_embed_order_idx" ON "fnb_menu_events_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_embed_parent_id_idx" ON "fnb_menu_events_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_embed_path_idx" ON "fnb_menu_events_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_embed_locales_locale_parent_id_unique" ON "fnb_menu_events_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_text_order_idx" ON "fnb_menu_events_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_text_parent_id_idx" ON "fnb_menu_events_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_text_path_idx" ON "fnb_menu_events_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_text_locales_locale_parent_id_unique" ON "fnb_menu_events_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_buttons_order_idx" ON "fnb_menu_events_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_buttons_parent_id_idx" ON "fnb_menu_events_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_buttons_path_idx" ON "fnb_menu_events_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_buttons_locales_locale_parent_id_uniq" ON "fnb_menu_events_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_header_order_idx" ON "fnb_menu_events_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_header_parent_id_idx" ON "fnb_menu_events_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_header_path_idx" ON "fnb_menu_events_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_header_c_c_logo_idx" ON "fnb_menu_events_blocks_header_locales" USING btree ("c_logo_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_header_locales_locale_parent_id_uniqu" ON "fnb_menu_events_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_filter_order_idx" ON "fnb_menu_events_blocks_filter" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_filter_parent_id_idx" ON "fnb_menu_events_blocks_filter" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_filter_path_idx" ON "fnb_menu_events_blocks_filter" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_filter_locales_locale_parent_id_uniqu" ON "fnb_menu_events_blocks_filter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_items_order_idx" ON "fnb_menu_events_blocks_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_items_parent_id_idx" ON "fnb_menu_events_blocks_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_items_path_idx" ON "fnb_menu_events_blocks_items" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_items_locales_locale_parent_id_unique" ON "fnb_menu_events_blocks_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_section_order_idx" ON "fnb_menu_events_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_section_parent_id_idx" ON "fnb_menu_events_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_blocks_section_path_idx" ON "fnb_menu_events_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_blocks_section_locales_locale_parent_id_uniq" ON "fnb_menu_events_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_operator_idx" ON "fnb_menu_events" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_restaurant_idx" ON "fnb_menu_events" USING btree ("restaurant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_info_info_slug_idx" ON "fnb_menu_events" USING btree ("info_slug");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_header_c_header_logo_idx" ON "fnb_menu_events" USING btree ("c_header_logo_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_operator_slug_idx" ON "fnb_menu_events" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_created_by_idx" ON "fnb_menu_events" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_updated_by_idx" ON "fnb_menu_events" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_updated_at_idx" ON "fnb_menu_events" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_created_at_idx" ON "fnb_menu_events" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events__status_idx" ON "fnb_menu_events" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_seo_seo_image_idx" ON "fnb_menu_events_locales" USING btree ("seo_image_id","_locale");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_c_font_primary_idx" ON "fnb_menu_events_locales" USING btree ("c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_c_c_font_secondary_idx" ON "fnb_menu_events_locales" USING btree ("c_font_secondary_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_menu_events_locales_locale_parent_id_unique" ON "fnb_menu_events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_rels_order_idx" ON "fnb_menu_events_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_rels_parent_idx" ON "fnb_menu_events_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_rels_path_idx" ON "fnb_menu_events_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "fnb_menu_events_rels_menu_id_idx" ON "fnb_menu_events_rels" USING btree ("menu_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_order_idx" ON "_fnb_menu_events_v_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_parent_id_idx" ON "_fnb_menu_events_v_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_image_idx" ON "_fnb_menu_events_v_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_locales_locale_p" ON "_fnb_menu_events_v_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_order_idx" ON "_fnb_menu_events_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_parent_id_idx" ON "_fnb_menu_events_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_path_idx" ON "_fnb_menu_events_v_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_carousel_locales_locale_parent_id_" ON "_fnb_menu_events_v_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_images_order_idx" ON "_fnb_menu_events_v_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_images_parent_id_idx" ON "_fnb_menu_events_v_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_images_path_idx" ON "_fnb_menu_events_v_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_images_c_c_image_idx" ON "_fnb_menu_events_v_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_images_locales_locale_parent_id_un" ON "_fnb_menu_events_v_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_embed_order_idx" ON "_fnb_menu_events_v_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_embed_parent_id_idx" ON "_fnb_menu_events_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_embed_path_idx" ON "_fnb_menu_events_v_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_embed_locales_locale_parent_id_uni" ON "_fnb_menu_events_v_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_text_order_idx" ON "_fnb_menu_events_v_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_text_parent_id_idx" ON "_fnb_menu_events_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_text_path_idx" ON "_fnb_menu_events_v_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_text_locales_locale_parent_id_uniq" ON "_fnb_menu_events_v_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons_order_idx" ON "_fnb_menu_events_v_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons_parent_id_idx" ON "_fnb_menu_events_v_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons_path_idx" ON "_fnb_menu_events_v_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_buttons_locales_locale_parent_id_u" ON "_fnb_menu_events_v_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_header_order_idx" ON "_fnb_menu_events_v_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_header_parent_id_idx" ON "_fnb_menu_events_v_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_header_path_idx" ON "_fnb_menu_events_v_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_header_c_c_logo_idx" ON "_fnb_menu_events_v_blocks_header_locales" USING btree ("c_logo_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_header_locales_locale_parent_id_un" ON "_fnb_menu_events_v_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_filter_order_idx" ON "_fnb_menu_events_v_blocks_filter" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_filter_parent_id_idx" ON "_fnb_menu_events_v_blocks_filter" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_filter_path_idx" ON "_fnb_menu_events_v_blocks_filter" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_filter_locales_locale_parent_id_un" ON "_fnb_menu_events_v_blocks_filter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_items_order_idx" ON "_fnb_menu_events_v_blocks_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_items_parent_id_idx" ON "_fnb_menu_events_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_items_path_idx" ON "_fnb_menu_events_v_blocks_items" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_items_locales_locale_parent_id_uni" ON "_fnb_menu_events_v_blocks_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_section_order_idx" ON "_fnb_menu_events_v_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_section_parent_id_idx" ON "_fnb_menu_events_v_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_section_path_idx" ON "_fnb_menu_events_v_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_blocks_section_locales_locale_parent_id_u" ON "_fnb_menu_events_v_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_parent_idx" ON "_fnb_menu_events_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_operator_idx" ON "_fnb_menu_events_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_restaurant_idx" ON "_fnb_menu_events_v" USING btree ("version_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_info_version_info_slug_idx" ON "_fnb_menu_events_v" USING btree ("version_info_slug");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_header_version_c_header_log_idx" ON "_fnb_menu_events_v" USING btree ("version_c_header_logo_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_operator_slug_idx" ON "_fnb_menu_events_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_created_by_idx" ON "_fnb_menu_events_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_updated_by_idx" ON "_fnb_menu_events_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_updated_at_idx" ON "_fnb_menu_events_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_created_at_idx" ON "_fnb_menu_events_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version__status_idx" ON "_fnb_menu_events_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_created_at_idx" ON "_fnb_menu_events_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_updated_at_idx" ON "_fnb_menu_events_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_snapshot_idx" ON "_fnb_menu_events_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_published_locale_idx" ON "_fnb_menu_events_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_latest_idx" ON "_fnb_menu_events_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_seo_version_seo_image_idx" ON "_fnb_menu_events_v_locales" USING btree ("version_seo_image_id","_locale");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_version_c_font_primary_idx" ON "_fnb_menu_events_v_locales" USING btree ("version_c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_c_version_c_font_secondary_idx" ON "_fnb_menu_events_v_locales" USING btree ("version_c_font_secondary_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_fnb_menu_events_v_locales_locale_parent_id_unique" ON "_fnb_menu_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_rels_order_idx" ON "_fnb_menu_events_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_rels_parent_idx" ON "_fnb_menu_events_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_rels_path_idx" ON "_fnb_menu_events_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_rels_menu_id_idx" ON "_fnb_menu_events_v_rels" USING btree ("menu_id");
  DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fnb_menu_events_fk" FOREIGN KEY ("fnb_menu_events_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fnb_menu_events_id_idx" ON "payload_locked_documents_rels" USING btree ("fnb_menu_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_carousel" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_images" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_images_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_embed" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_embed_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_text" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_text_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_buttons" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_header" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_header_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_filter" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_filter_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_items" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_items_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_section" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_blocks_section_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "fnb_menu_events_rels" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_carousel" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_images" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_images_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_embed" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_embed_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_text" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_text_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_buttons" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_header" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_header_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_filter" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_filter_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_items" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_items_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_section" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_blocks_section_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_locales" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_fnb_menu_events_v_rels" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_filter" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_filter_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_items" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_items_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_locales" CASCADE;
  DROP TABLE IF EXISTS "fnb_menu_events_rels" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_filter" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_filter_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_items" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_items_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_fnb_menu_events_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_fnb_menu_events_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_fnb_menu_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fnb_menu_events_id";
  DROP TYPE IF EXISTS "public"."enum_fnb_menu_events_c_handlers";
  DROP TYPE IF EXISTS "public"."enum_fnb_menu_events_status";
  DROP TYPE IF EXISTS "public"."enum__fnb_menu_events_v_version_c_handlers";
  DROP TYPE IF EXISTS "public"."enum__fnb_menu_events_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__fnb_menu_events_v_published_locale";`)
}
