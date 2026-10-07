import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_forms_available_languages" AS ENUM('EN', 'AR');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "forms_blocks_select_restaurants" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "width" numeric,
      "required" boolean DEFAULT false,
      "add_all" boolean DEFAULT true,
      "block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_select_restaurants_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_select_operators" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "width" numeric,
      "required" boolean DEFAULT false,
      "add_all" boolean DEFAULT true,
      "block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_select_operators_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_time" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "width" numeric,
      "required" boolean DEFAULT false,
      "block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_time_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_available_languages" (
      "order" integer NOT NULL,
      "parent_id" uuid NOT NULL,
      "value" "enum_forms_available_languages",
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_rich_text" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_rich_text_locales" (
      "c_content" jsonb,
      "settings_class_name" varchar,
      "settings_css" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" uuid NOT NULL,
      "path" varchar NOT NULL
    );

    ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "restaurants_id" uuid;
    ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "operators_id" uuid;
    
    ALTER TABLE IF EXISTS "forms_blocks_country" ALTER COLUMN "required" SET DEFAULT false;

    ALTER TABLE IF EXISTS "forms_blocks_select_restaurants" DROP CONSTRAINT IF EXISTS "forms_blocks_select_restaurants_parent_id_fk";
    ALTER TABLE "forms_blocks_select_restaurants" ADD CONSTRAINT "forms_blocks_select_restaurants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_select_restaurants_locales" DROP CONSTRAINT IF EXISTS "forms_blocks_select_restaurants_locales_parent_id_fk";
    ALTER TABLE "forms_blocks_select_restaurants_locales" ADD CONSTRAINT "forms_blocks_select_restaurants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_restaurants"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_select_operators" DROP CONSTRAINT IF EXISTS "forms_blocks_select_operators_parent_id_fk";
    ALTER TABLE "forms_blocks_select_operators" ADD CONSTRAINT "forms_blocks_select_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_select_operators_locales" DROP CONSTRAINT IF EXISTS "forms_blocks_select_operators_locales_parent_id_fk";
    ALTER TABLE "forms_blocks_select_operators_locales" ADD CONSTRAINT "forms_blocks_select_operators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_operators"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_time" DROP CONSTRAINT IF EXISTS "forms_blocks_time_parent_id_fk";
    ALTER TABLE "forms_blocks_time" ADD CONSTRAINT "forms_blocks_time_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_time_locales" DROP CONSTRAINT IF EXISTS "forms_blocks_time_locales_parent_id_fk";
    ALTER TABLE "forms_blocks_time_locales" ADD CONSTRAINT "forms_blocks_time_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_time"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_available_languages" DROP CONSTRAINT IF EXISTS "forms_available_languages_parent_fk";
    ALTER TABLE "forms_available_languages" ADD CONSTRAINT "forms_available_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_rich_text" DROP CONSTRAINT IF EXISTS "forms_blocks_rich_text_parent_id_fk";
    ALTER TABLE "forms_blocks_rich_text" ADD CONSTRAINT "forms_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_blocks_rich_text_locales" DROP CONSTRAINT IF EXISTS "forms_blocks_rich_text_locales_parent_id_fk";
    ALTER TABLE "forms_blocks_rich_text_locales" ADD CONSTRAINT "forms_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_parent_fk";
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_restaurants_fk";
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE IF EXISTS "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_operators_fk";
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_operators_fk" FOREIGN KEY ("operators_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "forms_blocks_select_restaurants_order_idx" ON "forms_blocks_select_restaurants" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_select_restaurants_parent_id_idx" ON "forms_blocks_select_restaurants" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_select_restaurants_path_idx" ON "forms_blocks_select_restaurants" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_restaurants_locales_locale_parent_id_uni" ON "forms_blocks_select_restaurants_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_select_operators_order_idx" ON "forms_blocks_select_operators" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_select_operators_parent_id_idx" ON "forms_blocks_select_operators" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_select_operators_path_idx" ON "forms_blocks_select_operators" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_operators_locales_locale_parent_id_uniqu" ON "forms_blocks_select_operators_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_time_order_idx" ON "forms_blocks_time" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_time_parent_id_idx" ON "forms_blocks_time" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_time_path_idx" ON "forms_blocks_time" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_time_locales_locale_parent_id_unique" ON "forms_blocks_time_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_available_languages_order_idx" ON "forms_available_languages" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "forms_available_languages_parent_idx" ON "forms_available_languages" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_rich_text_order_idx" ON "forms_blocks_rich_text" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_rich_text_parent_id_idx" ON "forms_blocks_rich_text" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_rich_text_path_idx" ON "forms_blocks_rich_text" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_rich_text_locales_locale_parent_id_unique" ON "forms_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_rels_order_idx" ON "forms_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "forms_rels_parent_idx" ON "forms_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "forms_rels_path_idx" ON "forms_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "forms_rels_restaurants_id_idx" ON "forms_rels" USING btree ("restaurants_id");
    CREATE INDEX IF NOT EXISTS "forms_rels_operators_id_idx" ON "forms_rels" USING btree ("operators_id");
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "forms_blocks_select_restaurants" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_select_restaurants_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_select_operators" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_select_operators_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_time" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_time_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_available_languages" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_rels" DISABLE ROW LEVEL SECURITY;

    DROP TABLE IF EXISTS "forms_blocks_select_restaurants" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_select_restaurants_locales" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_select_operators" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_select_operators_locales" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_time" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_time_locales" CASCADE;
    DROP TABLE IF EXISTS "forms_available_languages" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_rich_text" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_rich_text_locales" CASCADE;

    ALTER TABLE IF EXISTS "forms_rels" DROP COLUMN IF EXISTS "restaurants_id";
    ALTER TABLE IF EXISTS "forms_rels" DROP COLUMN IF EXISTS "operators_id";

    ALTER TABLE IF EXISTS "forms_blocks_country" ALTER COLUMN "required" DROP DEFAULT;
    DROP TYPE IF EXISTS "public"."enum_forms_available_languages";
  `);
}

