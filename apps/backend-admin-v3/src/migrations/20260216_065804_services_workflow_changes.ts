import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_requests_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "hr_requests_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "bsn_just_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "bsn_just_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "offer_letter_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "offer_letter_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "end_of_service_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "end_of_service_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "recruitment_note_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "recruitment_note_workflow_reviews" ADD COLUMN "reject_token" varchar;
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" ADD COLUMN "approve_token" varchar;
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" ADD COLUMN "reject_token" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_requests_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "hr_requests_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_hr_requests_v_version_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "bsn_just_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "bsn_just_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_bsn_just_v_version_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "offer_letter_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "offer_letter_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_offer_letter_v_version_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "end_of_service_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "end_of_service_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_end_of_service_v_version_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "recruitment_note_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "recruitment_note_workflow_reviews" DROP COLUMN "reject_token";
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" DROP COLUMN "approve_token";
  ALTER TABLE "_recruitment_note_v_version_workflow_reviews" DROP COLUMN "reject_token";`)
}
