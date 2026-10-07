import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "forms_blocks_form_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_carousel_c_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_carousel_c_slides_locales" (
  	"image_id" uuid,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_carousel_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_images_locales" (
  	"c_image_id" uuid,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_embed_locales" (
  	"c_html" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_text_2" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_text_2_locales" (
  	"c_label" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_section_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"settings_js" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "use_layout" boolean DEFAULT false;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_form_fields" ADD CONSTRAINT "forms_blocks_form_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_carousel_c_slides" ADD CONSTRAINT "forms_blocks_carousel_c_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_carousel_c_slides_locales" ADD CONSTRAINT "forms_blocks_carousel_c_slides_locales_image_id_forms_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."forms_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_carousel_c_slides_locales" ADD CONSTRAINT "forms_blocks_carousel_c_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_carousel_c_slides"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_carousel" ADD CONSTRAINT "forms_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_carousel_locales" ADD CONSTRAINT "forms_blocks_carousel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_images" ADD CONSTRAINT "forms_blocks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_images_locales" ADD CONSTRAINT "forms_blocks_images_locales_c_image_id_forms_media_id_fk" FOREIGN KEY ("c_image_id") REFERENCES "public"."forms_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_images_locales" ADD CONSTRAINT "forms_blocks_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_embed" ADD CONSTRAINT "forms_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_embed_locales" ADD CONSTRAINT "forms_blocks_embed_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_embed"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_text_2" ADD CONSTRAINT "forms_blocks_text_2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_text_2_locales" ADD CONSTRAINT "forms_blocks_text_2_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_text_2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_section" ADD CONSTRAINT "forms_blocks_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_section_locales" ADD CONSTRAINT "forms_blocks_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_section"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "forms_blocks_form_fields_order_idx" ON "forms_blocks_form_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_form_fields_parent_id_idx" ON "forms_blocks_form_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_form_fields_path_idx" ON "forms_blocks_form_fields" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_c_slides_order_idx" ON "forms_blocks_carousel_c_slides" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_c_slides_parent_id_idx" ON "forms_blocks_carousel_c_slides" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_c_slides_image_idx" ON "forms_blocks_carousel_c_slides_locales" USING btree ("image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_carousel_c_slides_locales_locale_parent_id_uniq" ON "forms_blocks_carousel_c_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_order_idx" ON "forms_blocks_carousel" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_parent_id_idx" ON "forms_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_carousel_path_idx" ON "forms_blocks_carousel" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_carousel_locales_locale_parent_id_unique" ON "forms_blocks_carousel_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_images_order_idx" ON "forms_blocks_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_images_parent_id_idx" ON "forms_blocks_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_images_path_idx" ON "forms_blocks_images" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "forms_blocks_images_c_c_image_idx" ON "forms_blocks_images_locales" USING btree ("c_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_images_locales_locale_parent_id_unique" ON "forms_blocks_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_embed_order_idx" ON "forms_blocks_embed" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_embed_parent_id_idx" ON "forms_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_embed_path_idx" ON "forms_blocks_embed" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_embed_locales_locale_parent_id_unique" ON "forms_blocks_embed_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_text_2_order_idx" ON "forms_blocks_text_2" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_text_2_parent_id_idx" ON "forms_blocks_text_2" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_text_2_path_idx" ON "forms_blocks_text_2" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_text_2_locales_locale_parent_id_unique" ON "forms_blocks_text_2_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_section_order_idx" ON "forms_blocks_section" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_section_parent_id_idx" ON "forms_blocks_section" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_section_path_idx" ON "forms_blocks_section" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_section_locales_locale_parent_id_unique" ON "forms_blocks_section_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "forms_blocks_form_fields" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_carousel_c_slides" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_carousel_c_slides_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_carousel" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_carousel_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_images" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_images_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_embed" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_embed_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_text_2" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_text_2_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_section" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_section_locales" CASCADE;
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "use_layout";`)
}
