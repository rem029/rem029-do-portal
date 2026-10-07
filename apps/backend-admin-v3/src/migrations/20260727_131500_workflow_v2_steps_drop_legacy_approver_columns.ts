import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The 2026-07-14 migration (workflow_v2_block_based_field_system_and_unified_approvers)
// moved per-step approver fields into the new workflow_v2_steps_approvers child
// table but never dropped the original flat columns on the parent
// workflow_v2_steps table, leaving them as orphaned dead columns. Payload's
// dev-mode schema push correctly flags these as unexpected (the current config
// no longer declares them directly on the step) and offers to drop them with a
// data-loss warning on every `yarn dev` start. `migrate:create` reports "no
// schema changes" for this because its snapshot history already omits these
// columns — only the live DB still has them — so this migration is hand-written
// rather than generated.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_type";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_email";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "department_id";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "document_department_field_path";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "can_attach";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "enable_comment";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "enable_signature";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "attachment_label";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_form_field_path";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_workflow_field_name";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_store_department_field_path";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_custom_field_name";
   ALTER TABLE "workflow_v2_steps" DROP COLUMN IF EXISTS "approver_custom_field_step_slug";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_type" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_email" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "department_id" uuid;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "document_department_field_path" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "can_attach" boolean DEFAULT false;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "enable_comment" boolean DEFAULT true;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "enable_signature" boolean DEFAULT true;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "attachment_label" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_form_field_path" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_workflow_field_name" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_store_department_field_path" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_custom_field_name" varchar;
   ALTER TABLE "workflow_v2_steps" ADD COLUMN IF NOT EXISTS "approver_custom_field_step_slug" varchar;
  `)
}
