import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_pages" ADD COLUMN IF NOT EXISTS "c_skip_cashier_step" boolean DEFAULT false;
    ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "version_c_skip_cashier_step" boolean DEFAULT false;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "event_mode" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_pages" DROP COLUMN IF EXISTS "c_skip_cashier_step";
    ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "version_c_skip_cashier_step";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "event_mode";
  `)
}
