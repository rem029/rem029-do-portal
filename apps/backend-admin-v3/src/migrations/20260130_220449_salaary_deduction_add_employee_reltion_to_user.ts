import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" ALTER COLUMN "auth_method" DROP DEFAULT;
  ALTER TABLE "sal_ded" ALTER COLUMN "employee_department_id" DROP NOT NULL;
  ALTER TABLE "_sal_ded_v" ALTER COLUMN "version_employee_department_id" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "h2a_oasys_emp_id" varchar DEFAULT '';
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "override_department" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_user_id" uuid NOT NULL;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_override_department" boolean DEFAULT false;
  
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sal_ded_user_id_users_id_fk') THEN
      ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_sal_ded_v_version_user_id_users_id_fk') THEN
      ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_user_id_users_id_fk" FOREIGN KEY ("version_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "sal_ded_user_idx" ON "sal_ded" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "_sal_ded_v_version_version_user_idx" ON "_sal_ded_v" USING btree ("version_user_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "sal_ded" DROP CONSTRAINT IF EXISTS "sal_ded_user_id_users_id_fk";
  ALTER TABLE "_sal_ded_v" DROP CONSTRAINT IF EXISTS "_sal_ded_v_version_user_id_users_id_fk";
  
  DROP INDEX IF EXISTS "sal_ded_user_idx";
  DROP INDEX IF EXISTS "_sal_ded_v_version_version_user_idx";
  
  ALTER TABLE "users" ALTER COLUMN "auth_method" SET DEFAULT 'credentials';
  ALTER TABLE "sal_ded" ALTER COLUMN "employee_department_id" SET NOT NULL;
  ALTER TABLE "_sal_ded_v" ALTER COLUMN "version_employee_department_id" SET NOT NULL;
  
  ALTER TABLE "users" DROP COLUMN IF EXISTS "h2a_oasys_emp_id";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "user_id";
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "override_department";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_user_id";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_override_department";`)
}
