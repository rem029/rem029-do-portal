import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_ordering_collection" AS ENUM('menu-pages', 'fnb-menu-events');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ordering_slug" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ordering_collection" "enum_orders_ordering_collection";
    CREATE INDEX IF NOT EXISTS "orders_ordering_slug_idx" ON "orders" USING btree ("ordering_slug");

    DO $$ BEGIN
      UPDATE "orders" o
      SET "ordering_slug" = mp."info_slug",
          "ordering_collection" = 'menu-pages'
      FROM "menu_pages" mp
      WHERE o."ordering_slug" IS NULL
        AND mp."restaurant_id" = o."restaurant_id"
        AND mp."c_ordering_enabled" IS TRUE
        AND (
          SELECT count(*) FROM "menu_pages" mp2
          WHERE mp2."restaurant_id" = o."restaurant_id" AND mp2."c_ordering_enabled" IS TRUE
        ) = 1;
    EXCEPTION WHEN undefined_column THEN null; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_ordering_slug_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "ordering_collection";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "ordering_slug";
    DROP TYPE IF EXISTS "public"."enum_orders_ordering_collection";
  `)
}
