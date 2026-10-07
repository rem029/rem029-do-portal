import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_text_c_element" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'paragraph');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_buttons_c_variant" AS ENUM('primary', 'primary-contrast', 'background', 'background-card', 'neutral', 'text');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_buttons_c_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_blocks_header_c_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum_site_pages_status" AS ENUM('draft', 'published');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_text_c_element" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'paragraph');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_buttons_c_variant" AS ENUM('primary', 'primary-contrast', 'background', 'background-card', 'neutral', 'text');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_buttons_c_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_blocks_header_c_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_version_status" AS ENUM('draft', 'published');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
    CREATE TYPE "public"."enum__site_pages_v_published_locale" AS ENUM('en', 'ar', 'fr');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"title" varchar,
  	"description" varchar,
  	"link" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_carousel_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_images_locales" (
  	"c_image_id" uuid,
  	"c_title" varchar,
  	"c_link" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_embed_locales" (
  	"c_title" varchar,
  	"c_html" varchar,
  	"c_description" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_text_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"c_html" varchar,
  	"c_element" "enum_site_pages_blocks_text_c_element",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"c_variant" "enum_site_pages_blocks_buttons_c_variant",
  	"c_size" "enum_site_pages_blocks_buttons_c_size",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"settings_is_sticky" boolean DEFAULT false,
  	"settings_top_pos" numeric DEFAULT 0,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_header_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"c_image_id" uuid,
  	"c_size" "enum_site_pages_blocks_header_c_size",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"info_slug_override" boolean,
  	"info_slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_site_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_locales" (
  	"info_title" varchar,
  	"c_font_primary_id" uuid,
  	"c_font_secondary_id" uuid,
  	"c_primary" varchar,
  	"c_primary_contrast" varchar,
  	"c_bg" varchar,
  	"c_bg_card" varchar,
  	"c_text" varchar,
  	"c_neutral" varchar,
  	"adv_class_name" varchar,
  	"adv_css" varchar,
  	"adv_js" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"title" varchar,
  	"description" varchar,
  	"link" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_carousel_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_images_locales" (
  	"c_image_id" uuid,
  	"c_title" varchar,
  	"c_link" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_embed_locales" (
  	"c_title" varchar,
  	"c_html" varchar,
  	"c_description" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_text_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"c_html" varchar,
  	"c_element" "enum__site_pages_v_blocks_text_c_element",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"c_variant" "enum__site_pages_v_blocks_buttons_c_variant",
  	"c_size" "enum__site_pages_v_blocks_buttons_c_size",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"settings_is_sticky" boolean DEFAULT false,
  	"settings_top_pos" numeric DEFAULT 0,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_header_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"c_image_id" uuid,
  	"c_size" "enum__site_pages_v_blocks_header_c_size",
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_info_slug_override" boolean,
  	"version_info_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__site_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__site_pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_locales" (
  	"version_info_title" varchar,
  	"version_c_font_primary_id" uuid,
  	"version_c_font_secondary_id" uuid,
  	"version_c_primary" varchar,
  	"version_c_primary_contrast" varchar,
  	"version_c_bg" varchar,
  	"version_c_bg_card" varchar,
  	"version_c_text" varchar,
  	"version_c_neutral" varchar,
  	"version_adv_class_name" varchar,
  	"version_adv_css" varchar,
  	"version_adv_js" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "site_pages_id" uuid;
  EXCEPTION
   WHEN duplicate_column THEN null;
  END $$;
  
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_carousel_c_slides" ADD CONSTRAINT "site_pages_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_carousel_c_slides_locales" ADD CONSTRAINT "site_pages_blocks_carousel_c_slides_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_carousel_c_slides_locales" ADD CONSTRAINT "site_pages_blocks_carousel_c_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_carousel" ADD CONSTRAINT "site_pages_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_carousel_locales" ADD CONSTRAINT "site_pages_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_images" ADD CONSTRAINT "site_pages_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_images_locales" ADD CONSTRAINT "site_pages_blocks_images_locales_c_image_id_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_images_locales" ADD CONSTRAINT "site_pages_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_embed" ADD CONSTRAINT "site_pages_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_embed_locales" ADD CONSTRAINT "site_pages_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_text" ADD CONSTRAINT "site_pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_text_locales" ADD CONSTRAINT "site_pages_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_buttons" ADD CONSTRAINT "site_pages_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_buttons_locales" ADD CONSTRAINT "site_pages_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_header" ADD CONSTRAINT "site_pages_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_header_locales" ADD CONSTRAINT "site_pages_blocks_header_locales_c_image_id_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_header_locales" ADD CONSTRAINT "site_pages_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_section" ADD CONSTRAINT "site_pages_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_blocks_section_locales" ADD CONSTRAINT "site_pages_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_locales" ADD CONSTRAINT "site_pages_locales_c_font_primary_id_media_id_fk" FOREIGN KEY ("c_font_primary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_locales" ADD CONSTRAINT "site_pages_locales_c_font_secondary_id_media_id_fk" FOREIGN KEY ("c_font_secondary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_locales" ADD CONSTRAINT "site_pages_locales_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "site_pages_locales" ADD CONSTRAINT "site_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_carousel_c_slides" ADD CONSTRAINT "_site_pages_v_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_site_pages_v_blocks_carousel_c_slides_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_site_pages_v_blocks_carousel_c_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_carousel" ADD CONSTRAINT "_site_pages_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_carousel_locales" ADD CONSTRAINT "_site_pages_v_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_images" ADD CONSTRAINT "_site_pages_v_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_images_locales" ADD CONSTRAINT "_site_pages_v_blocks_images_locales_c_image_id_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_images_locales" ADD CONSTRAINT "_site_pages_v_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_embed" ADD CONSTRAINT "_site_pages_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_embed_locales" ADD CONSTRAINT "_site_pages_v_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_text" ADD CONSTRAINT "_site_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_text_locales" ADD CONSTRAINT "_site_pages_v_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_buttons" ADD CONSTRAINT "_site_pages_v_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_buttons_locales" ADD CONSTRAINT "_site_pages_v_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_header" ADD CONSTRAINT "_site_pages_v_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_header_locales" ADD CONSTRAINT "_site_pages_v_blocks_header_locales_c_image_id_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_header_locales" ADD CONSTRAINT "_site_pages_v_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_section" ADD CONSTRAINT "_site_pages_v_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_blocks_section_locales" ADD CONSTRAINT "_site_pages_v_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_parent_id_site_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_pages"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v" ADD CONSTRAINT "_site_pages_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_locales" ADD CONSTRAINT "_site_pages_v_locales_version_c_font_primary_id_media_id_fk" FOREIGN KEY ("version_c_font_primary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_locales" ADD CONSTRAINT "_site_pages_v_locales_version_c_font_secondary_id_media_id_fk" FOREIGN KEY ("version_c_font_secondary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_locales" ADD CONSTRAINT "_site_pages_v_locales_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
     ALTER TABLE "_site_pages_v_locales" ADD CONSTRAINT "_site_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_c_slides_order_idx" ON "site_pages_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_c_slides_parent_id_idx" ON "site_pages_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_c_slides_image_idx" ON "site_pages_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_carousel_c_slides_locales_locale_parent_id" ON "site_pages_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_order_idx" ON "site_pages_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_parent_id_idx" ON "site_pages_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_carousel_path_idx" ON "site_pages_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_carousel_locales_locale_parent_id_unique" ON "site_pages_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_images_order_idx" ON "site_pages_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_images_parent_id_idx" ON "site_pages_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_images_path_idx" ON "site_pages_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_images_c_c_image_idx" ON "site_pages_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_images_locales_locale_parent_id_unique" ON "site_pages_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_embed_order_idx" ON "site_pages_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_embed_parent_id_idx" ON "site_pages_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_embed_path_idx" ON "site_pages_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_embed_locales_locale_parent_id_unique" ON "site_pages_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_text_order_idx" ON "site_pages_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_text_parent_id_idx" ON "site_pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_text_path_idx" ON "site_pages_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_text_locales_locale_parent_id_unique" ON "site_pages_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_buttons_order_idx" ON "site_pages_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_buttons_parent_id_idx" ON "site_pages_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_buttons_path_idx" ON "site_pages_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_buttons_locales_locale_parent_id_unique" ON "site_pages_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_header_order_idx" ON "site_pages_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_header_parent_id_idx" ON "site_pages_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_header_path_idx" ON "site_pages_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_header_c_c_image_idx" ON "site_pages_blocks_header_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_header_locales_locale_parent_id_unique" ON "site_pages_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_section_order_idx" ON "site_pages_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_section_parent_id_idx" ON "site_pages_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_section_path_idx" ON "site_pages_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_section_locales_locale_parent_id_unique" ON "site_pages_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_operator_idx" ON "site_pages" USING btree ("operator_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_info_info_slug_idx" ON "site_pages" USING btree ("info_slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_operator_slug_idx" ON "site_pages" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "site_pages_created_by_idx" ON "site_pages" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "site_pages_updated_by_idx" ON "site_pages" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "site_pages_updated_at_idx" ON "site_pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "site_pages_created_at_idx" ON "site_pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "site_pages__status_idx" ON "site_pages" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "site_pages_c_c_font_primary_idx" ON "site_pages_locales" USING btree ("c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "site_pages_c_c_font_secondary_idx" ON "site_pages_locales" USING btree ("c_font_secondary_id","_locale");
  CREATE INDEX IF NOT EXISTS "site_pages_seo_seo_image_idx" ON "site_pages_locales" USING btree ("seo_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_locales_locale_parent_id_unique" ON "site_pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides_order_idx" ON "_site_pages_v_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides_parent_id_idx" ON "_site_pages_v_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides_image_idx" ON "_site_pages_v_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_c_slides_locales_locale_parent" ON "_site_pages_v_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_order_idx" ON "_site_pages_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_parent_id_idx" ON "_site_pages_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_path_idx" ON "_site_pages_v_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_carousel_locales_locale_parent_id_uniqu" ON "_site_pages_v_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_images_order_idx" ON "_site_pages_v_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_images_parent_id_idx" ON "_site_pages_v_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_images_path_idx" ON "_site_pages_v_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_images_c_c_image_idx" ON "_site_pages_v_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_images_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_embed_order_idx" ON "_site_pages_v_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_embed_parent_id_idx" ON "_site_pages_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_embed_path_idx" ON "_site_pages_v_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_embed_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_text_order_idx" ON "_site_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_text_parent_id_idx" ON "_site_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_text_path_idx" ON "_site_pages_v_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_text_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_buttons_order_idx" ON "_site_pages_v_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_buttons_parent_id_idx" ON "_site_pages_v_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_buttons_path_idx" ON "_site_pages_v_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_buttons_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_header_order_idx" ON "_site_pages_v_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_header_parent_id_idx" ON "_site_pages_v_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_header_path_idx" ON "_site_pages_v_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_header_c_c_image_idx" ON "_site_pages_v_blocks_header_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_header_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_section_order_idx" ON "_site_pages_v_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_section_parent_id_idx" ON "_site_pages_v_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_section_path_idx" ON "_site_pages_v_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_section_locales_locale_parent_id_unique" ON "_site_pages_v_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_parent_idx" ON "_site_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_operator_idx" ON "_site_pages_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_info_version_info_slug_idx" ON "_site_pages_v" USING btree ("version_info_slug");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_operator_slug_idx" ON "_site_pages_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_created_by_idx" ON "_site_pages_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_updated_by_idx" ON "_site_pages_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_updated_at_idx" ON "_site_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version_created_at_idx" ON "_site_pages_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_version__status_idx" ON "_site_pages_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_created_at_idx" ON "_site_pages_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_updated_at_idx" ON "_site_pages_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_snapshot_idx" ON "_site_pages_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_published_locale_idx" ON "_site_pages_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_latest_idx" ON "_site_pages_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_c_version_c_font_primary_idx" ON "_site_pages_v_locales" USING btree ("version_c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_c_version_c_font_secondary_idx" ON "_site_pages_v_locales" USING btree ("version_c_font_secondary_id","_locale");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_version_seo_version_seo_image_idx" ON "_site_pages_v_locales" USING btree ("version_seo_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_locales_locale_parent_id_unique" ON "_site_pages_v_locales" USING btree ("_locale","_parent_id");
  DO $$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_pages_fk" FOREIGN KEY ("site_pages_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_site_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("site_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_pages_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_blocks_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_blocks_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "site_pages_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "site_pages" CASCADE;
  DROP TABLE IF EXISTS "site_pages_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_locales" CASCADE;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_site_pages_fk";
  EXCEPTION
   WHEN undefined_object THEN null;
  END $$;
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_site_pages_id_idx";
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "site_pages_id";
  EXCEPTION
   WHEN undefined_column THEN null;
  END $$;
  
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_text_c_element";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_buttons_c_variant";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_buttons_c_size";
  DROP TYPE IF EXISTS "public"."enum_site_pages_blocks_header_c_size";
  DROP TYPE IF EXISTS "public"."enum_site_pages_status";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_text_c_element";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_buttons_c_variant";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_buttons_c_size";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_blocks_header_c_size";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__site_pages_v_published_locale";`)
}
