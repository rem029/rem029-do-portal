import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "survey_code" varchar;
  CREATE INDEX IF NOT EXISTS "form_submissions_survey_code_idx" ON "form_submissions" USING btree ("survey_code");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "form_submissions_survey_code_idx";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "survey_code";`)
}
