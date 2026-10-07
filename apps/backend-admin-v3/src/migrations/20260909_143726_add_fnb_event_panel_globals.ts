import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "fnb_event_waiter_panel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "fnb_event_back_of_house_panel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "fnb_event_cashier_panel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "fnb_event_waiter_panel" CASCADE;
    DROP TABLE IF EXISTS "fnb_event_back_of_house_panel" CASCADE;
    DROP TABLE IF EXISTS "fnb_event_cashier_panel" CASCADE;
  `)
}
