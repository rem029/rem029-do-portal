import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "forms_slug_idx";
  ALTER TABLE "forms" ALTER COLUMN "operator_slug" SET NOT NULL;
  CREATE UNIQUE INDEX "forms_operator_slug_idx" ON "forms" USING btree ("operator_slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "forms_operator_slug_idx";
  ALTER TABLE "forms" ALTER COLUMN "operator_slug" DROP NOT NULL;
  CREATE UNIQUE INDEX "forms_slug_idx" ON "forms" USING btree ("slug");`)
}
