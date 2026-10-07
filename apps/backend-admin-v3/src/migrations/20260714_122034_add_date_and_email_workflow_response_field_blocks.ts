import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"default_value" timestamp(3) with time zone,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "workflow_v2_blocks_email" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"required" boolean DEFAULT false,
  	"default_value" varchar,
  	"block_name" varchar
  );

  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_date" ADD CONSTRAINT "workflow_v2_blocks_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "workflow_v2_blocks_email" ADD CONSTRAINT "workflow_v2_blocks_email_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_v2"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_date_order_idx" ON "workflow_v2_blocks_date" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_date_parent_id_idx" ON "workflow_v2_blocks_date" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_date_path_idx" ON "workflow_v2_blocks_date" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_email_order_idx" ON "workflow_v2_blocks_email" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_email_parent_id_idx" ON "workflow_v2_blocks_email" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_v2_blocks_email_path_idx" ON "workflow_v2_blocks_email" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "workflow_v2_blocks_date" CASCADE;
  DROP TABLE IF EXISTS "workflow_v2_blocks_email" CASCADE;`)
}
