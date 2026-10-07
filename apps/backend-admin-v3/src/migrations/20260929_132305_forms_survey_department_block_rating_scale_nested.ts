import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The generator diffed against a stale snapshot and re-emitted rating/scale/survey tables that
// earlier migrations already create. Only the survey-department block and its forms_rels column
// are new; nested rating/scale reuse forms_blocks_rating/scale through `_path`.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_survey_department_variant" AS ENUM('default', 'label-on-top');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE TABLE IF NOT EXISTS "forms_blocks_survey_department" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'department' NOT NULL,
  	"width" numeric,
  	"variant" "enum_forms_blocks_survey_department_variant" DEFAULT 'default',
  	"required" boolean DEFAULT false,
  	"add_all" boolean DEFAULT false,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_survey_department_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "forms_rels" ADD COLUMN IF NOT EXISTS "departments_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_survey_department" ADD CONSTRAINT "forms_blocks_survey_department_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_survey_department_locales" ADD CONSTRAINT "forms_blocks_survey_department_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_survey_department"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "forms_blocks_survey_department_order_idx" ON "forms_blocks_survey_department" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_survey_department_parent_id_idx" ON "forms_blocks_survey_department" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_survey_department_path_idx" ON "forms_blocks_survey_department" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_survey_department_locales_locale_parent_id_uniq" ON "forms_blocks_survey_department_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_rels_departments_id_idx" ON "forms_rels" USING btree ("departments_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms_rels" DROP CONSTRAINT IF EXISTS "forms_rels_departments_fk";
  DROP INDEX IF EXISTS "forms_rels_departments_id_idx";
  ALTER TABLE "forms_rels" DROP COLUMN IF EXISTS "departments_id";
  DROP TABLE IF EXISTS "forms_blocks_survey_department_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_survey_department" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_survey_department_variant";`)
}
