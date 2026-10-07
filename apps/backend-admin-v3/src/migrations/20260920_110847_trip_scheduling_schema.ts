import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Trip-scheduling schema: the single, squashed creator of the whole subsystem.
 *
 * Replaces five earlier migrations (20260127_125231, 20260127_125349, 20260712_135306, 20260813_121351,
 * 20260915_091116) that were deleted before ever reaching dev or production. Besides the trip_scheduling_*
 * tables it creates the payload_locked_documents_rels columns they need.
 *
 * Idempotent per CLAUDE.md (IF NOT EXISTS, DO $$ ... EXCEPTION WHEN duplicate_object): re-running it, or
 * running it against a database that already has these objects, is a no-op.
 *
 * down() removes what up() creates.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_adhoc_status" AS ENUM('pending', 'approved', 'declined', 'completed', 'expired');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_bookings_status" AS ENUM('pending', 'approved', 'declined', 'completed', 'expired');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_shuttles_direction" AS ENUM('to-office', 'from-office');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_staff_voice_category" AS ENUM('suggestion', 'concern', 'compliment', 'inquiry');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_staff_voice_status" AS ENUM('pending', 'under-review', 'closed');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_vehicles_category" AS ENUM('bus', 'cargo', 'freezer', 'limousine', 'passenger', 'employee-transport', 'truck', 'other');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_vehicles_capacity_unit" AS ENUM('people', 'tons', 'kg', 'liters', 'other');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE TABLE IF NOT EXISTS "trip_scheduling_adhoc" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"passengers" numeric NOT NULL,
  	"operator_id" uuid NOT NULL,
  	"vehicle_needed_id" uuid,
  	"travel_date" timestamp(3) with time zone NOT NULL,
  	"pickup_time" varchar NOT NULL,
  	"dropoff_time" varchar,
  	"origin" varchar NOT NULL,
  	"destination" varchar NOT NULL,
  	"reason" varchar NOT NULL,
  	"adhoc_id" varchar,
  	"slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"status" "enum_trip_scheduling_adhoc_status" DEFAULT 'pending',
  	"approver_notes" varchar,
  	"driver_id" uuid,
  	"driver_phone" varchar,
  	"decline_reason" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"approval_token" varchar,
  	"token_expiration" timestamp(3) with time zone,
  	"driver_token" varchar,
  	"driver_token_expiration" timestamp(3) with time zone,
  	"is_trip_settled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_bookings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"operator_id" uuid NOT NULL,
  	"trip_category_id" uuid NOT NULL,
  	"passengers" numeric NOT NULL,
  	"vehicle_needed_id" uuid NOT NULL,
  	"pickup_location" varchar NOT NULL,
  	"destination" varchar NOT NULL,
  	"zones_id" uuid NOT NULL,
  	"travel_date" timestamp(3) with time zone NOT NULL,
  	"travel_time" varchar NOT NULL,
  	"reason" varchar NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"status" "enum_trip_scheduling_bookings_status" DEFAULT 'pending',
  	"approver_notes" varchar,
  	"driver_id" uuid,
  	"driver_phone" varchar,
  	"decline_reason" varchar,
  	"booking_id" varchar,
  	"driver_name" varchar,
  	"slug" varchar,
  	"trip_start_timestamp" timestamp(3) with time zone,
  	"trip_end_timestamp" timestamp(3) with time zone,
  	"approval_token" varchar,
  	"token_expiration" timestamp(3) with time zone,
  	"driver_token" varchar,
  	"driver_token_expiration" timestamp(3) with time zone,
  	"is_trip_settled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_drivers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"route" varchar,
  	"phone" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_locations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"route_id" uuid NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_routes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_shuttles" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"route_id" uuid NOT NULL,
  	"location_id" uuid,
  	"vehicle_id" uuid NOT NULL,
  	"driver_id" uuid,
  	"driver_phone" varchar,
  	"direction" "enum_trip_scheduling_shuttles_direction" DEFAULT 'to-office' NOT NULL,
  	"departure_time" varchar,
  	"arrival_time" varchar,
  	"pickup_manager" numeric,
  	"pickup_male" numeric,
  	"pickup_female" numeric,
  	"pickup_general" numeric,
  	"public_note" varchar,
  	"admin_title" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_staff_voice" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"category" "enum_trip_scheduling_staff_voice_category" DEFAULT 'suggestion' NOT NULL,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"resolution_notes" varchar,
  	"status" "enum_trip_scheduling_staff_voice_status" DEFAULT 'pending' NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_vehicles" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"category" "enum_trip_scheduling_vehicles_category" DEFAULT 'passenger' NOT NULL,
  	"capacity_value" numeric,
  	"capacity_unit" "enum_trip_scheduling_vehicles_capacity_unit" DEFAULT 'people',
  	"is_active" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_zones" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"index_number" numeric,
  	"zone_number" varchar,
  	"district" varchar,
  	"trip_cost" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_settings_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_settings_allowed_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_settings_history_access_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "trip_scheduling_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_by_id" uuid,
  	"updated_by_id" uuid
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_adhoc_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_bookings_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_categories_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_drivers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_locations_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_routes_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_shuttles_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_staff_voice_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_vehicles_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_zones_id" uuid;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_adhoc" ADD CONSTRAINT "trip_scheduling_adhoc_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_adhoc" ADD CONSTRAINT "trip_scheduling_adhoc_vehicle_needed_id_trip_scheduling_vehicles_id_fk" FOREIGN KEY ("vehicle_needed_id") REFERENCES "public"."trip_scheduling_vehicles"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_adhoc" ADD CONSTRAINT "trip_scheduling_adhoc_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_adhoc" ADD CONSTRAINT "trip_scheduling_adhoc_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_adhoc" ADD CONSTRAINT "trip_scheduling_adhoc_driver_id_trip_scheduling_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."trip_scheduling_drivers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_trip_category_id_trip_scheduling_categories_id_fk" FOREIGN KEY ("trip_category_id") REFERENCES "public"."trip_scheduling_categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_vehicle_needed_id_trip_scheduling_vehicles_id_fk" FOREIGN KEY ("vehicle_needed_id") REFERENCES "public"."trip_scheduling_vehicles"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_zones_id_trip_scheduling_zones_id_fk" FOREIGN KEY ("zones_id") REFERENCES "public"."trip_scheduling_zones"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_bookings" ADD CONSTRAINT "trip_scheduling_bookings_driver_id_trip_scheduling_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."trip_scheduling_drivers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_categories" ADD CONSTRAINT "trip_scheduling_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_categories" ADD CONSTRAINT "trip_scheduling_categories_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_drivers" ADD CONSTRAINT "trip_scheduling_drivers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_drivers" ADD CONSTRAINT "trip_scheduling_drivers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_locations" ADD CONSTRAINT "trip_scheduling_locations_route_id_trip_scheduling_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_scheduling_routes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_locations" ADD CONSTRAINT "trip_scheduling_locations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_locations" ADD CONSTRAINT "trip_scheduling_locations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_routes" ADD CONSTRAINT "trip_scheduling_routes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_routes" ADD CONSTRAINT "trip_scheduling_routes_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_route_id_trip_scheduling_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_scheduling_routes"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_location_id_trip_scheduling_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."trip_scheduling_locations"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_vehicle_id_trip_scheduling_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."trip_scheduling_vehicles"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_driver_id_trip_scheduling_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."trip_scheduling_drivers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_shuttles" ADD CONSTRAINT "trip_scheduling_shuttles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_staff_voice" ADD CONSTRAINT "trip_scheduling_staff_voice_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_staff_voice" ADD CONSTRAINT "trip_scheduling_staff_voice_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_vehicles" ADD CONSTRAINT "trip_scheduling_vehicles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_vehicles" ADD CONSTRAINT "trip_scheduling_vehicles_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_zones" ADD CONSTRAINT "trip_scheduling_zones_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_zones" ADD CONSTRAINT "trip_scheduling_zones_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_settings_notification_emails" ADD CONSTRAINT "trip_scheduling_settings_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_scheduling_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_settings_allowed_domains" ADD CONSTRAINT "trip_scheduling_settings_allowed_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_scheduling_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_settings_history_access_emails" ADD CONSTRAINT "trip_scheduling_settings_history_access_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_scheduling_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_settings" ADD CONSTRAINT "trip_scheduling_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "trip_scheduling_settings" ADD CONSTRAINT "trip_scheduling_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_operator_idx" ON "trip_scheduling_adhoc" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_vehicle_needed_idx" ON "trip_scheduling_adhoc" USING btree ("vehicle_needed_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_created_by_idx" ON "trip_scheduling_adhoc" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_updated_by_idx" ON "trip_scheduling_adhoc" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_driver_idx" ON "trip_scheduling_adhoc" USING btree ("driver_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_updated_at_idx" ON "trip_scheduling_adhoc" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_adhoc_created_at_idx" ON "trip_scheduling_adhoc" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_operator_idx" ON "trip_scheduling_bookings" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_trip_category_idx" ON "trip_scheduling_bookings" USING btree ("trip_category_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_vehicle_needed_idx" ON "trip_scheduling_bookings" USING btree ("vehicle_needed_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_zones_idx" ON "trip_scheduling_bookings" USING btree ("zones_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_created_by_idx" ON "trip_scheduling_bookings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_updated_by_idx" ON "trip_scheduling_bookings" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_driver_idx" ON "trip_scheduling_bookings" USING btree ("driver_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_updated_at_idx" ON "trip_scheduling_bookings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_bookings_created_at_idx" ON "trip_scheduling_bookings" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_categories_name_idx" ON "trip_scheduling_categories" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_categories_created_by_idx" ON "trip_scheduling_categories" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_categories_updated_by_idx" ON "trip_scheduling_categories" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_categories_updated_at_idx" ON "trip_scheduling_categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_categories_created_at_idx" ON "trip_scheduling_categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_name_idx" ON "trip_scheduling_drivers" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_route_idx" ON "trip_scheduling_drivers" USING btree ("route");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_phone_idx" ON "trip_scheduling_drivers" USING btree ("phone");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_drivers_email_idx" ON "trip_scheduling_drivers" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_is_active_idx" ON "trip_scheduling_drivers" USING btree ("is_active");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_created_by_idx" ON "trip_scheduling_drivers" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_updated_by_idx" ON "trip_scheduling_drivers" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_updated_at_idx" ON "trip_scheduling_drivers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_drivers_created_at_idx" ON "trip_scheduling_drivers" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_locations_name_idx" ON "trip_scheduling_locations" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_route_idx" ON "trip_scheduling_locations" USING btree ("route_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_is_active_idx" ON "trip_scheduling_locations" USING btree ("is_active");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_created_by_idx" ON "trip_scheduling_locations" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_updated_by_idx" ON "trip_scheduling_locations" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_updated_at_idx" ON "trip_scheduling_locations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_locations_created_at_idx" ON "trip_scheduling_locations" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_routes_name_idx" ON "trip_scheduling_routes" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_routes_is_active_idx" ON "trip_scheduling_routes" USING btree ("is_active");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_routes_created_by_idx" ON "trip_scheduling_routes" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_routes_updated_by_idx" ON "trip_scheduling_routes" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_routes_updated_at_idx" ON "trip_scheduling_routes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_routes_created_at_idx" ON "trip_scheduling_routes" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_route_idx" ON "trip_scheduling_shuttles" USING btree ("route_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_location_idx" ON "trip_scheduling_shuttles" USING btree ("location_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_vehicle_idx" ON "trip_scheduling_shuttles" USING btree ("vehicle_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_driver_idx" ON "trip_scheduling_shuttles" USING btree ("driver_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_created_by_idx" ON "trip_scheduling_shuttles" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_updated_by_idx" ON "trip_scheduling_shuttles" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_updated_at_idx" ON "trip_scheduling_shuttles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_shuttles_created_at_idx" ON "trip_scheduling_shuttles" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_full_name_idx" ON "trip_scheduling_staff_voice" USING btree ("full_name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_email_idx" ON "trip_scheduling_staff_voice" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_category_idx" ON "trip_scheduling_staff_voice" USING btree ("category");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_subject_idx" ON "trip_scheduling_staff_voice" USING btree ("subject");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_status_idx" ON "trip_scheduling_staff_voice" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_created_by_idx" ON "trip_scheduling_staff_voice" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_updated_by_idx" ON "trip_scheduling_staff_voice" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_updated_at_idx" ON "trip_scheduling_staff_voice" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_staff_voice_created_at_idx" ON "trip_scheduling_staff_voice" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_vehicles_name_idx" ON "trip_scheduling_vehicles" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_vehicles_is_active_idx" ON "trip_scheduling_vehicles" USING btree ("is_active");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_vehicles_created_by_idx" ON "trip_scheduling_vehicles" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_vehicles_updated_by_idx" ON "trip_scheduling_vehicles" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_vehicles_updated_at_idx" ON "trip_scheduling_vehicles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_vehicles_created_at_idx" ON "trip_scheduling_vehicles" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_zones_index_number_idx" ON "trip_scheduling_zones" USING btree ("index_number");
  CREATE UNIQUE INDEX IF NOT EXISTS "trip_scheduling_zones_zone_number_idx" ON "trip_scheduling_zones" USING btree ("zone_number");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_district_idx" ON "trip_scheduling_zones" USING btree ("district");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_is_active_idx" ON "trip_scheduling_zones" USING btree ("is_active");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_created_by_idx" ON "trip_scheduling_zones" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_updated_by_idx" ON "trip_scheduling_zones" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_updated_at_idx" ON "trip_scheduling_zones" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_zones_created_at_idx" ON "trip_scheduling_zones" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_notification_emails_order_idx" ON "trip_scheduling_settings_notification_emails" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_notification_emails_parent_id_idx" ON "trip_scheduling_settings_notification_emails" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_allowed_domains_order_idx" ON "trip_scheduling_settings_allowed_domains" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_allowed_domains_parent_id_idx" ON "trip_scheduling_settings_allowed_domains" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_history_access_emails_order_idx" ON "trip_scheduling_settings_history_access_emails" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_history_access_emails_parent_id_idx" ON "trip_scheduling_settings_history_access_emails" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_created_by_idx" ON "trip_scheduling_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_updated_by_idx" ON "trip_scheduling_settings" USING btree ("updated_by_id");
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_adhoc_fk" FOREIGN KEY ("trip_scheduling_adhoc_id") REFERENCES "public"."trip_scheduling_adhoc"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_bookings_fk" FOREIGN KEY ("trip_scheduling_bookings_id") REFERENCES "public"."trip_scheduling_bookings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_categories_fk" FOREIGN KEY ("trip_scheduling_categories_id") REFERENCES "public"."trip_scheduling_categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_drivers_fk" FOREIGN KEY ("trip_scheduling_drivers_id") REFERENCES "public"."trip_scheduling_drivers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_locations_fk" FOREIGN KEY ("trip_scheduling_locations_id") REFERENCES "public"."trip_scheduling_locations"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_routes_fk" FOREIGN KEY ("trip_scheduling_routes_id") REFERENCES "public"."trip_scheduling_routes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_shuttles_fk" FOREIGN KEY ("trip_scheduling_shuttles_id") REFERENCES "public"."trip_scheduling_shuttles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_staff_voice_fk" FOREIGN KEY ("trip_scheduling_staff_voice_id") REFERENCES "public"."trip_scheduling_staff_voice"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_vehicles_fk" FOREIGN KEY ("trip_scheduling_vehicles_id") REFERENCES "public"."trip_scheduling_vehicles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_zones_fk" FOREIGN KEY ("trip_scheduling_zones_id") REFERENCES "public"."trip_scheduling_zones"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_adhoc_id_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_adhoc_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_bookings_i_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_bookings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_categories_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_drivers_id_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_drivers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_locations__idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_locations_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_routes_id_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_routes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_shuttles_i_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_shuttles_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_staff_voic_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_staff_voice_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_vehicles_i_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_vehicles_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_zones_id_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_zones_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_zones_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_vehicles_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_staff_voice_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_shuttles_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_routes_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_locations_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_drivers_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_categories_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_bookings_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_adhoc_id";
  DROP TABLE IF EXISTS "trip_scheduling_settings" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_settings_history_access_emails" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_settings_allowed_domains" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_settings_notification_emails" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_zones" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_vehicles" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_staff_voice" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_shuttles" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_routes" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_locations" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_drivers" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_categories" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_bookings" CASCADE;
  DROP TABLE IF EXISTS "trip_scheduling_adhoc" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_vehicles_capacity_unit";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_vehicles_category";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_staff_voice_status";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_staff_voice_category";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_shuttles_direction";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_bookings_status";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_adhoc_status";`)
}
