import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_adhoc_settlement_source" AS ENUM('driver', 'auto');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_trip_scheduling_bookings_settlement_source" AS ENUM('driver', 'auto');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  ALTER TABLE "trip_scheduling_adhoc" ADD COLUMN IF NOT EXISTS "settlement_source" "enum_trip_scheduling_adhoc_settlement_source";
  ALTER TABLE "trip_scheduling_bookings" ADD COLUMN IF NOT EXISTS "settlement_source" "enum_trip_scheduling_bookings_settlement_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trip_scheduling_adhoc" DROP COLUMN IF EXISTS "settlement_source";
  ALTER TABLE "trip_scheduling_bookings" DROP COLUMN IF EXISTS "settlement_source";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_adhoc_settlement_source";
  DROP TYPE IF EXISTS "public"."enum_trip_scheduling_bookings_settlement_source";`)
}
