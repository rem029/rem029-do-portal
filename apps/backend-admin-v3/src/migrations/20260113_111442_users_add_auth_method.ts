import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_auth_method" AS ENUM('credentials', 'microsoft');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "users" ADD COLUMN "auth_method" "enum_users_auth_method" DEFAULT 'credentials';
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "users" DROP COLUMN IF EXISTS "auth_method";
    EXCEPTION
      WHEN undefined_column THEN null;
    END $$;
  `)

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_users_auth_method";
  `)
}
