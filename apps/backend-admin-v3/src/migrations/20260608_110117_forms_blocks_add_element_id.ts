import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_buttons_c_variant" AS ENUM('primary', 'secondary', 'accent', 'neutral', 'ghost', 'link', 'outline');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_buttons_c_size" AS ENUM('2xl', 'xl', 'lg', 'md', 'sm', 'xs', '2xs');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "forms_blocks_form_fields_locales" (
  	"settings_element_id" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_buttons_locales" (
  	"c_label" varchar,
  	"c_link" varchar,
  	"c_variant" "enum_forms_blocks_buttons_c_variant",
  	"c_size" "enum_forms_blocks_buttons_c_size",
  	"settings_element_id" varchar,
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "forms_blocks_carousel_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;
  ALTER TABLE "forms_blocks_images_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;
  ALTER TABLE "forms_blocks_embed_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;
  ALTER TABLE "forms_blocks_text_2_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;
  ALTER TABLE "forms_blocks_rich_text_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;
  ALTER TABLE "forms_blocks_section_locales" ADD COLUMN IF NOT EXISTS "settings_element_id" varchar;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_form_fields_locales" ADD CONSTRAINT "forms_blocks_form_fields_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_form_fields"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_buttons" ADD CONSTRAINT "forms_blocks_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_buttons_locales" ADD CONSTRAINT "forms_blocks_buttons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_buttons"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_form_fields_locales_locale_parent_id_unique" ON "forms_blocks_form_fields_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_buttons_order_idx" ON "forms_blocks_buttons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_buttons_parent_id_idx" ON "forms_blocks_buttons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_buttons_path_idx" ON "forms_blocks_buttons" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_buttons_locales_locale_parent_id_unique" ON "forms_blocks_buttons_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "forms_blocks_form_fields_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_buttons" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_buttons_locales" CASCADE;
  ALTER TABLE "forms_blocks_carousel_locales" DROP COLUMN IF EXISTS "settings_element_id";
  ALTER TABLE "forms_blocks_images_locales" DROP COLUMN IF EXISTS "settings_element_id";
  ALTER TABLE "forms_blocks_embed_locales" DROP COLUMN IF EXISTS "settings_element_id";
  ALTER TABLE "forms_blocks_text_2_locales" DROP COLUMN IF EXISTS "settings_element_id";
  ALTER TABLE "forms_blocks_rich_text_locales" DROP COLUMN IF EXISTS "settings_element_id";
  ALTER TABLE "forms_blocks_section_locales" DROP COLUMN IF EXISTS "settings_element_id";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_buttons_c_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_buttons_c_size";`)
}
