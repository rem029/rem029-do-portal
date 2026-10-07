import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "survey_invitations" ADD COLUMN IF NOT EXISTS "department_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "survey_invitations_department_idx" ON "survey_invitations" USING btree ("department_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "survey_invitations" DROP CONSTRAINT IF EXISTS "survey_invitations_department_id_departments_id_fk";
  DROP INDEX IF EXISTS "survey_invitations_department_idx";
  ALTER TABLE "survey_invitations" DROP COLUMN IF EXISTS "department_id";`)
}
