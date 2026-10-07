import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_fulfillment" AS ENUM('standard', 'boh_only');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment" "enum_orders_fulfillment" DEFAULT 'standard';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "fulfillment";
    DROP TYPE IF EXISTS "public"."enum_orders_fulfillment";
  `)
}

