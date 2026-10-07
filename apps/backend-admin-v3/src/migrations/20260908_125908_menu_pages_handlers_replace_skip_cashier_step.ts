import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_menu_pages_c_handlers" AS ENUM('waiter_boh_cashier', 'waiter_boh', 'boh_only');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__menu_pages_v_version_c_handlers" AS ENUM('waiter_boh_cashier', 'waiter_boh', 'boh_only');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "menu_pages" ADD COLUMN IF NOT EXISTS "c_handlers" "enum_menu_pages_c_handlers";
    ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "version_c_handlers" "enum__menu_pages_v_version_c_handlers";

    -- Backfill from the legacy column. Guarded so a re-run (after c_skip_cashier_step
    -- has already been dropped below) is a no-op instead of an error.
    DO $$ BEGIN
      UPDATE "menu_pages" SET "c_handlers" = 'waiter_boh' WHERE "c_skip_cashier_step" IS TRUE AND "c_handlers" IS NULL;
    EXCEPTION WHEN undefined_column THEN null; END $$;
    UPDATE "menu_pages" SET "c_handlers" = 'waiter_boh_cashier' WHERE "c_handlers" IS NULL;

    DO $$ BEGIN
      UPDATE "_menu_pages_v" SET "version_c_handlers" = 'waiter_boh' WHERE "version_c_skip_cashier_step" IS TRUE AND "version_c_handlers" IS NULL;
    EXCEPTION WHEN undefined_column THEN null; END $$;
    UPDATE "_menu_pages_v" SET "version_c_handlers" = 'waiter_boh_cashier' WHERE "version_c_handlers" IS NULL;

    ALTER TABLE "menu_pages" ALTER COLUMN "c_handlers" SET DEFAULT 'waiter_boh_cashier';
    ALTER TABLE "_menu_pages_v" ALTER COLUMN "version_c_handlers" SET DEFAULT 'waiter_boh_cashier';

    ALTER TABLE "menu_pages" DROP COLUMN IF EXISTS "c_skip_cashier_step";
    ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "version_c_skip_cashier_step";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_pages" ADD COLUMN IF NOT EXISTS "c_skip_cashier_step" boolean DEFAULT false;
    ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "version_c_skip_cashier_step" boolean DEFAULT false;

    DO $$ BEGIN
      UPDATE "menu_pages" SET "c_skip_cashier_step" = ("c_handlers" = 'waiter_boh');
    EXCEPTION WHEN undefined_column THEN null; END $$;

    DO $$ BEGIN
      UPDATE "_menu_pages_v" SET "version_c_skip_cashier_step" = ("version_c_handlers" = 'waiter_boh');
    EXCEPTION WHEN undefined_column THEN null; END $$;

    ALTER TABLE "menu_pages" DROP COLUMN IF EXISTS "c_handlers";
    ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "version_c_handlers";

    DROP TYPE IF EXISTS "public"."enum_menu_pages_c_handlers";
    DROP TYPE IF EXISTS "public"."enum__menu_pages_v_version_c_handlers";
  `)
}
