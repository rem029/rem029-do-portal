import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trip_scheduling_staff_voice" ADD COLUMN IF NOT EXISTS "responded_at" timestamp(3) with time zone;
  ALTER TABLE "trip_scheduling_staff_voice" ADD COLUMN IF NOT EXISTS "approval_token" varchar;
  ALTER TABLE "trip_scheduling_staff_voice" ADD COLUMN IF NOT EXISTS "token_expiration" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trip_scheduling_staff_voice" DROP COLUMN IF EXISTS "responded_at";
  ALTER TABLE "trip_scheduling_staff_voice" DROP COLUMN IF EXISTS "approval_token";
  ALTER TABLE "trip_scheduling_staff_voice" DROP COLUMN IF EXISTS "token_expiration";`)
}
