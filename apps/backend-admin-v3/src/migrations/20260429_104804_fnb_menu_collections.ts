import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_allergens_status') THEN
        CREATE TYPE "public"."enum_menu_allergens_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_allergens_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_allergens_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_allergens_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_allergens_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_tags_status') THEN
        CREATE TYPE "public"."enum_menu_tags_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_tags_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_tags_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_tags_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_tags_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_categories_status') THEN
        CREATE TYPE "public"."enum_menu_categories_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_categories_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_categories_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_categories_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_categories_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_items_availability_period') THEN
        CREATE TYPE "public"."enum_menu_items_availability_period" AS ENUM('breakfast', 'lunch', 'dinner', 'all_day');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_items_status') THEN
        CREATE TYPE "public"."enum_menu_items_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_items_v_version_availability_period') THEN
        CREATE TYPE "public"."enum__menu_items_v_version_availability_period" AS ENUM('breakfast', 'lunch', 'dinner', 'all_day');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_items_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_items_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_items_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_items_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_status') THEN
        CREATE TYPE "public"."enum_menu_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_menu_pages_status') THEN
        CREATE TYPE "public"."enum_menu_pages_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_pages_v_version_status') THEN
        CREATE TYPE "public"."enum__menu_pages_v_version_status" AS ENUM('draft', 'published');
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__menu_pages_v_published_locale') THEN
        CREATE TYPE "public"."enum__menu_pages_v_published_locale" AS ENUM('en', 'ar', 'fr');
      END IF;
    END $$;
  CREATE TABLE IF NOT EXISTS "menu_media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"alt" varchar,
  	"operator_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "menu_allergens" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_allergens_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_allergens_locales" (
  	"title" varchar,
  	"description" varchar,
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_allergens_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_allergens_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_allergens_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_allergens_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_tags" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_tags_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_tags_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_tags_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_tags_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_tags_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_tags_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_categories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_categories_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_categories_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_categories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_categories_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_categories_v_locales" (
  	"version_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_items_availability_period" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_menu_items_availability_period",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_items" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"restaurant_id" uuid,
  	"slug" varchar,
  	"slug_override" boolean,
  	"price" numeric,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_items_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_items_locales" (
  	"image_id" uuid,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_items_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_allergens_id" uuid,
  	"menu_tags_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_items_v_version_availability_period" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__menu_items_v_version_availability_period",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_items_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_restaurant_id" uuid,
  	"version_slug" varchar,
  	"version_slug_override" boolean,
  	"version_price" numeric,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_items_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_items_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_items_v_locales" (
  	"version_image_id" uuid,
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_items_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_allergens_id" uuid,
  	"menu_tags_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "menu_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_id" uuid,
  	"_title" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"restaurant_id" uuid,
  	"slug" varchar,
  	"slug_override" boolean,
  	"category_id" uuid,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_locales" (
  	"image_id" uuid,
  	"category_title" varchar,
  	"restaurant_title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_version_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"item_id" uuid,
  	"_title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_restaurant_id" uuid,
  	"version_slug" varchar,
  	"version_slug_override" boolean,
  	"version_category_id" uuid,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_v_locales" (
  	"version_image_id" uuid,
  	"version_category_title" varchar,
  	"version_restaurant_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_carousel_locales" (
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_images_locales" (
  	"c_image_id" uuid,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_embed_locales" (
  	"c_html" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_text_locales" (
  	"c_label" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c_show_language" boolean DEFAULT true,
  	"c_show_notification" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_header_locales" (
  	"c_label" varchar,
  	"c_logo_id" uuid,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_filter" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c_show_search" boolean DEFAULT true,
  	"c_show_allergen_filters" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_filter_locales" (
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_items_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"info_operator_id" uuid,
  	"info_restaurant_id" uuid,
  	"info_slug_override" boolean,
  	"info_slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_menu_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "menu_pages_locales" (
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
  
  CREATE TABLE IF NOT EXISTS "menu_pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_carousel_locales" (
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_images_locales" (
  	"c_image_id" uuid,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_embed_locales" (
  	"c_html" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_text_locales" (
  	"c_label" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"c_show_language" boolean DEFAULT true,
  	"c_show_notification" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_header_locales" (
  	"c_label" varchar,
  	"c_logo_id" uuid,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_filter" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"c_show_search" boolean DEFAULT true,
  	"c_show_allergen_filters" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_filter_locales" (
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_items_locales" (
  	"c_title" varchar,
  	"c_description" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_info_operator_id" uuid,
  	"version_info_restaurant_id" uuid,
  	"version_info_slug_override" boolean,
  	"version_info_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__menu_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__menu_pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_locales" (
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
  
  CREATE TABLE IF NOT EXISTS "_menu_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "fnb_import" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "_fnb_import_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_media_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_media_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_allergens_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_allergens_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_tags_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_tags_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_categories_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_categories_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_items_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_items_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payload_locked_documents_rels' AND column_name='menu_pages_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_pages_id" uuid;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_media_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_media" ADD CONSTRAINT "menu_media_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_media_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_media" ADD CONSTRAINT "menu_media_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_media_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_media" ADD CONSTRAINT "menu_media_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_allergens_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_allergens" ADD CONSTRAINT "menu_allergens_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_allergens_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_allergens" ADD CONSTRAINT "menu_allergens_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_allergens_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_allergens" ADD CONSTRAINT "menu_allergens_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_allergens_locales_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_allergens_locales" ADD CONSTRAINT "menu_allergens_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_allergens_locales_parent_id_fk') THEN
        ALTER TABLE "menu_allergens_locales" ADD CONSTRAINT "menu_allergens_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_allergens"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_parent_id_menu_allergens_id_fk') THEN
        ALTER TABLE "_menu_allergens_v" ADD CONSTRAINT "_menu_allergens_v_parent_id_menu_allergens_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_allergens"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_allergens_v" ADD CONSTRAINT "_menu_allergens_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_allergens_v" ADD CONSTRAINT "_menu_allergens_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_allergens_v" ADD CONSTRAINT "_menu_allergens_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_locales_version_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_allergens_v_locales" ADD CONSTRAINT "_menu_allergens_v_locales_version_image_id_menu_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_allergens_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_allergens_v_locales" ADD CONSTRAINT "_menu_allergens_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_allergens_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_tags_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_tags" ADD CONSTRAINT "menu_tags_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_tags_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_tags" ADD CONSTRAINT "menu_tags_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_tags_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_tags" ADD CONSTRAINT "menu_tags_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_tags_locales_parent_id_fk') THEN
        ALTER TABLE "menu_tags_locales" ADD CONSTRAINT "menu_tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_tags"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_tags_v_parent_id_menu_tags_id_fk') THEN
        ALTER TABLE "_menu_tags_v" ADD CONSTRAINT "_menu_tags_v_parent_id_menu_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_tags"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_tags_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_tags_v" ADD CONSTRAINT "_menu_tags_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_tags_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_tags_v" ADD CONSTRAINT "_menu_tags_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_tags_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_tags_v" ADD CONSTRAINT "_menu_tags_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_tags_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_tags_v_locales" ADD CONSTRAINT "_menu_tags_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_tags_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_categories_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_categories_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_categories_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_categories_locales_parent_id_fk') THEN
        ALTER TABLE "menu_categories_locales" ADD CONSTRAINT "menu_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_categories_v_parent_id_menu_categories_id_fk') THEN
        ALTER TABLE "_menu_categories_v" ADD CONSTRAINT "_menu_categories_v_parent_id_menu_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_categories_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_categories_v" ADD CONSTRAINT "_menu_categories_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_categories_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_categories_v" ADD CONSTRAINT "_menu_categories_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_categories_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_categories_v" ADD CONSTRAINT "_menu_categories_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_categories_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_categories_v_locales" ADD CONSTRAINT "_menu_categories_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_categories_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_availability_period_parent_fk') THEN
        ALTER TABLE "menu_items_availability_period" ADD CONSTRAINT "menu_items_availability_period_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_locales_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_items_locales" ADD CONSTRAINT "menu_items_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_locales_parent_id_fk') THEN
        ALTER TABLE "menu_items_locales" ADD CONSTRAINT "menu_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_rels_parent_fk') THEN
        ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_rels_menu_allergens_fk') THEN
        ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_menu_allergens_fk" FOREIGN KEY ("menu_allergens_id") REFERENCES "public"."menu_allergens"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_rels_menu_tags_fk') THEN
        ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_menu_tags_fk" FOREIGN KEY ("menu_tags_id") REFERENCES "public"."menu_tags"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_version_availability_period_parent_fk') THEN
        ALTER TABLE "_menu_items_v_version_availability_period" ADD CONSTRAINT "_menu_items_v_version_availability_period_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_parent_id_menu_items_id_fk') THEN
        ALTER TABLE "_menu_items_v" ADD CONSTRAINT "_menu_items_v_parent_id_menu_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_items_v" ADD CONSTRAINT "_menu_items_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_version_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "_menu_items_v" ADD CONSTRAINT "_menu_items_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_items_v" ADD CONSTRAINT "_menu_items_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_items_v" ADD CONSTRAINT "_menu_items_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_locales_version_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_items_v_locales" ADD CONSTRAINT "_menu_items_v_locales_version_image_id_menu_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_items_v_locales" ADD CONSTRAINT "_menu_items_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_rels_parent_fk') THEN
        ALTER TABLE "_menu_items_v_rels" ADD CONSTRAINT "_menu_items_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_rels_menu_allergens_fk') THEN
        ALTER TABLE "_menu_items_v_rels" ADD CONSTRAINT "_menu_items_v_rels_menu_allergens_fk" FOREIGN KEY ("menu_allergens_id") REFERENCES "public"."menu_allergens"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_items_v_rels_menu_tags_fk') THEN
        ALTER TABLE "_menu_items_v_rels" ADD CONSTRAINT "_menu_items_v_rels_menu_tags_fk" FOREIGN KEY ("menu_tags_id") REFERENCES "public"."menu_tags"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_menu_items_item_id_menu_items_id_fk') THEN
        ALTER TABLE "menu_menu_items" ADD CONSTRAINT "menu_menu_items_item_id_menu_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_menu_items_parent_id_fk') THEN
        ALTER TABLE "menu_menu_items" ADD CONSTRAINT "menu_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu" ADD CONSTRAINT "menu_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "menu" ADD CONSTRAINT "menu_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_category_id_menu_categories_id_fk') THEN
        ALTER TABLE "menu" ADD CONSTRAINT "menu_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu" ADD CONSTRAINT "menu_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu" ADD CONSTRAINT "menu_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_locales_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_locales" ADD CONSTRAINT "menu_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_locales_parent_id_fk') THEN
        ALTER TABLE "menu_locales" ADD CONSTRAINT "menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_menu_items_item_id_menu_items_id_fk') THEN
        ALTER TABLE "_menu_v_version_menu_items" ADD CONSTRAINT "_menu_v_version_menu_items_item_id_menu_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_menu_items_parent_id_fk') THEN
        ALTER TABLE "_menu_v_version_menu_items" ADD CONSTRAINT "_menu_v_version_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_parent_id_menu_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_parent_id_menu_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_category_id_menu_categories_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_category_id_menu_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_v" ADD CONSTRAINT "_menu_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_locales_version_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_v_locales" ADD CONSTRAINT "_menu_v_locales_version_image_id_menu_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_v_locales" ADD CONSTRAINT "_menu_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_carousel_c_slides_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_carousel_c_slides" ADD CONSTRAINT "menu_pages_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_carousel_c_slides_locales" ADD CONSTRAINT "menu_pages_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_carousel_c_slides_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_carousel_c_slides_locales" ADD CONSTRAINT "menu_pages_blocks_carousel_c_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_carousel_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_carousel" ADD CONSTRAINT "menu_pages_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_carousel_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_carousel_locales" ADD CONSTRAINT "menu_pages_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_images_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_images" ADD CONSTRAINT "menu_pages_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_images_locales_c_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_images_locales" ADD CONSTRAINT "menu_pages_blocks_images_locales_c_image_id_menu_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_images_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_images_locales" ADD CONSTRAINT "menu_pages_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_embed_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_embed" ADD CONSTRAINT "menu_pages_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_embed_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_embed_locales" ADD CONSTRAINT "menu_pages_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_text_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_text" ADD CONSTRAINT "menu_pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_text_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_text_locales" ADD CONSTRAINT "menu_pages_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_buttons_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_buttons" ADD CONSTRAINT "menu_pages_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_buttons_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_buttons_locales" ADD CONSTRAINT "menu_pages_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_header_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_header" ADD CONSTRAINT "menu_pages_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_header_locales_c_logo_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_header_locales" ADD CONSTRAINT "menu_pages_blocks_header_locales_c_logo_id_menu_media_id_fk" FOREIGN KEY ("c_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_header_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_header_locales" ADD CONSTRAINT "menu_pages_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_filter_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_filter" ADD CONSTRAINT "menu_pages_blocks_filter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_filter_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_filter_locales" ADD CONSTRAINT "menu_pages_blocks_filter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_filter"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_items_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_items" ADD CONSTRAINT "menu_pages_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_items_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_items_locales" ADD CONSTRAINT "menu_pages_blocks_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_section_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_section" ADD CONSTRAINT "menu_pages_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_blocks_section_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_blocks_section_locales" ADD CONSTRAINT "menu_pages_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_info_operator_id_operators_id_fk') THEN
        ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_info_operator_id_operators_id_fk" FOREIGN KEY ("info_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_info_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_info_restaurant_id_restaurants_id_fk" FOREIGN KEY ("info_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_created_by_id_users_id_fk') THEN
        ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_updated_by_id_users_id_fk') THEN
        ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_locales_c_font_primary_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_locales" ADD CONSTRAINT "menu_pages_locales_c_font_primary_id_menu_media_id_fk" FOREIGN KEY ("c_font_primary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_locales_c_font_secondary_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_locales" ADD CONSTRAINT "menu_pages_locales_c_font_secondary_id_menu_media_id_fk" FOREIGN KEY ("c_font_secondary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_locales_seo_image_id_menu_media_id_fk') THEN
        ALTER TABLE "menu_pages_locales" ADD CONSTRAINT "menu_pages_locales_seo_image_id_menu_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_locales_parent_id_fk') THEN
        ALTER TABLE "menu_pages_locales" ADD CONSTRAINT "menu_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_rels_parent_fk') THEN
        ALTER TABLE "menu_pages_rels" ADD CONSTRAINT "menu_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_pages_rels_menu_fk') THEN
        ALTER TABLE "menu_pages_rels" ADD CONSTRAINT "menu_pages_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_carousel_c_slides_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_carousel_c_slides" ADD CONSTRAINT "_menu_pages_v_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_menu_pages_v_blocks_carousel_c_slides_locales_image_id_menu_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_carousel_c_slides_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_carousel_c_slides_locales" ADD CONSTRAINT "_menu_pages_v_blocks_carousel_c_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_carousel_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_carousel" ADD CONSTRAINT "_menu_pages_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_carousel_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_carousel_locales" ADD CONSTRAINT "_menu_pages_v_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_images_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_images" ADD CONSTRAINT "_menu_pages_v_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_images_locales_c_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_images_locales" ADD CONSTRAINT "_menu_pages_v_blocks_images_locales_c_image_id_menu_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_images_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_images_locales" ADD CONSTRAINT "_menu_pages_v_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_embed_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_embed" ADD CONSTRAINT "_menu_pages_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_embed_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_embed_locales" ADD CONSTRAINT "_menu_pages_v_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_text_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_text" ADD CONSTRAINT "_menu_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_text_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_text_locales" ADD CONSTRAINT "_menu_pages_v_blocks_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_text"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_buttons_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_buttons" ADD CONSTRAINT "_menu_pages_v_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_buttons_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_buttons_locales" ADD CONSTRAINT "_menu_pages_v_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_header_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_header" ADD CONSTRAINT "_menu_pages_v_blocks_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_header_locales_c_logo_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_header_locales" ADD CONSTRAINT "_menu_pages_v_blocks_header_locales_c_logo_id_menu_media_id_fk" FOREIGN KEY ("c_logo_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_header_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_header_locales" ADD CONSTRAINT "_menu_pages_v_blocks_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_header"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_filter_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_filter" ADD CONSTRAINT "_menu_pages_v_blocks_filter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_filter_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_filter_locales" ADD CONSTRAINT "_menu_pages_v_blocks_filter_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_filter"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_items_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_items" ADD CONSTRAINT "_menu_pages_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_items_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_items_locales" ADD CONSTRAINT "_menu_pages_v_blocks_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_section_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_section" ADD CONSTRAINT "_menu_pages_v_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_blocks_section_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_blocks_section_locales" ADD CONSTRAINT "_menu_pages_v_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_parent_id_menu_pages_id_fk') THEN
        ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_parent_id_menu_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_pages"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_version_info_operator_id_operators_id_fk') THEN
        ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_info_operator_id_operators_id_fk" FOREIGN KEY ("version_info_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_version_info_restaurant_id_restaurants_id_fk') THEN
        ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_info_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_info_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_version_created_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_version_updated_by_id_users_id_fk') THEN
        ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_locales_version_c_font_primary_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_locales" ADD CONSTRAINT "_menu_pages_v_locales_version_c_font_primary_id_menu_media_id_fk" FOREIGN KEY ("version_c_font_primary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_locales_version_c_font_secondary_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_locales" ADD CONSTRAINT "_menu_pages_v_locales_version_c_font_secondary_id_menu_media_id_fk" FOREIGN KEY ("version_c_font_secondary_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_locales_version_seo_image_id_menu_media_id_fk') THEN
        ALTER TABLE "_menu_pages_v_locales" ADD CONSTRAINT "_menu_pages_v_locales_version_seo_image_id_menu_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_locales_parent_id_fk') THEN
        ALTER TABLE "_menu_pages_v_locales" ADD CONSTRAINT "_menu_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_rels_parent_fk') THEN
        ALTER TABLE "_menu_pages_v_rels" ADD CONSTRAINT "_menu_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_menu_pages_v"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_menu_pages_v_rels_menu_fk') THEN
        ALTER TABLE "_menu_pages_v_rels" ADD CONSTRAINT "_menu_pages_v_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  CREATE INDEX IF NOT EXISTS "menu_media_operator_idx" ON "menu_media" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "menu_media_created_by_idx" ON "menu_media" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_media_updated_by_idx" ON "menu_media" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_media_updated_at_idx" ON "menu_media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_media_created_at_idx" ON "menu_media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_media_filename_idx" ON "menu_media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "menu_allergens_operator_idx" ON "menu_allergens" USING btree ("operator_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_allergens_operator_slug_idx" ON "menu_allergens" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_allergens_created_by_idx" ON "menu_allergens" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_allergens_updated_by_idx" ON "menu_allergens" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_allergens_updated_at_idx" ON "menu_allergens" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_allergens_created_at_idx" ON "menu_allergens" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu_allergens__status_idx" ON "menu_allergens" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "menu_allergens_image_idx" ON "menu_allergens_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_allergens_locales_locale_parent_id_unique" ON "menu_allergens_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_parent_idx" ON "_menu_allergens_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_operator_idx" ON "_menu_allergens_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_operator_slug_idx" ON "_menu_allergens_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_created_by_idx" ON "_menu_allergens_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_updated_by_idx" ON "_menu_allergens_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_updated_at_idx" ON "_menu_allergens_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_created_at_idx" ON "_menu_allergens_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version__status_idx" ON "_menu_allergens_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_created_at_idx" ON "_menu_allergens_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_updated_at_idx" ON "_menu_allergens_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_snapshot_idx" ON "_menu_allergens_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_published_locale_idx" ON "_menu_allergens_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_latest_idx" ON "_menu_allergens_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_autosave_idx" ON "_menu_allergens_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_version_version_image_idx" ON "_menu_allergens_v_locales" USING btree ("version_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_allergens_v_locales_locale_parent_id_unique" ON "_menu_allergens_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_tags_operator_idx" ON "menu_tags" USING btree ("operator_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_tags_operator_slug_idx" ON "menu_tags" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_tags_created_by_idx" ON "menu_tags" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_tags_updated_by_idx" ON "menu_tags" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_tags_updated_at_idx" ON "menu_tags" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_tags_created_at_idx" ON "menu_tags" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu_tags__status_idx" ON "menu_tags" USING btree ("_status");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_tags_locales_locale_parent_id_unique" ON "menu_tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_parent_idx" ON "_menu_tags_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_operator_idx" ON "_menu_tags_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_operator_slug_idx" ON "_menu_tags_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_created_by_idx" ON "_menu_tags_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_updated_by_idx" ON "_menu_tags_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_updated_at_idx" ON "_menu_tags_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version_created_at_idx" ON "_menu_tags_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_version_version__status_idx" ON "_menu_tags_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_created_at_idx" ON "_menu_tags_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_updated_at_idx" ON "_menu_tags_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_snapshot_idx" ON "_menu_tags_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_published_locale_idx" ON "_menu_tags_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_latest_idx" ON "_menu_tags_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_autosave_idx" ON "_menu_tags_v" USING btree ("autosave");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_tags_v_locales_locale_parent_id_unique" ON "_menu_tags_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_categories_operator_idx" ON "menu_categories" USING btree ("operator_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_operator_slug_idx" ON "menu_categories" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_categories_created_by_idx" ON "menu_categories" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_categories_updated_by_idx" ON "menu_categories" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu_categories__status_idx" ON "menu_categories" USING btree ("_status");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_categories_locales_locale_parent_id_unique" ON "menu_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_parent_idx" ON "_menu_categories_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_operator_idx" ON "_menu_categories_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_operator_slug_idx" ON "_menu_categories_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_created_by_idx" ON "_menu_categories_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_updated_by_idx" ON "_menu_categories_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_updated_at_idx" ON "_menu_categories_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version_created_at_idx" ON "_menu_categories_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_version_version__status_idx" ON "_menu_categories_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_created_at_idx" ON "_menu_categories_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_updated_at_idx" ON "_menu_categories_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_snapshot_idx" ON "_menu_categories_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_published_locale_idx" ON "_menu_categories_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_latest_idx" ON "_menu_categories_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_autosave_idx" ON "_menu_categories_v" USING btree ("autosave");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_categories_v_locales_locale_parent_id_unique" ON "_menu_categories_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_items_availability_period_order_idx" ON "menu_items_availability_period" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "menu_items_availability_period_parent_idx" ON "menu_items_availability_period" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "menu_items_operator_idx" ON "menu_items" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "menu_items_restaurant_idx" ON "menu_items" USING btree ("restaurant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_slug_idx" ON "menu_items" USING btree ("slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_operator_slug_idx" ON "menu_items" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_items_created_by_idx" ON "menu_items" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_items_updated_by_idx" ON "menu_items" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu_items__status_idx" ON "menu_items" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "menu_items_image_idx" ON "menu_items_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_locales_locale_parent_id_unique" ON "menu_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_items_rels_order_idx" ON "menu_items_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "menu_items_rels_parent_idx" ON "menu_items_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "menu_items_rels_path_idx" ON "menu_items_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "menu_items_rels_menu_allergens_id_idx" ON "menu_items_rels" USING btree ("menu_allergens_id");
  CREATE INDEX IF NOT EXISTS "menu_items_rels_menu_tags_id_idx" ON "menu_items_rels" USING btree ("menu_tags_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_availability_period_order_idx" ON "_menu_items_v_version_availability_period" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_availability_period_parent_idx" ON "_menu_items_v_version_availability_period" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_parent_idx" ON "_menu_items_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_operator_idx" ON "_menu_items_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_restaurant_idx" ON "_menu_items_v" USING btree ("version_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_slug_idx" ON "_menu_items_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_operator_slug_idx" ON "_menu_items_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_created_by_idx" ON "_menu_items_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_updated_by_idx" ON "_menu_items_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_updated_at_idx" ON "_menu_items_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_created_at_idx" ON "_menu_items_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version__status_idx" ON "_menu_items_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_created_at_idx" ON "_menu_items_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_updated_at_idx" ON "_menu_items_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_snapshot_idx" ON "_menu_items_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_published_locale_idx" ON "_menu_items_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_latest_idx" ON "_menu_items_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_autosave_idx" ON "_menu_items_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_image_idx" ON "_menu_items_v_locales" USING btree ("version_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_items_v_locales_locale_parent_id_unique" ON "_menu_items_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_rels_order_idx" ON "_menu_items_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_rels_parent_idx" ON "_menu_items_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_rels_path_idx" ON "_menu_items_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_rels_menu_allergens_id_idx" ON "_menu_items_v_rels" USING btree ("menu_allergens_id");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_rels_menu_tags_id_idx" ON "_menu_items_v_rels" USING btree ("menu_tags_id");
  CREATE INDEX IF NOT EXISTS "menu_menu_items_order_idx" ON "menu_menu_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_menu_items_parent_id_idx" ON "menu_menu_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_menu_items_item_idx" ON "menu_menu_items" USING btree ("item_id");
  CREATE INDEX IF NOT EXISTS "menu_operator_idx" ON "menu" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "menu_restaurant_idx" ON "menu" USING btree ("restaurant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_slug_idx" ON "menu" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "menu_category_idx" ON "menu" USING btree ("category_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_operator_slug_idx" ON "menu" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_created_by_idx" ON "menu" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_updated_by_idx" ON "menu" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_updated_at_idx" ON "menu" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_created_at_idx" ON "menu" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu__status_idx" ON "menu" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "menu_image_idx" ON "menu_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_locales_locale_parent_id_unique" ON "menu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_menu_items_order_idx" ON "_menu_v_version_menu_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_menu_items_parent_id_idx" ON "_menu_v_version_menu_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_menu_items_item_idx" ON "_menu_v_version_menu_items" USING btree ("item_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_parent_idx" ON "_menu_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_operator_idx" ON "_menu_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_restaurant_idx" ON "_menu_v" USING btree ("version_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_slug_idx" ON "_menu_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_category_idx" ON "_menu_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_operator_slug_idx" ON "_menu_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_created_by_idx" ON "_menu_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_updated_by_idx" ON "_menu_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_updated_at_idx" ON "_menu_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_created_at_idx" ON "_menu_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version__status_idx" ON "_menu_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_v_created_at_idx" ON "_menu_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_v_updated_at_idx" ON "_menu_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_v_snapshot_idx" ON "_menu_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_v_published_locale_idx" ON "_menu_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_v_latest_idx" ON "_menu_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_v_autosave_idx" ON "_menu_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_image_idx" ON "_menu_v_locales" USING btree ("version_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_v_locales_locale_parent_id_unique" ON "_menu_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_c_slides_order_idx" ON "menu_pages_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_c_slides_parent_id_idx" ON "menu_pages_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_c_slides_image_idx" ON "menu_pages_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_c_slides_locales_locale_parent_id" ON "menu_pages_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_order_idx" ON "menu_pages_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_parent_id_idx" ON "menu_pages_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_path_idx" ON "menu_pages_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_carousel_locales_locale_parent_id_unique" ON "menu_pages_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_images_order_idx" ON "menu_pages_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_images_parent_id_idx" ON "menu_pages_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_images_path_idx" ON "menu_pages_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_images_c_c_image_idx" ON "menu_pages_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_images_locales_locale_parent_id_unique" ON "menu_pages_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_embed_order_idx" ON "menu_pages_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_embed_parent_id_idx" ON "menu_pages_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_embed_path_idx" ON "menu_pages_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_embed_locales_locale_parent_id_unique" ON "menu_pages_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_text_order_idx" ON "menu_pages_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_text_parent_id_idx" ON "menu_pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_text_path_idx" ON "menu_pages_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_text_locales_locale_parent_id_unique" ON "menu_pages_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_buttons_order_idx" ON "menu_pages_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_buttons_parent_id_idx" ON "menu_pages_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_buttons_path_idx" ON "menu_pages_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_buttons_locales_locale_parent_id_unique" ON "menu_pages_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_header_order_idx" ON "menu_pages_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_header_parent_id_idx" ON "menu_pages_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_header_path_idx" ON "menu_pages_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_header_c_c_logo_idx" ON "menu_pages_blocks_header_locales" USING btree ("c_logo_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_header_locales_locale_parent_id_unique" ON "menu_pages_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_filter_order_idx" ON "menu_pages_blocks_filter" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_filter_parent_id_idx" ON "menu_pages_blocks_filter" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_filter_path_idx" ON "menu_pages_blocks_filter" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_filter_locales_locale_parent_id_unique" ON "menu_pages_blocks_filter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_items_order_idx" ON "menu_pages_blocks_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_items_parent_id_idx" ON "menu_pages_blocks_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_items_path_idx" ON "menu_pages_blocks_items" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_items_locales_locale_parent_id_unique" ON "menu_pages_blocks_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_section_order_idx" ON "menu_pages_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_section_parent_id_idx" ON "menu_pages_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_blocks_section_path_idx" ON "menu_pages_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_blocks_section_locales_locale_parent_id_unique" ON "menu_pages_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_info_info_operator_idx" ON "menu_pages" USING btree ("info_operator_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_info_info_restaurant_idx" ON "menu_pages" USING btree ("info_restaurant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_info_info_slug_idx" ON "menu_pages" USING btree ("info_slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_operator_slug_idx" ON "menu_pages" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "menu_pages_created_by_idx" ON "menu_pages" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_updated_by_idx" ON "menu_pages" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_updated_at_idx" ON "menu_pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "menu_pages_created_at_idx" ON "menu_pages" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "menu_pages__status_idx" ON "menu_pages" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "menu_pages_c_c_font_primary_idx" ON "menu_pages_locales" USING btree ("c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "menu_pages_c_c_font_secondary_idx" ON "menu_pages_locales" USING btree ("c_font_secondary_id","_locale");
  CREATE INDEX IF NOT EXISTS "menu_pages_seo_seo_image_idx" ON "menu_pages_locales" USING btree ("seo_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "menu_pages_locales_locale_parent_id_unique" ON "menu_pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_rels_order_idx" ON "menu_pages_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "menu_pages_rels_parent_idx" ON "menu_pages_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_rels_path_idx" ON "menu_pages_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "menu_pages_rels_menu_id_idx" ON "menu_pages_rels" USING btree ("menu_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides_order_idx" ON "_menu_pages_v_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides_parent_id_idx" ON "_menu_pages_v_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides_image_idx" ON "_menu_pages_v_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_c_slides_locales_locale_parent" ON "_menu_pages_v_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_order_idx" ON "_menu_pages_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_parent_id_idx" ON "_menu_pages_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_path_idx" ON "_menu_pages_v_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_carousel_locales_locale_parent_id_uniqu" ON "_menu_pages_v_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_images_order_idx" ON "_menu_pages_v_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_images_parent_id_idx" ON "_menu_pages_v_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_images_path_idx" ON "_menu_pages_v_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_images_c_c_image_idx" ON "_menu_pages_v_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_images_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_embed_order_idx" ON "_menu_pages_v_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_embed_parent_id_idx" ON "_menu_pages_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_embed_path_idx" ON "_menu_pages_v_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_embed_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_text_order_idx" ON "_menu_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_text_parent_id_idx" ON "_menu_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_text_path_idx" ON "_menu_pages_v_blocks_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_text_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_buttons_order_idx" ON "_menu_pages_v_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_buttons_parent_id_idx" ON "_menu_pages_v_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_buttons_path_idx" ON "_menu_pages_v_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_buttons_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_buttons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_header_order_idx" ON "_menu_pages_v_blocks_header" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_header_parent_id_idx" ON "_menu_pages_v_blocks_header" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_header_path_idx" ON "_menu_pages_v_blocks_header" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_header_c_c_logo_idx" ON "_menu_pages_v_blocks_header_locales" USING btree ("c_logo_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_header_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_filter_order_idx" ON "_menu_pages_v_blocks_filter" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_filter_parent_id_idx" ON "_menu_pages_v_blocks_filter" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_filter_path_idx" ON "_menu_pages_v_blocks_filter" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_filter_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_filter_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_items_order_idx" ON "_menu_pages_v_blocks_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_items_parent_id_idx" ON "_menu_pages_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_items_path_idx" ON "_menu_pages_v_blocks_items" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_items_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_section_order_idx" ON "_menu_pages_v_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_section_parent_id_idx" ON "_menu_pages_v_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_blocks_section_path_idx" ON "_menu_pages_v_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_blocks_section_locales_locale_parent_id_unique" ON "_menu_pages_v_blocks_section_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_parent_idx" ON "_menu_pages_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_info_version_info_operator_idx" ON "_menu_pages_v" USING btree ("version_info_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_info_version_info_restaurant_idx" ON "_menu_pages_v" USING btree ("version_info_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_info_version_info_slug_idx" ON "_menu_pages_v" USING btree ("version_info_slug");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_operator_slug_idx" ON "_menu_pages_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_created_by_idx" ON "_menu_pages_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_updated_by_idx" ON "_menu_pages_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_updated_at_idx" ON "_menu_pages_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_created_at_idx" ON "_menu_pages_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version__status_idx" ON "_menu_pages_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_created_at_idx" ON "_menu_pages_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_updated_at_idx" ON "_menu_pages_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_snapshot_idx" ON "_menu_pages_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_published_locale_idx" ON "_menu_pages_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_latest_idx" ON "_menu_pages_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_autosave_idx" ON "_menu_pages_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_c_version_c_font_primary_idx" ON "_menu_pages_v_locales" USING btree ("version_c_font_primary_id","_locale");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_c_version_c_font_secondary_idx" ON "_menu_pages_v_locales" USING btree ("version_c_font_secondary_id","_locale");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_seo_version_seo_image_idx" ON "_menu_pages_v_locales" USING btree ("version_seo_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "_menu_pages_v_locales_locale_parent_id_unique" ON "_menu_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_rels_order_idx" ON "_menu_pages_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_rels_parent_idx" ON "_menu_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_rels_path_idx" ON "_menu_pages_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_rels_menu_id_idx" ON "_menu_pages_v_rels" USING btree ("menu_id");
  CREATE INDEX IF NOT EXISTS "_fnb_import_v_created_at_idx" ON "_fnb_import_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_fnb_import_v_updated_at_idx" ON "_fnb_import_v" USING btree ("updated_at");
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_media_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_media_fk" FOREIGN KEY ("menu_media_id") REFERENCES "public"."menu_media"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_allergens_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_allergens_fk" FOREIGN KEY ("menu_allergens_id") REFERENCES "public"."menu_allergens"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_tags_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_tags_fk" FOREIGN KEY ("menu_tags_id") REFERENCES "public"."menu_tags"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_categories_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_items_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_menu_pages_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_pages_fk" FOREIGN KEY ("menu_pages_id") REFERENCES "public"."menu_pages"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_media_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_allergens_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_allergens_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_tags_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_allergens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_allergens_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_allergens_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_allergens_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_tags_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_tags_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_categories_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items_availability_period" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_items_v_version_availability_period" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_items_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_items_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_items_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_version_menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_filter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_filter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_blocks_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_carousel_c_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_carousel_c_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_carousel_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_embed_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_buttons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_header" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_header_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_filter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_filter_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_blocks_section_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_menu_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fnb_import" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_fnb_import_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "menu_media" CASCADE;
  DROP TABLE IF EXISTS "menu_allergens" CASCADE;
  DROP TABLE IF EXISTS "menu_allergens_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_allergens_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_allergens_v_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_tags" CASCADE;
  DROP TABLE IF EXISTS "menu_tags_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_tags_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_tags_v_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_categories" CASCADE;
  DROP TABLE IF EXISTS "menu_categories_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_categories_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_categories_v_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_items_availability_period" CASCADE;
  DROP TABLE IF EXISTS "menu_items" CASCADE;
  DROP TABLE IF EXISTS "menu_items_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_items_rels" CASCADE;
  DROP TABLE IF EXISTS "_menu_items_v_version_availability_period" CASCADE;
  DROP TABLE IF EXISTS "_menu_items_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_items_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_items_v_rels" CASCADE;
  DROP TABLE IF EXISTS "menu_menu_items" CASCADE;
  DROP TABLE IF EXISTS "menu" CASCADE;
  DROP TABLE IF EXISTS "menu_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_v_version_menu_items" CASCADE;
  DROP TABLE IF EXISTS "_menu_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_v_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_filter" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_filter_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_items" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_items_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_locales" CASCADE;
  DROP TABLE IF EXISTS "menu_pages_rels" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_text" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_text_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_buttons_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_header" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_header_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_filter" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_filter_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_items" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_items_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_blocks_section_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_menu_pages_v_rels" CASCADE;
  DROP TABLE IF EXISTS "fnb_import" CASCADE;
  DROP TABLE IF EXISTS "_fnb_import_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_allergens_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_menu_pages_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_media_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_allergens_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_tags_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_items_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_menu_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_allergens_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "menu_pages_id";
  DROP TYPE IF EXISTS "public"."enum_menu_allergens_status";
  DROP TYPE IF EXISTS "public"."enum__menu_allergens_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_allergens_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_menu_tags_status";
  DROP TYPE IF EXISTS "public"."enum__menu_tags_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_tags_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_menu_categories_status";
  DROP TYPE IF EXISTS "public"."enum__menu_categories_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_categories_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_menu_items_availability_period";
  DROP TYPE IF EXISTS "public"."enum_menu_items_status";
  DROP TYPE IF EXISTS "public"."enum__menu_items_v_version_availability_period";
  DROP TYPE IF EXISTS "public"."enum__menu_items_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_items_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_menu_status";
  DROP TYPE IF EXISTS "public"."enum__menu_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_menu_pages_status";
  DROP TYPE IF EXISTS "public"."enum__menu_pages_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__menu_pages_v_published_locale";`)
}
