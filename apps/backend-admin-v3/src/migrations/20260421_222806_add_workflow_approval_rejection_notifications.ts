import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_approval_notifications_type') THEN
      CREATE TYPE "public"."enum_workflow_approval_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_rejection_notifications_type') THEN
      CREATE TYPE "public"."enum_workflow_rejection_notifications_type" AS ENUM('email', 'department', 'requestor_department', 'employee');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "workflow_approval_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_approval_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_rejection_notifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_workflow_rejection_notifications_type" DEFAULT 'email',
  	"email" varchar,
  	"department_id" uuid,
  	"hide_history" boolean DEFAULT false,
  	"hide_details" boolean DEFAULT false,
  	"hide_description" boolean DEFAULT false,
  	"hide_attachments" boolean DEFAULT false,
  	"hide_email_actions" boolean DEFAULT false,
  	"custom_email_text" varchar
  );
  
  ALTER TABLE "workflow_approval_notifications" DROP CONSTRAINT IF EXISTS "workflow_approval_notifications_department_id_departments_id_fk";
  ALTER TABLE "workflow_approval_notifications" ADD CONSTRAINT "workflow_approval_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  
  ALTER TABLE "workflow_approval_notifications" DROP CONSTRAINT IF EXISTS "workflow_approval_notifications_parent_id_fk";
  ALTER TABLE "workflow_approval_notifications" ADD CONSTRAINT "workflow_approval_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
  
  ALTER TABLE "workflow_rejection_notifications" DROP CONSTRAINT IF EXISTS "workflow_rejection_notifications_department_id_departments_id_fk";
  ALTER TABLE "workflow_rejection_notifications" ADD CONSTRAINT "workflow_rejection_notifications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  
  ALTER TABLE "workflow_rejection_notifications" DROP CONSTRAINT IF EXISTS "workflow_rejection_notifications_parent_id_fk";
  ALTER TABLE "workflow_rejection_notifications" ADD CONSTRAINT "workflow_rejection_notifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
  
  CREATE INDEX IF NOT EXISTS "workflow_approval_notifications_order_idx" ON "workflow_approval_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_approval_notifications_parent_id_idx" ON "workflow_approval_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_approval_notifications_department_idx" ON "workflow_approval_notifications" USING btree ("department_id");
  CREATE INDEX IF NOT EXISTS "workflow_rejection_notifications_order_idx" ON "workflow_rejection_notifications" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_rejection_notifications_parent_id_idx" ON "workflow_rejection_notifications" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_rejection_notifications_department_idx" ON "workflow_rejection_notifications" USING btree ("department_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "workflow_approval_notifications" CASCADE;
  DROP TABLE IF EXISTS "workflow_rejection_notifications" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_workflow_approval_notifications_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_rejection_notifications_type";`)
}
