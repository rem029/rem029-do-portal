import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "last_order_number" numeric DEFAULT 0;
    ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "last_order_number_date" timestamp(3) with time zone;
    ALTER TABLE "_restaurants_v" ADD COLUMN IF NOT EXISTS "version_last_order_number" numeric DEFAULT 0;
    ALTER TABLE "_restaurants_v" ADD COLUMN IF NOT EXISTS "version_last_order_number_date" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" numeric;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_date" timestamp(3) with time zone;
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_restaurant_date_order_number_idx"
      ON "orders" ("restaurant_id", "order_date", "order_number");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_restaurant_date_order_number_idx";
    ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "last_order_number";
    ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "last_order_number_date";
    ALTER TABLE "_restaurants_v" DROP COLUMN IF EXISTS "version_last_order_number";
    ALTER TABLE "_restaurants_v" DROP COLUMN IF EXISTS "version_last_order_number_date";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "order_number";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "order_date";
  `)
}

