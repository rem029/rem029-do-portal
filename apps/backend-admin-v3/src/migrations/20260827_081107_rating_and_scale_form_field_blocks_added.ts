import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_rating_variant" AS ENUM('default', 'label-on-top');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_rating_display" AS ENUM('stars', 'buttons');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    CREATE TYPE "public"."enum_forms_blocks_scale_variant" AS ENUM('default', 'label-on-top');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

  CREATE TABLE IF NOT EXISTS "forms_blocks_rating_labels" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_rating_labels_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_rating" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"variant" "enum_forms_blocks_rating_variant" DEFAULT 'default',
  	"required" boolean DEFAULT false,
  	"point_count" numeric DEFAULT 5,
  	"display" "enum_forms_blocks_rating_display" DEFAULT 'stars',
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_rating_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_scale" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"variant" "enum_forms_blocks_scale_variant" DEFAULT 'default',
  	"required" boolean DEFAULT false,
  	"min" numeric DEFAULT 0,
  	"max" numeric DEFAULT 10,
  	"step" numeric DEFAULT 1,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_scale_locales" (
  	"label" varchar,
  	"min_label" varchar,
  	"max_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  DO $$ BEGIN
   ALTER TABLE "forms_blocks_rating_labels" ADD CONSTRAINT "forms_blocks_rating_labels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_rating"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_rating_labels_locales" ADD CONSTRAINT "forms_blocks_rating_labels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_rating_labels"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_rating" ADD CONSTRAINT "forms_blocks_rating_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_rating_locales" ADD CONSTRAINT "forms_blocks_rating_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_rating"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_scale" ADD CONSTRAINT "forms_blocks_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "forms_blocks_scale_locales" ADD CONSTRAINT "forms_blocks_scale_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_scale"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "forms_blocks_rating_labels_order_idx" ON "forms_blocks_rating_labels" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_rating_labels_parent_id_idx" ON "forms_blocks_rating_labels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_rating_labels_locales_locale_parent_id_unique" ON "forms_blocks_rating_labels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_rating_order_idx" ON "forms_blocks_rating" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_rating_parent_id_idx" ON "forms_blocks_rating" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_rating_path_idx" ON "forms_blocks_rating" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_rating_locales_locale_parent_id_unique" ON "forms_blocks_rating_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_scale_order_idx" ON "forms_blocks_scale" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_scale_parent_id_idx" ON "forms_blocks_scale" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_scale_path_idx" ON "forms_blocks_scale" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_scale_locales_locale_parent_id_unique" ON "forms_blocks_scale_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "forms_blocks_rating_labels" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_rating_labels_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_rating" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_rating_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_scale" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_scale_locales" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_rating_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_rating_display";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_scale_variant";`)
}
