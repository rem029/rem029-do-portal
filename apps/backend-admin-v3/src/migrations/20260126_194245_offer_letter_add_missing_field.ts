import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offer_letter" ADD COLUMN "other_benefits_home_leave_ticket" varchar NOT NULL;
  ALTER TABLE "_offer_letter_v" ADD COLUMN "version_other_benefits_home_leave_ticket" varchar NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offer_letter" DROP COLUMN "other_benefits_home_leave_ticket";
  ALTER TABLE "_offer_letter_v" DROP COLUMN "version_other_benefits_home_leave_ticket";`)
}
