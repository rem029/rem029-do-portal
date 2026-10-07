import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_haccp_checklists_status" AS ENUM('draft', 'pending-hic-verification', 'pending-pic-approval', 'verified');
    CREATE TABLE IF NOT EXISTS "haccp_outlet_settings_staff_emails" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_outlet_settings_pic_emails" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_outlet_settings_hic_emails" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_outlet_settings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "outlet_id" uuid NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_checklists_monitoring_data" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "checkpoint_name" varchar NOT NULL,
      "temperature_celsius" numeric,
      "is_compliant" boolean DEFAULT true,
      "remarks" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_checklists" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "title" varchar NOT NULL,
      "outlet_id" uuid NOT NULL,
      "status" "enum_haccp_checklists_status" DEFAULT 'draft' NOT NULL,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_staff_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_pic_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_hic_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings" CASCADE;
    
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_outlet_settings_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_checklists_id" uuid;
    
    DO $$ BEGIN
      ALTER TABLE "haccp_outlet_settings_staff_emails" ADD CONSTRAINT "haccp_outlet_settings_staff_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_outlet_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_outlet_settings_pic_emails" ADD CONSTRAINT "haccp_outlet_settings_pic_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_outlet_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_outlet_settings_hic_emails" ADD CONSTRAINT "haccp_outlet_settings_hic_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_outlet_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_outlet_settings" ADD CONSTRAINT "haccp_outlet_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists_monitoring_data" ADD CONSTRAINT "haccp_checklists_monitoring_data_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_checklists"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_staff_emails_order_idx" ON "haccp_outlet_settings_staff_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_staff_emails_parent_id_idx" ON "haccp_outlet_settings_staff_emails" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_pic_emails_order_idx" ON "haccp_outlet_settings_pic_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_pic_emails_parent_id_idx" ON "haccp_outlet_settings_pic_emails" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_hic_emails_order_idx" ON "haccp_outlet_settings_hic_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_hic_emails_parent_id_idx" ON "haccp_outlet_settings_hic_emails" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "haccp_outlet_settings_outlet_idx" ON "haccp_outlet_settings" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_updated_at_idx" ON "haccp_outlet_settings" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_outlet_settings_created_at_idx" ON "haccp_outlet_settings" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_monitoring_data_order_idx" ON "haccp_checklists_monitoring_data" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_monitoring_data_parent_id_idx" ON "haccp_checklists_monitoring_data" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_outlet_idx" ON "haccp_checklists" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_created_by_idx" ON "haccp_checklists" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_updated_by_idx" ON "haccp_checklists" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_updated_at_idx" ON "haccp_checklists" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_created_at_idx" ON "haccp_checklists" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_outlet_settings_fk" FOREIGN KEY ("haccp_outlet_settings_id") REFERENCES "public"."haccp_outlet_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_checklists_fk" FOREIGN KEY ("haccp_checklists_id") REFERENCES "public"."haccp_checklists"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_outlet_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("haccp_outlet_settings_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_checklists_id_idx" ON "payload_locked_documents_rels" USING btree ("haccp_checklists_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "haccp_settings_outlet_assignments_staff_emails" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_settings_outlet_assignments_pic_emails" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_settings_outlet_assignments_hic_emails" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_settings_outlet_assignments" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "outlet_id" uuid NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_settings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "default_hygiene_in_charge_id" uuid,
      "enable_email_alerts" boolean DEFAULT true,
      "escalation_email" varchar,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
    
    DROP TABLE IF EXISTS "haccp_outlet_settings_staff_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_outlet_settings_pic_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_outlet_settings_hic_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_outlet_settings" CASCADE;
    DROP TABLE IF EXISTS "haccp_checklists_monitoring_data" CASCADE;
    DROP TABLE IF EXISTS "haccp_checklists" CASCADE;
    
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_outlet_settings_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_checklists_fk";
    
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_outlet_settings_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_checklists_id_idx";
    
    DO $$ BEGIN
      ALTER TABLE "haccp_settings_outlet_assignments_staff_emails" ADD CONSTRAINT "haccp_settings_outlet_assignments_staff_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_settings_outlet_assignments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings_outlet_assignments_pic_emails" ADD CONSTRAINT "haccp_settings_outlet_assignments_pic_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_settings_outlet_assignments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings_outlet_assignments_hic_emails" ADD CONSTRAINT "haccp_settings_outlet_assignments_hic_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_settings_outlet_assignments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings_outlet_assignments" ADD CONSTRAINT "haccp_settings_outlet_assignments_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings_outlet_assignments" ADD CONSTRAINT "haccp_settings_outlet_assignments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_settings"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_default_hygiene_in_charge_id_users_id_fk" FOREIGN KEY ("default_hygiene_in_charge_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_staff_emails_order_idx" ON "haccp_settings_outlet_assignments_staff_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_staff_emails_parent_id_idx" ON "haccp_settings_outlet_assignments_staff_emails" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_pic_emails_order_idx" ON "haccp_settings_outlet_assignments_pic_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_pic_emails_parent_id_idx" ON "haccp_settings_outlet_assignments_pic_emails" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_hic_emails_order_idx" ON "haccp_settings_outlet_assignments_hic_emails" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_hic_emails_parent_id_idx" ON "haccp_settings_outlet_assignments_hic_emails" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_order_idx" ON "haccp_settings_outlet_assignments" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_parent_id_idx" ON "haccp_settings_outlet_assignments" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_outlet_assignments_outlet_idx" ON "haccp_settings_outlet_assignments" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_default_hygiene_in_charge_idx" ON "haccp_settings" USING btree ("default_hygiene_in_charge_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_created_by_idx" ON "haccp_settings" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_settings_updated_by_idx" ON "haccp_settings" USING btree ("updated_by_id");
    
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "haccp_outlet_settings_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "haccp_checklists_id";
    DROP TYPE IF EXISTS "public"."enum_haccp_checklists_status";
  `)
}
