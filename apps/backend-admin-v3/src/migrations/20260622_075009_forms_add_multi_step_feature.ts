import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "forms_blocks_multi_step_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_multi_step_steps_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "forms_blocks_multi_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  DO $$ BEGIN
    ALTER TABLE "forms_blocks_multi_step_steps" ADD CONSTRAINT "forms_blocks_multi_step_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_multi_step"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_multi_step_steps_locales" ADD CONSTRAINT "forms_blocks_multi_step_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_multi_step_steps"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "forms_blocks_multi_step" ADD CONSTRAINT "forms_blocks_multi_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "forms_blocks_multi_step_steps_order_idx" ON "forms_blocks_multi_step_steps" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_multi_step_steps_parent_id_idx" ON "forms_blocks_multi_step_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_multi_step_steps_locales_locale_parent_id_uniqu" ON "forms_blocks_multi_step_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_multi_step_order_idx" ON "forms_blocks_multi_step" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_multi_step_parent_id_idx" ON "forms_blocks_multi_step" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_multi_step_path_idx" ON "forms_blocks_multi_step" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "forms_blocks_multi_step_steps" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_multi_step_steps_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_multi_step" CASCADE;`)
}

