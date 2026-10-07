import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const enums = [
    { type: 'enum_sal_ded_workflow_reviews_response', value: 'skipped' },
    { type: 'enum_sal_ded_workflow_reviews_response', value: 'auto_completed' },
    { type: 'enum_sal_ded_workflow_reviews_response', value: 'acknowledged' },
    { type: 'enum__sal_ded_v_version_workflow_reviews_response', value: 'skipped' },
    { type: 'enum__sal_ded_v_version_workflow_reviews_response', value: 'auto_completed' },
    { type: 'enum__sal_ded_v_version_workflow_reviews_response', value: 'acknowledged' },
    { type: 'enum_warnings_workflow_reviews_response', value: 'skipped' },
    { type: 'enum_warnings_workflow_reviews_response', value: 'auto_completed' },
    { type: 'enum_warnings_workflow_reviews_response', value: 'acknowledged' },
    { type: 'enum__warnings_v_version_workflow_reviews_response', value: 'skipped' },
    { type: 'enum__warnings_v_version_workflow_reviews_response', value: 'auto_completed' },
    { type: 'enum__warnings_v_version_workflow_reviews_response', value: 'acknowledged' },
  ]

  for (const enumInfo of enums) {
    try {
      await db.execute(
        sql.raw(`ALTER TYPE "public"."${enumInfo.type}" ADD VALUE '${enumInfo.value}';`),
      )
    } catch (e) {
      // Ignore errors (likely duplicate value)
    }
  }

  await db.execute(sql`
   ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;
  ALTER TABLE "workflow_steps_additional_emails" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "can_skip" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "skip_label" varchar DEFAULT 'Skip';
  ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "notify_on_complete" boolean DEFAULT true;
  ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "notify_on_update" boolean DEFAULT true;
  ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "notify_on_reject" boolean DEFAULT true;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "warnings_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "auto_complete" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_history" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_details" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_description" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_attachments" boolean DEFAULT false;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "custom_email_text" varchar;
  ALTER TABLE "_warnings_v_version_workflow_reviews" ADD COLUMN IF NOT EXISTS "hide_email_actions" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_sal_ded_workflow_reviews_response";
  CREATE TYPE "public"."enum_sal_ded_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "sal_ded_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE "public"."enum_sal_ded_workflow_reviews_response" USING "response"::"public"."enum_sal_ded_workflow_reviews_response";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__sal_ded_v_version_workflow_reviews_response";
  CREATE TYPE "public"."enum__sal_ded_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE "public"."enum__sal_ded_v_version_workflow_reviews_response" USING "response"::"public"."enum__sal_ded_v_version_workflow_reviews_response";
  ALTER TABLE "warnings_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_warnings_workflow_reviews_response";
  CREATE TYPE "public"."enum_warnings_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "warnings_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE "public"."enum_warnings_workflow_reviews_response" USING "response"::"public"."enum_warnings_workflow_reviews_response";
  ALTER TABLE "_warnings_v_version_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__warnings_v_version_workflow_reviews_response";
  CREATE TYPE "public"."enum__warnings_v_version_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "_warnings_v_version_workflow_reviews" ALTER COLUMN "response" SET DATA TYPE "public"."enum__warnings_v_version_workflow_reviews_response" USING "response"::"public"."enum__warnings_v_version_workflow_reviews_response";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "hide_email_actions";
  ALTER TABLE "workflow_steps_additional_emails" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "hide_email_actions";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "can_skip";
  ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "skip_label";
  ALTER TABLE "workflow" DROP COLUMN IF EXISTS "notify_on_complete";
  ALTER TABLE "workflow" DROP COLUMN IF EXISTS "notify_on_update";
  ALTER TABLE "workflow" DROP COLUMN IF EXISTS "notify_on_reject";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN IF EXISTS "hide_email_actions";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_email_actions";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "warnings_workflow_reviews" DROP COLUMN IF EXISTS "hide_email_actions";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "auto_complete";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_history";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_details";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_description";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_attachments";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "custom_email_text";
  ALTER TABLE "_warnings_v_version_workflow_reviews" DROP COLUMN IF EXISTS "hide_email_actions";`)
}
