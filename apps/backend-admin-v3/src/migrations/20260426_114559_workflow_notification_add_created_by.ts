import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_approval_notifications_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_approval_notifications_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_rejection_notifications_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_rejection_notifications_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_steps_on_reaching_notifications_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_steps_on_approval_notifications_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_steps_on_approval_notifications_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_steps_on_rejection_notifications_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'enum_workflow_steps_approver_type' AND e.enumlabel = 'created_by') THEN
        ALTER TYPE "public"."enum_workflow_steps_approver_type" ADD VALUE 'created_by' BEFORE 'employee';
      END IF;
    END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "workflow_approval_notifications" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE IF EXISTS "workflow_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
    
    ALTER TABLE IF EXISTS "workflow_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE IF EXISTS "workflow_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
    
    ALTER TABLE IF EXISTS "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE IF EXISTS "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
    
    ALTER TABLE IF EXISTS "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE IF EXISTS "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
    
    ALTER TABLE IF EXISTS "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE text;
    ALTER TABLE IF EXISTS "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::text;
    
    ALTER TABLE IF EXISTS "workflow_steps" ALTER COLUMN "approver_type" SET DATA TYPE text;

    DO $$ BEGIN
      DROP TYPE IF EXISTS "public"."enum_workflow_approval_notifications_type";
      DROP TYPE IF EXISTS "public"."enum_workflow_rejection_notifications_type";
      DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_reaching_notifications_type";
      DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_approval_notifications_type";
      DROP TYPE IF EXISTS "public"."enum_workflow_steps_on_rejection_notifications_type";
      DROP TYPE IF EXISTS "public"."enum_workflow_steps_approver_type";
      
      CREATE TYPE "public"."enum_workflow_approval_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      CREATE TYPE "public"."enum_workflow_rejection_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      CREATE TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      CREATE TYPE "public"."enum_workflow_steps_on_approval_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      CREATE TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
      CREATE TYPE "public"."enum_workflow_steps_approver_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
    END $$;

    ALTER TABLE IF EXISTS "workflow_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_approval_notifications_type";
    ALTER TABLE IF EXISTS "workflow_approval_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_approval_notifications_type" USING "type"::"public"."enum_workflow_approval_notifications_type";
    
    ALTER TABLE IF EXISTS "workflow_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_rejection_notifications_type";
    ALTER TABLE IF EXISTS "workflow_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_rejection_notifications_type" USING "type"::"public"."enum_workflow_rejection_notifications_type";
    
    ALTER TABLE IF EXISTS "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_reaching_notifications_type";
    ALTER TABLE IF EXISTS "workflow_steps_on_reaching_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_reaching_notifications_type" USING "type"::"public"."enum_workflow_steps_on_reaching_notifications_type";
    
    ALTER TABLE IF EXISTS "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_approval_notifications_type";
    ALTER TABLE IF EXISTS "workflow_steps_on_approval_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_approval_notifications_type" USING "type"::"public"."enum_workflow_steps_on_approval_notifications_type";
    
    ALTER TABLE IF EXISTS "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DEFAULT 'email'::"public"."enum_workflow_steps_on_rejection_notifications_type";
    ALTER TABLE IF EXISTS "workflow_steps_on_rejection_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_workflow_steps_on_rejection_notifications_type" USING "type"::"public"."enum_workflow_steps_on_rejection_notifications_type";
    
    ALTER TABLE IF EXISTS "workflow_steps" ALTER COLUMN "approver_type" SET DATA TYPE "public"."enum_workflow_steps_approver_type" USING "approver_type"::"public"."enum_workflow_steps_approver_type";
  `)
}
