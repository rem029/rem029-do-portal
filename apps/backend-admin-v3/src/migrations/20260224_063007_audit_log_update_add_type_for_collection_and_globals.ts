import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_logs_type" AS ENUM('collection', 'global');
  ALTER TABLE "audit_logs" ADD COLUMN "type" "enum_audit_logs_type" DEFAULT 'collection' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_logs" DROP COLUMN "type";
  DROP TYPE "public"."enum_audit_logs_type";`)
}
