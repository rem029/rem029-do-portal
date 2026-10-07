import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_payload_docusign_environment" AS ENUM('sandbox', 'production');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE TABLE IF NOT EXISTS "payload_docusign" (
   	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
   	"created_by_id" uuid,
   	"updated_by_id" uuid,
   	"environment" "enum_payload_docusign_environment" DEFAULT 'sandbox' NOT NULL,
   	"return_url" varchar,
   	"consent_redirect_url" varchar,
   	"status_reader_user_id" varchar,
   	"updated_at" timestamp(3) with time zone,
   	"created_at" timestamp(3) with time zone
   );
   
   DO $$ BEGIN
    ALTER TABLE "payload_docusign" ADD CONSTRAINT "payload_docusign_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   DO $$ BEGIN
    ALTER TABLE "payload_docusign" ADD CONSTRAINT "payload_docusign_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE INDEX IF NOT EXISTS "payload_docusign_created_by_idx" ON "payload_docusign" USING btree ("created_by_id");
   CREATE INDEX IF NOT EXISTS "payload_docusign_updated_by_idx" ON "payload_docusign" USING btree ("updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload_docusign" CASCADE;
   DROP TYPE IF EXISTS "public"."enum_payload_docusign_environment";`)
}
