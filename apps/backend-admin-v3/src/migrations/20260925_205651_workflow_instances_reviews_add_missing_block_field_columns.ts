import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 20260714_071156 only declared these columns inside `CREATE TABLE IF NOT EXISTS`, which is
// skipped when workflow_instances_reviews already exists from 20260624_113908 — so incrementally
// migrated DBs never got them and the workflow-instances list/find queries fail.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "before_response_fields" jsonb;
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "after_response_approved_fields" jsonb;
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "after_response_rejected_fields" jsonb;
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "after_response_acknowledged_fields" jsonb;
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "field_responses" jsonb;
    ALTER TABLE "workflow_instances_reviews" ADD COLUMN IF NOT EXISTS "reviewer_tokens" jsonb;
  `)
}

// No-op: these columns are owned by 20260714_071156; dropping them here would break DBs
// where that migration created them.
export async function down(_args: MigrateDownArgs): Promise<void> {}
