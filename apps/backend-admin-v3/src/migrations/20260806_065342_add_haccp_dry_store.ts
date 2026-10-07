import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_dry_store_status" AS ENUM('Draft', 'Pending HIC Verification', 'Verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "haccp_dry_store_daily_entries" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "day" numeric NOT NULL,
      "temp_am" numeric,
      "humidity_am" numeric,
      "temp_pm" numeric,
      "humidity_pm" numeric,
      "corrective_action" varchar,
      "initials" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_dry_store" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "outlet_id" uuid NOT NULL,
      "month_year" varchar NOT NULL,
      "status" "enum_haccp_dry_store_status" DEFAULT 'Draft' NOT NULL,
      "checked_by_id" uuid,
      "verified_by_id" uuid,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_dry_store_id" uuid;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store_daily_entries" ADD CONSTRAINT "haccp_dry_store_daily_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_dry_store"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store" ADD CONSTRAINT "haccp_dry_store_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store" ADD CONSTRAINT "haccp_dry_store_checked_by_id_users_id_fk" FOREIGN KEY ("checked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store" ADD CONSTRAINT "haccp_dry_store_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store" ADD CONSTRAINT "haccp_dry_store_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dry_store" ADD CONSTRAINT "haccp_dry_store_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "haccp_dry_store_daily_entries_order_idx" ON "haccp_dry_store_daily_entries" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_daily_entries_parent_id_idx" ON "haccp_dry_store_daily_entries" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_outlet_idx" ON "haccp_dry_store" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_checked_by_idx" ON "haccp_dry_store" USING btree ("checked_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_verified_by_idx" ON "haccp_dry_store" USING btree ("verified_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_created_by_idx" ON "haccp_dry_store" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_updated_by_idx" ON "haccp_dry_store" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_updated_at_idx" ON "haccp_dry_store" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_dry_store_created_at_idx" ON "haccp_dry_store" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_dry_store_fk" FOREIGN KEY ("haccp_dry_store_id") REFERENCES "public"."haccp_dry_store"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_dry_store_id_idx" ON "payload_locked_documents_rels" USING btree ("haccp_dry_store_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "haccp_dry_store_daily_entries" CASCADE;
    DROP TABLE IF EXISTS "haccp_dry_store" CASCADE;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_dry_store_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_dry_store_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "haccp_dry_store_id";
    DROP TYPE IF EXISTS "public"."enum_haccp_dry_store_status";
  `)
}