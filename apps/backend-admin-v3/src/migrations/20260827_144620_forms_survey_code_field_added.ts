import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "survey_code" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_survey_code_idx" ON "forms" USING btree ("survey_code");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "forms_survey_code_idx";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "survey_code";`)
}
