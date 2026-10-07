import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Safely create enums if they do not exist
    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_buffet_temperature_items_corrective_action" AS ENUM('none', 'reheated', 'cooled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_buffet_temperature_status" AS ENUM('Draft', 'Pending PIC Approval', 'Pending HIC Verification', 'Verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_dishwashing_temperature_status" AS ENUM('Draft', 'Pending PIC Approval', 'Pending HIC Verification', 'Verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Safely add enum value for dry store status if not already present
    DO $$ BEGIN
      ALTER TYPE "public"."enum_haccp_dry_store_status" ADD VALUE 'Pending PIC Approval' BEFORE 'Pending HIC Verification';
    EXCEPTION
      WHEN duplicate_object THEN null;
      WHEN invalid_parameter_value THEN null;
    END $$;

    -- Create tables with IF NOT EXISTS checks
    CREATE TABLE IF NOT EXISTS "haccp_buffet_temperature_items" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "food_item" varchar NOT NULL,
      "pickup_time" varchar NOT NULL,
      "initial_temp" numeric NOT NULL,
      "temp_after2_hrs" numeric,
      "temp_after4_hrs" numeric,
      "corrective_action" "enum_haccp_buffet_temperature_items_corrective_action" DEFAULT 'none',
      "initials" varchar NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_buffet_temperature" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "outlet_id" uuid NOT NULL,
      "date" timestamp(3) with time zone NOT NULL,
      "function_type" varchar NOT NULL,
      "status" "enum_haccp_buffet_temperature_status" DEFAULT 'Draft' NOT NULL,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_dishwashing_temperature_daily_entries" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "day" numeric NOT NULL,
      "breakfast_wash" numeric,
      "breakfast_final_rinse" numeric,
      "breakfast_initials" varchar,
      "lunch_wash" numeric,
      "lunch_final_rinse" numeric,
      "lunch_initials" varchar,
      "dinner_wash" numeric,
      "dinner_final_rinse" numeric,
      "dinner_initials" varchar,
      "supper_wash" numeric,
      "supper_final_rinse" numeric,
      "supper_initials" varchar,
      "cleanliness_wash_arms" varchar,
      "cleanliness_inside_machine" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_dishwashing_temperature_weekly_descaling" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "week_number" numeric,
      "date" varchar,
      "descaling_signature" varchar
    );
    
    CREATE TABLE IF NOT EXISTS "haccp_dishwashing_temperature" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "unit" varchar NOT NULL,
      "outlet_id" uuid NOT NULL,
      "month_year" varchar NOT NULL,
      "status" "enum_haccp_dishwashing_temperature_status" DEFAULT 'Draft' NOT NULL,
      "corrective_action" varchar,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Safely add columns if they don't already exist
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_buffet_temperature_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_dishwashing_temperature_id" uuid;
    
    -- Safely handle staff_email addition only if the table exists
    DO $$ BEGIN
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'haccp_settings_outlet_assignments'
      ) THEN
        ALTER TABLE "haccp_settings_outlet_assignments" ADD COLUMN IF NOT EXISTS "staff_email" varchar;
        UPDATE "haccp_settings_outlet_assignments" SET "staff_email" = '' WHERE "staff_email" IS NULL;
        ALTER TABLE "haccp_settings_outlet_assignments" ALTER COLUMN "staff_email" SET NOT NULL;
      END IF;
    END $$;

    -- Foreign keys with existence checks
    DO $$ BEGIN
      ALTER TABLE "haccp_buffet_temperature_items" ADD CONSTRAINT "haccp_buffet_temperature_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_buffet_temperature"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_buffet_temperature" ADD CONSTRAINT "haccp_buffet_temperature_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_buffet_temperature" ADD CONSTRAINT "haccp_buffet_temperature_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_buffet_temperature" ADD CONSTRAINT "haccp_buffet_temperature_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dishwashing_temperature_daily_entries" ADD CONSTRAINT "haccp_dishwashing_temperature_daily_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_dishwashing_temperature"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dishwashing_temperature_weekly_descaling" ADD CONSTRAINT "haccp_dishwashing_temperature_weekly_descaling_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_dishwashing_temperature"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dishwashing_temperature" ADD CONSTRAINT "haccp_dishwashing_temperature_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dishwashing_temperature" ADD CONSTRAINT "haccp_dishwashing_temperature_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "haccp_dishwashing_temperature" ADD CONSTRAINT "haccp_dishwashing_temperature_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Indexes
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_items_order_idx" ON "haccp_buffet_temperature_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_items_parent_id_idx" ON "haccp_buffet_temperature_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_outlet_idx" ON "haccp_buffet_temperature" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_created_by_idx" ON "haccp_buffet_temperature" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_updated_by_idx" ON "haccp_buffet_temperature" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_updated_at_idx" ON "haccp_buffet_temperature" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_buffet_temperature_created_at_idx" ON "haccp_buffet_temperature" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_daily_entries_order_idx" ON "haccp_dishwashing_temperature_daily_entries" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_daily_entries_parent_id_idx" ON "haccp_dishwashing_temperature_daily_entries" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_weekly_descaling_order_idx" ON "haccp_dishwashing_temperature_weekly_descaling" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_weekly_descaling_parent_id_idx" ON "haccp_dishwashing_temperature_weekly_descaling" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_outlet_idx" ON "haccp_dishwashing_temperature" USING btree ("outlet_id");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_created_by_idx" ON "haccp_dishwashing_temperature" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_updated_by_idx" ON "haccp_dishwashing_temperature" USING btree ("updated_by_id");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_updated_at_idx" ON "haccp_dishwashing_temperature" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "haccp_dishwashing_temperature_created_at_idx" ON "haccp_dishwashing_temperature" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_buffet_temperature_fk" FOREIGN KEY ("haccp_buffet_temperature_id") REFERENCES "public"."haccp_buffet_temperature"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_dishwashing_temperatu_fk" FOREIGN KEY ("haccp_dishwashing_temperature_id") REFERENCES "public"."haccp_dishwashing_temperature"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_buffet_temperature_i_idx" ON "payload_locked_documents_rels" USING btree ("haccp_buffet_temperature_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_haccp_dishwashing_temperat_idx" ON "payload_locked_documents_rels" USING btree ("haccp_dishwashing_temperature_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "haccp_buffet_temperature_items" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_buffet_temperature" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature_daily_entries" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature_weekly_descaling" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature" DISABLE ROW LEVEL SECURITY;
    
    DROP TABLE IF EXISTS "haccp_buffet_temperature_items" CASCADE;
    DROP TABLE IF EXISTS "haccp_buffet_temperature" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature_daily_entries" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature_weekly_descaling" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature" CASCADE;
    
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_buffet_temperature_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_haccp_dishwashing_temperatu_fk";
    
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DATA TYPE text;
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DEFAULT 'Draft'::text;
    DROP TYPE IF EXISTS "public"."enum_haccp_dry_store_status";
    CREATE TYPE "public"."enum_haccp_dry_store_status" AS ENUM('Draft', 'Pending HIC Verification', 'Verified');
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DEFAULT 'Draft'::"public"."enum_haccp_dry_store_status";
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DATA TYPE "public"."enum_haccp_dry_store_status" USING "status"::"public"."enum_haccp_dry_store_status";
    
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_buffet_temperature_i_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_haccp_dishwashing_temperat_idx";
    
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "haccp_buffet_temperature_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "haccp_dishwashing_temperature_id";
    
    DO $$ BEGIN
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'haccp_settings_outlet_assignments'
      ) THEN
        ALTER TABLE "haccp_settings_outlet_assignments" DROP COLUMN IF EXISTS "staff_email";
      END IF;
    END $$;
    
    DROP TYPE IF EXISTS "public"."enum_haccp_buffet_temperature_items_corrective_action";
    DROP TYPE IF EXISTS "public"."enum_haccp_buffet_temperature_status";
    DROP TYPE IF EXISTS "public"."enum_haccp_dishwashing_temperature_status";
  `)
}