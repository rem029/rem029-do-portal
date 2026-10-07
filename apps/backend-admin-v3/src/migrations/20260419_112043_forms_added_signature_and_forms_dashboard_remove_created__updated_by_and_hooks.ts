import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_forms_theme' AND e.enumlabel = 'dohaquest-new') THEN
        ALTER TYPE "public"."enum_forms_theme" ADD VALUE 'dohaquest-new' BEFORE 'banyan-tree-lululemon';
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS "forms_blocks_signature" (
    	"_order" integer NOT NULL,
    	"_parent_id" uuid NOT NULL,
    	"_path" text NOT NULL,
    	"id" varchar PRIMARY KEY NOT NULL,
    	"name" varchar NOT NULL,
    	"width" numeric,
    	"required" boolean DEFAULT false,
    	"block_name" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "forms_blocks_signature_locales" (
    	"label" varchar,
    	"id" serial PRIMARY KEY NOT NULL,
    	"_locale" "_locales" NOT NULL,
    	"_parent_id" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "forms_dashboard" (
    	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    	"updated_at" timestamp(3) with time zone,
    	"created_at" timestamp(3) with time zone
    );
    
    ALTER TABLE "forms_locales" ADD COLUMN IF NOT EXISTS "terms_content" jsonb;

    ALTER TABLE "forms_blocks_signature" DROP CONSTRAINT IF EXISTS "forms_blocks_signature_parent_id_fk";
    ALTER TABLE "forms_blocks_signature" ADD CONSTRAINT "forms_blocks_signature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    
    ALTER TABLE "forms_blocks_signature_locales" DROP CONSTRAINT IF EXISTS "forms_blocks_signature_locales_parent_id_fk";
    ALTER TABLE "forms_blocks_signature_locales" ADD CONSTRAINT "forms_blocks_signature_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_signature"("id") ON DELETE cascade ON UPDATE no action;
    
    CREATE INDEX IF NOT EXISTS "forms_blocks_signature_order_idx" ON "forms_blocks_signature" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "forms_blocks_signature_parent_id_idx" ON "forms_blocks_signature" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "forms_blocks_signature_path_idx" ON "forms_blocks_signature" USING btree ("_path");
    CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_signature_locales_locale_parent_id_unique" ON "forms_blocks_signature_locales" USING btree ("_locale","_parent_id");
    
    ALTER TABLE "forms" DROP COLUMN IF EXISTS "terms_content";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "forms_blocks_signature" CASCADE;
    DROP TABLE IF EXISTS "forms_blocks_signature_locales" CASCADE;
    DROP TABLE IF EXISTS "forms_dashboard" CASCADE;
    
    ALTER TABLE "forms" ALTER COLUMN "theme" SET DATA TYPE text;
    ALTER TABLE "forms" ALTER COLUMN "theme" SET DEFAULT 'dohaquest'::text;
    
    DROP TYPE IF EXISTS "public"."enum_forms_theme";
    CREATE TYPE "public"."enum_forms_theme" AS ENUM('printemps', 'dohaoasis', 'dohaoasis-new', 'dohaoasis-alt', 'dohaquest', 'banyan-tree-lululemon');
    
    ALTER TABLE "forms" ALTER COLUMN "theme" SET DEFAULT 'dohaquest'::"public"."enum_forms_theme";
    ALTER TABLE "forms" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_forms_theme" USING "theme"::"public"."enum_forms_theme";
    
    ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "terms_content" jsonb;
    ALTER TABLE "forms_locales" DROP COLUMN IF EXISTS "terms_content";`)
}
