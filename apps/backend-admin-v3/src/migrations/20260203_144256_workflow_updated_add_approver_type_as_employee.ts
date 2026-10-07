import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_workflow_steps_approver_type" ADD VALUE 'employee';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workflow_steps" ALTER COLUMN "approver_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_workflow_steps_approver_type";
  CREATE TYPE "public"."enum_workflow_steps_approver_type" AS ENUM('email', 'department', 'requestor_department');
  ALTER TABLE "workflow_steps" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_steps_approver_type" USING "approver_type"::"public"."enum_workflow_steps_approver_type";`)
}
