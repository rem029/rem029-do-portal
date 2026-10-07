import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_orders_status_new" AS ENUM('pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled');
  ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."enum_orders_status_new" USING "status"::text::"public"."enum_orders_status_new";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
  DROP TYPE "public"."enum_orders_status";
  ALTER TYPE "public"."enum_orders_status_new" RENAME TO "enum_orders_status";

  ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_operator_id_operators_id_fk";
  DROP INDEX IF EXISTS "orders_operator_idx";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "operator_id";

  ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "preparing_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "cancel_reason" varchar;

  CREATE TABLE "kitchen_panel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "cashier_panel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "kitchen_panel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cashier_panel" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "kitchen_panel" CASCADE;
  DROP TABLE "cashier_panel" CASCADE;

  ALTER TABLE "orders" DROP COLUMN IF EXISTS "confirmed_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "preparing_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "cancelled_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "cancel_reason";

  ALTER TABLE "orders" ADD COLUMN "operator_id" uuid;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_operator_idx" ON "orders" USING btree ("operator_id");

  CREATE TYPE "public"."enum_orders_status_old" AS ENUM('pending', 'served', 'completed');
  ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."enum_orders_status_old" USING (
    CASE
      WHEN "status"::text IN ('confirmed', 'preparing', 'cancelled') THEN 'pending'
      ELSE "status"::text
    END
  )::"public"."enum_orders_status_old";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
  DROP TYPE "public"."enum_orders_status";
  ALTER TYPE "public"."enum_orders_status_old" RENAME TO "enum_orders_status";`)
}
