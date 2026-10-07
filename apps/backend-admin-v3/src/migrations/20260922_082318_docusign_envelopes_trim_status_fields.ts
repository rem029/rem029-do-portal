import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "docusign_envelopes_recipients" DROP COLUMN IF EXISTS "status";
  ALTER TABLE "docusign_envelopes" DROP COLUMN IF EXISTS "status";
  ALTER TABLE "docusign_envelopes" DROP COLUMN IF EXISTS "status_changed_at";
  DROP TYPE IF EXISTS "public"."enum_docusign_envelopes_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_docusign_envelopes_status" AS ENUM('created', 'sent', 'delivered', 'completed', 'declined', 'voided');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "docusign_envelopes_recipients" ADD COLUMN IF NOT EXISTS "status" varchar;
  ALTER TABLE "docusign_envelopes" ADD COLUMN IF NOT EXISTS "status" "enum_docusign_envelopes_status" DEFAULT 'created';
  ALTER TABLE "docusign_envelopes" ADD COLUMN IF NOT EXISTS "status_changed_at" timestamp(3) with time zone;`)
}
