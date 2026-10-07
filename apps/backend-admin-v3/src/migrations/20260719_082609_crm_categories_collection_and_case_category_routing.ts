import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_select_crm_category_variant" AS ENUM('default', 'label-on-top');
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TYPE "public"."enum_workflow_v2_blocks_select_options_related_type" ADD VALUE 'crm_category' BEFORE 'store_department';
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   CREATE TABLE IF NOT EXISTS "crm_categories" (
   	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
   	"title" varchar NOT NULL,
   	"managed_by_department_id" uuid,
   	"created_by_id" uuid,
   	"updated_by_id" uuid,
   	"slug" varchar NOT NULL,
   	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_select_crm_category" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"label" varchar,
   	"required" boolean DEFAULT false,
   	"add_all" boolean DEFAULT false,
   	"block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "forms_blocks_select_crm_category" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"width" numeric,
   	"variant" "enum_forms_blocks_select_crm_category_variant" DEFAULT 'default',
   	"required" boolean DEFAULT false,
   	"add_all" boolean DEFAULT false,
   	"block_name" varchar
   );

   CREATE TABLE IF NOT EXISTS "forms_blocks_select_crm_category_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );

   ALTER TABLE "workflow_v2_blocks_select_options" ADD COLUMN IF NOT EXISTS "related_crm_category_id" uuid;
   ALTER TABLE "workflow_v2_rels" ADD COLUMN IF NOT EXISTS "crm_categories_id" uuid;
   ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "crm_categories_id" uuid;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "crm_categories_id" uuid;

   DO $$ BEGIN
    ALTER TABLE "crm_categories" ADD CONSTRAINT "crm_categories_managed_by_department_id_departments_id_fk" FOREIGN KEY ("managed_by_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "crm_categories" ADD CONSTRAINT "crm_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "crm_categories" ADD CONSTRAINT "crm_categories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_blocks_select_crm_category" ADD CONSTRAINT "workflow_v2_blocks_select_crm_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "forms_blocks_select_crm_category" ADD CONSTRAINT "forms_blocks_select_crm_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "forms_blocks_select_crm_category_locales" ADD CONSTRAINT "forms_blocks_select_crm_category_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select_crm_category"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   CREATE INDEX IF NOT EXISTS "crm_categories_managed_by_department_idx" ON "crm_categories" USING btree ("managed_by_department_id");
   CREATE INDEX IF NOT EXISTS "crm_categories_created_by_idx" ON "crm_categories" USING btree ("created_by_id");
   CREATE INDEX IF NOT EXISTS "crm_categories_updated_by_idx" ON "crm_categories" USING btree ("updated_by_id");
   CREATE UNIQUE INDEX IF NOT EXISTS "crm_categories_slug_idx" ON "crm_categories" USING btree ("slug");
   CREATE INDEX IF NOT EXISTS "crm_categories_updated_at_idx" ON "crm_categories" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "crm_categories_created_at_idx" ON "crm_categories" USING btree ("created_at");
   CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_crm_category_order_idx" ON "workflow_v2_blocks_select_crm_category" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_crm_category_parent_id_idx" ON "workflow_v2_blocks_select_crm_category" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_crm_category_path_idx" ON "workflow_v2_blocks_select_crm_category" USING btree ("_path");
   CREATE INDEX IF NOT EXISTS "forms_blocks_select_crm_category_order_idx" ON "forms_blocks_select_crm_category" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_select_crm_category_parent_id_idx" ON "forms_blocks_select_crm_category" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_select_crm_category_path_idx" ON "forms_blocks_select_crm_category" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_select_crm_category_locales_locale_parent_id_un" ON "forms_blocks_select_crm_category_locales" USING btree ("_locale","_parent_id");

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_blocks_select_options" ADD CONSTRAINT "workflow_v2_blocks_select_options_related_crm_category_id_crm_categories_id_fk" FOREIGN KEY ("related_crm_category_id") REFERENCES "public"."crm_categories"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "workflow_v2_rels" ADD CONSTRAINT "workflow_v2_rels_crm_categories_fk" FOREIGN KEY ("crm_categories_id") REFERENCES "public"."crm_categories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_crm_categories_fk" FOREIGN KEY ("crm_categories_id") REFERENCES "public"."crm_categories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crm_categories_fk" FOREIGN KEY ("crm_categories_id") REFERENCES "public"."crm_categories"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_select_options_related_crm_category_idx" ON "workflow_v2_blocks_select_options" USING btree ("related_crm_category_id");
   CREATE INDEX IF NOT EXISTS "workflow_v2_rels_crm_categories_id_idx" ON "workflow_v2_rels" USING btree ("crm_categories_id");
   CREATE INDEX IF NOT EXISTS "forms_rels_crm_categories_id_idx" ON "forms_rels" USING btree ("crm_categories_id");
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_crm_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("crm_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "crm_categories" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "workflow_v2_blocks_select_crm_category" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "forms_blocks_select_crm_category" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "forms_blocks_select_crm_category_locales" DISABLE ROW LEVEL SECURITY;
   DROP TABLE IF EXISTS "crm_categories" CASCADE;
   DROP TABLE IF EXISTS "workflow_v2_blocks_select_crm_category" CASCADE;
   DROP TABLE IF EXISTS "forms_blocks_select_crm_category" CASCADE;
   DROP TABLE IF EXISTS "forms_blocks_select_crm_category_locales" CASCADE;
   ALTER TABLE "workflow_v2_blocks_select_options" DROP CONSTRAINT IF EXISTS "workflow_v2_blocks_select_options_related_crm_category_id_crm_categories_id_fk";

   ALTER TABLE "workflow_v2_rels" DROP CONSTRAINT IF EXISTS "workflow_v2_rels_crm_categories_fk";

   ALTER TABLE "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_crm_categories_fk";

   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_crm_categories_fk";

   ALTER TABLE "workflow_v2_blocks_select_options" ALTER COLUMN "related_type" SET DATA TYPE text;
   DROP TYPE IF EXISTS "public"."enum_workflow_v2_blocks_select_options_related_type";
   CREATE TYPE "public"."enum_workflow_v2_blocks_select_options_related_type" AS ENUM('store_department', 'department', 'user', 'email');
   ALTER TABLE "workflow_v2_blocks_select_options" ALTER COLUMN "related_type" SET DATA TYPE "public"."enum_workflow_v2_blocks_select_options_related_type" USING "related_type"::"public"."enum_workflow_v2_blocks_select_options_related_type";
   DROP INDEX IF EXISTS "workflow_v2_blocks_select_options_related_crm_category_idx";
   DROP INDEX IF EXISTS "workflow_v2_rels_crm_categories_id_idx";
   DROP INDEX IF EXISTS "forms_rels_crm_categories_id_idx";
   DROP INDEX IF EXISTS "payload_locked_documents_rels_crm_categories_id_idx";
   ALTER TABLE "workflow_v2_blocks_select_options" DROP COLUMN IF EXISTS "related_crm_category_id";
   ALTER TABLE "workflow_v2_rels" DROP COLUMN IF EXISTS "crm_categories_id";
   ALTER TABLE "forms_rels" DROP COLUMN IF EXISTS "crm_categories_id";
   ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "crm_categories_id";
   DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_crm_category_variant";`)
}
