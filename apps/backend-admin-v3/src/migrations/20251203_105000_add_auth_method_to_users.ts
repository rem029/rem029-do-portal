import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_auth_method" AS ENUM('credentials', 'microsoft');
  ALTER TABLE "users" ADD COLUMN "auth_method" "enum_users_auth_method" DEFAULT 'credentials';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "auth_method";
  DROP TYPE "public"."enum_users_auth_method";`)
}
