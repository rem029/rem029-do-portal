import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "forms_form_statuses" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"is_default" boolean DEFAULT false
  );
  
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "enable_form_status" boolean DEFAULT false;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "form_status" varchar;
  
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_form_statuses_parent_id_fk') THEN
      ALTER TABLE "forms_form_statuses" ADD CONSTRAINT "forms_form_statuses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "forms_form_statuses_order_idx" ON "forms_form_statuses" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_form_statuses_parent_id_idx" ON "forms_form_statuses" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "forms_form_statuses" CASCADE;
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "enable_form_status";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "form_status";`)
}
