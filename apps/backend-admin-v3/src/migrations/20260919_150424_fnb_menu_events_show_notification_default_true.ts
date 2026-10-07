import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_header_show_notification" SET DEFAULT true;
  ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_header_show_notification" SET DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fnb_menu_events" ALTER COLUMN "c_header_show_notification" SET DEFAULT false;
  ALTER TABLE "_fnb_menu_events_v" ALTER COLUMN "version_c_header_show_notification" SET DEFAULT false;`)
}
