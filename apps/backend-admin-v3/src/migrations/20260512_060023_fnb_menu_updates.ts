import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_media' AND column_name='operator_id') THEN
       ALTER TABLE "menu_media" ALTER COLUMN "operator_id" SET NOT NULL;
     END IF;
   END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_media' AND column_name='operator_id') THEN
       ALTER TABLE "menu_media" ALTER COLUMN "operator_id" DROP NOT NULL;
     END IF;
   END $$;`)
}
