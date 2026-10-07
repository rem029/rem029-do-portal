import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_forms_blocks_conditional_operator" AS ENUM('equal', 'not_equal', 'contains', 'not_contains');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "forms_blocks_conditional" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "width" numeric,
      "required" boolean DEFAULT false,
      "condition_field" varchar NOT NULL,
      "operator" "enum_forms_blocks_conditional_operator" DEFAULT 'equal' NOT NULL,
      "value" varchar NOT NULL,
      "block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_conditional_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    
    ALTER TABLE "forms_blocks_list" ADD COLUMN IF NOT EXISTS "max_items" numeric;
    ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "qr_png_id" uuid;
    ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "qr_svg_id" uuid;

    DO $$ BEGIN
      ALTER TABLE "forms_blocks_conditional" ADD CONSTRAINT "forms_blocks_conditional_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "forms_blocks_conditional_locales" ADD CONSTRAINT "forms_blocks_conditional_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_conditional"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "forms_blocks_conditional_order_idx" ON "forms_blocks_conditional" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_conditional_parent_id_idx" ON "forms_blocks_conditional" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_conditional_path_idx" ON "forms_blocks_conditional" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_conditional_locales_locale_parent_id_unique" ON "forms_blocks_conditional_locales" USING btree ("_locale","_parent_id");

    DO $$ BEGIN
      ALTER TABLE "forms" ADD CONSTRAINT "forms_qr_png_id_forms_media_id_fk" FOREIGN KEY ("qr_png_id") REFERENCES "public"."forms_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "forms" ADD CONSTRAINT "forms_qr_svg_id_forms_media_id_fk" FOREIGN KEY ("qr_svg_id") REFERENCES "public"."forms_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "forms_qr_png_idx" ON "forms" USING btree ("qr_png_id");
    CREATE INDEX IF NOT EXISTS "forms_qr_svg_idx" ON "forms" USING btree ("qr_svg_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "forms_blocks_conditional" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "forms_blocks_conditional_locales" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "forms_blocks_conditional" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_conditional_locales" CASCADE;
    ALTER TABLE IF EXISTS "forms" DROP CONSTRAINT IF EXISTS "forms_qr_png_id_forms_media_id_fk";
    ALTER TABLE IF EXISTS "forms" DROP CONSTRAINT IF EXISTS "forms_qr_svg_id_forms_media_id_fk";
    
    DROP INDEX IF EXISTS "forms_qr_png_idx";
    DROP INDEX IF EXISTS "forms_qr_svg_idx";
    ALTER TABLE IF EXISTS "forms_blocks_list" DROP COLUMN IF EXISTS "max_items";
    ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "qr_png_id";
    ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "qr_svg_id";
    DROP TYPE IF EXISTS "public"."enum_forms_blocks_conditional_operator";`)
}
