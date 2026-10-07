import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_orders_status_new" AS ENUM('pending', 'confirmed', 'preparing', 'prepared', 'served', 'completed', 'cancelled');
  ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."enum_orders_status_new" USING "status"::text::"public"."enum_orders_status_new";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
  DROP TYPE "public"."enum_orders_status";
  ALTER TYPE "public"."enum_orders_status_new" RENAME TO "enum_orders_status";

  ALTER TABLE "orders" ADD COLUMN "prepared_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "prepared_at";

  CREATE TYPE "public"."enum_orders_status_old" AS ENUM('pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled');
  ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."enum_orders_status_old" USING (
    CASE
      WHEN "status"::text = 'prepared' THEN 'preparing'
      ELSE "status"::text
    END
  )::"public"."enum_orders_status_old";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
  DROP TYPE "public"."enum_orders_status";
  ALTER TYPE "public"."enum_orders_status_old" RENAME TO "enum_orders_status";`)
}
