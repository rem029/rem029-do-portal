import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_pages" ADD COLUMN IF NOT EXISTS "c_show_prices" boolean DEFAULT true;
    ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "version_c_show_prices" boolean DEFAULT true;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "show_prices" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_pages" DROP COLUMN IF EXISTS "c_show_prices";
    ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "version_c_show_prices";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "show_prices";
  `)
}
