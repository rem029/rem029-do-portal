import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_docusign" ADD COLUMN IF NOT EXISTS "integration_key" varchar;
  ALTER TABLE "payload_docusign" ADD COLUMN IF NOT EXISTS "account_id" varchar;
  ALTER TABLE "payload_docusign" ADD COLUMN IF NOT EXISTS "private_key" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_docusign" DROP COLUMN IF EXISTS "integration_key";
  ALTER TABLE "payload_docusign" DROP COLUMN IF EXISTS "account_id";
  ALTER TABLE "payload_docusign" DROP COLUMN IF EXISTS "private_key";`)
}
