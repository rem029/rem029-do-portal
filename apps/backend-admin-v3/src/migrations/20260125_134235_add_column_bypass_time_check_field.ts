import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_requests" ADD COLUMN "bypass_day_restriction" boolean DEFAULT false;
  ALTER TABLE "_hr_requests_v" ADD COLUMN "version_bypass_day_restriction" boolean DEFAULT false;
  ALTER TABLE "bsn_just" ADD COLUMN "bypass_day_restriction" boolean DEFAULT false;
  ALTER TABLE "_bsn_just_v" ADD COLUMN "version_bypass_day_restriction" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_requests" DROP COLUMN "bypass_day_restriction";
  ALTER TABLE "_hr_requests_v" DROP COLUMN "version_bypass_day_restriction";
  ALTER TABLE "bsn_just" DROP COLUMN "bypass_day_restriction";
  ALTER TABLE "_bsn_just_v" DROP COLUMN "version_bypass_day_restriction";`)
}
