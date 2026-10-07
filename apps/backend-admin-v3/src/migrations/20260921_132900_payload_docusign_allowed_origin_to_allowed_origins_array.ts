import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload_docusign_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  DO $$ BEGIN
    ALTER TABLE "payload_docusign_texts" ADD CONSTRAINT "payload_docusign_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_docusign"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_docusign_texts_order_parent" ON "payload_docusign_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_docusign" DROP COLUMN IF EXISTS "allowed_origin";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload_docusign_texts" CASCADE;
  ALTER TABLE "payload_docusign" ADD COLUMN IF NOT EXISTS "allowed_origin" varchar DEFAULT 'https://dohaoasis0.sharepoint.com';`)
}
