import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "site_pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c_rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "site_pages_blocks_rich_text_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"c_rich_text" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_site_pages_v_blocks_rich_text_locales" (
  	"settings_class_name" varchar,
  	"settings_css" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_rich_text" ADD CONSTRAINT "site_pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    ALTER TABLE "site_pages_blocks_rich_text_locales" ADD CONSTRAINT "site_pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_rich_text" ADD CONSTRAINT "_site_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
    ALTER TABLE "_site_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_site_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_rich_text_order_idx" ON "site_pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_rich_text_parent_id_idx" ON "site_pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_pages_blocks_rich_text_path_idx" ON "site_pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_blocks_rich_text_locales_locale_parent_id_unique" ON "site_pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_rich_text_order_idx" ON "_site_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_rich_text_parent_id_idx" ON "_site_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_site_pages_v_blocks_rich_text_path_idx" ON "_site_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "_site_pages_v_blocks_rich_text_locales_locale_parent_id_uniq" ON "_site_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "site_pages_blocks_rich_text" CASCADE;
  DROP TABLE IF EXISTS "site_pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE IF EXISTS "_site_pages_v_blocks_rich_text_locales" CASCADE;`)
}
