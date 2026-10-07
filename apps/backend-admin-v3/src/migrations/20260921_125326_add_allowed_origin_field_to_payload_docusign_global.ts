import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_docusign" ADD COLUMN IF NOT EXISTS "allowed_origin" varchar DEFAULT 'https://dohaoasis0.sharepoint.com';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_docusign" DROP COLUMN IF EXISTS "allowed_origin";`)
}
