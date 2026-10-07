import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "enable_comment" boolean DEFAULT true;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "enable_signature" boolean DEFAULT true;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "attachment_label" varchar;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "form_submissions_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "enable_comment";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "enable_signature";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "attachment_label";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "form_submissions_workflow_reviews" DROP COLUMN IF EXISTS "hide_email_actions";`)
}
