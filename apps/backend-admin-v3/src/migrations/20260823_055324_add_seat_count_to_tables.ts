import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "seat_count" numeric DEFAULT 4;
  ALTER TABLE "_tables_v" ADD COLUMN IF NOT EXISTS "version_seat_count" numeric DEFAULT 4;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tables" DROP COLUMN IF EXISTS "seat_count";
  ALTER TABLE "_tables_v" DROP COLUMN IF EXISTS "version_seat_count";`)
}
