import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_buffet_temperature_items_corrective_action" AS ENUM('none', 'reheated', 'cooled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_buffet_temperature_status" AS ENUM('draft', 'pending-pic-approval', 'pending-hic-verification', 'verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_haccp_dishwashing_temperature_status" AS ENUM('draft', 'pending-pic-approval', 'pending-hic-verification', 'verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

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
      "status" "enum_haccp_buffet_temperature_status" DEFAULT 'draft' NOT NULL,
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
      "status" "enum_haccp_dishwashing_temperature_status" DEFAULT 'draft' NOT NULL,
      "corrective_action" varchar,
      "created_by_id" uuid,
      "updated_by_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
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
    
    ALTER TABLE "haccp_personal_hygiene" ALTER COLUMN "status" SET DATA TYPE text;
    ALTER TABLE "haccp_personal_hygiene" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
    
    DO $$ BEGIN
      DROP TYPE IF EXISTS "public"."enum_haccp_personal_hygiene_status";
      CREATE TYPE "public"."enum_haccp_personal_hygiene_status" AS ENUM('draft', 'pending-hic-verification', 'verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "haccp_personal_hygiene" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_haccp_personal_hygiene_status";
    ALTER TABLE "haccp_personal_hygiene" ALTER COLUMN "status" SET DATA TYPE "public"."enum_haccp_personal_hygiene_status" USING "status"::"public"."enum_haccp_personal_hygiene_status";
    
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DATA TYPE text;
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DEFAULT 'draft'::text;

    DO $$ BEGIN
      DROP TYPE IF EXISTS "public"."enum_haccp_dry_store_status";
      CREATE TYPE "public"."enum_haccp_dry_store_status" AS ENUM('draft', 'pending-pic-approval', 'pending-hic-verification', 'verified');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_haccp_dry_store_status";
    ALTER TABLE "haccp_dry_store" ALTER COLUMN "status" SET DATA TYPE "public"."enum_haccp_dry_store_status" USING "status"::"public"."enum_haccp_dry_store_status";

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_buffet_temperature_id" uuid;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "haccp_dishwashing_temperature_id" uuid;

    -- Constraints and indexes can be applied safely
    ALTER TABLE "haccp_buffet_temperature_items" DROP CONSTRAINT IF EXISTS "haccp_buffet_temperature_items_parent_id_fk";
    ALTER TABLE "haccp_buffet_temperature_items" ADD CONSTRAINT "haccp_buffet_temperature_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_buffet_temperature"("id") ON DELETE cascade ON UPDATE no action;
    
    ALTER TABLE "haccp_settings_outlet_assignments" DROP COLUMN IF EXISTS "pic_email";
    ALTER TABLE "haccp_settings_outlet_assignments" DROP COLUMN IF EXISTS "hic_email";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "haccp_buffet_temperature_items" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_buffet_temperature" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature_daily_entries" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature_weekly_descaling" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_dishwashing_temperature" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_settings_outlet_assignments_staff_emails" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_settings_outlet_assignments_pic_emails" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "haccp_settings_outlet_assignments_hic_emails" DISABLE ROW LEVEL SECURITY;
    
    DROP TABLE IF EXISTS "haccp_buffet_temperature_items" CASCADE;
    DROP TABLE IF EXISTS "haccp_buffet_temperature" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature_daily_entries" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature_weekly_descaling" CASCADE;
    DROP TABLE IF EXISTS "haccp_dishwashing_temperature" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_staff_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_pic_emails" CASCADE;
    DROP TABLE IF EXISTS "haccp_settings_outlet_assignments_hic_emails" CASCADE;
    
    ALTER TABLE "haccp_settings_outlet_assignments" ADD COLUMN IF NOT EXISTS "pic_email" varchar;
    ALTER TABLE "haccp_settings_outlet_assignments" ADD COLUMN IF NOT EXISTS "hic_email" varchar;
  `)
}
