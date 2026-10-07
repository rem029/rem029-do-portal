import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "in_stock" boolean DEFAULT true;
    ALTER TABLE "_menu_items_v" ADD COLUMN IF NOT EXISTS "version_in_stock" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "in_stock";
    ALTER TABLE "_menu_items_v" DROP COLUMN IF EXISTS "version_in_stock";
  `)
}
