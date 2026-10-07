import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "haccp_checklists_monitoring_data" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "haccp_checklists" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "haccp_checklists_monitoring_data" CASCADE;
    DROP TABLE IF EXISTS "haccp_checklists" CASCADE;
    
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" 
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_checklists_fk";
    
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_checklists_id_idx";
    
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" 
      DROP COLUMN IF EXISTS "haccp_checklists_id";
      
    DROP TYPE IF EXISTS "public"."enum_haccp_checklists_status";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_checklists_status" AS ENUM('draft', 'pending-hic-verification', 'pending-pic-approval', 'verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

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
    
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT === "haccp_checklists_id" uuid;
    
    DO $$ BEGIN
      ALTER TABLE "haccp_checklists_monitoring_data" ADD CONSTRAINT "haccp_checklists_monitoring_data_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_checklists"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "haccp_checklists_monitoring_data_order_idx" ON "haccp_checklists_monitoring_data" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_monitoring_data_parent_id_idx" ON "haccp_checklists_monitoring_data" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_outlet_idx" ON "haccp_checklists" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_created_by_idx" ON "haccp_checklists" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_updated_by_idx" ON "haccp_checklists" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_updated_at_idx" ON "haccp_checklists" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_checklists_created_at_idx" ON "haccp_checklists" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_checklists_fk" FOREIGN KEY ("haccp_checklists_id") REFERENCES "public"."haccp_checklists"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_checklists_id_idx" ON "payload_locked_documents_rels" USING btree ("haccp_checklists_id");
  `)
}
