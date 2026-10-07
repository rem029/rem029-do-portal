import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded" DROP CONSTRAINT IF EXISTS "sal_ded_user_id_users_id_fk";
  
  ALTER TABLE "_sal_ded_v" DROP CONSTRAINT IF EXISTS "_sal_ded_v_version_user_id_users_id_fk";
  
  DROP INDEX IF EXISTS "sal_ded_user_idx";
  DROP INDEX IF EXISTS "_sal_ded_v_version_version_user_idx";

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sal_ded' AND column_name = 'employee_id' AND data_type != 'uuid') THEN
      ALTER TABLE "sal_ded" RENAME COLUMN "employee_id" TO "employee_id_display";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '_sal_ded_v' AND column_name = 'version_employee_id' AND data_type != 'uuid') THEN
      ALTER TABLE "_sal_ded_v" RENAME COLUMN "version_employee_id" TO "version_employee_id_display";
    END IF;
  END $$;

  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "employee_id" uuid;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_employee_id" uuid;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sal_ded_employee_id_users_id_fk') THEN
      ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add constraint sal_ded_employee_id_users_id_fk';
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_sal_ded_v_version_employee_id_users_id_fk') THEN
      ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_employee_id_users_id_fk" FOREIGN KEY ("version_employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add constraint _sal_ded_v_version_employee_id_users_id_fk';
  END $$;

  CREATE INDEX IF NOT EXISTS "sal_ded_employee_idx" ON "sal_ded" USING btree ("employee_id");
  CREATE INDEX IF NOT EXISTS "_sal_ded_v_version_version_employee_idx" ON "_sal_ded_v" USING btree ("version_employee_id");
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "user_id";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_user_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded" DROP CONSTRAINT IF EXISTS "sal_ded_employee_id_users_id_fk";
  
  ALTER TABLE "_sal_ded_v" DROP CONSTRAINT IF EXISTS "_sal_ded_v_version_employee_id_users_id_fk";
  
  DROP INDEX IF EXISTS "sal_ded_employee_idx";
  DROP INDEX IF EXISTS "_sal_ded_v_version_version_employee_idx";
  ALTER TABLE "sal_ded" ADD COLUMN IF NOT EXISTS "user_id" uuid;
  ALTER TABLE "_sal_ded_v" ADD COLUMN IF NOT EXISTS "version_user_id" uuid;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sal_ded_user_id_users_id_fk') THEN
      ALTER TABLE "sal_ded" ADD CONSTRAINT "sal_ded_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add constraint sal_ded_user_id_users_id_fk';
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_sal_ded_v_version_user_id_users_id_fk') THEN
      ALTER TABLE "_sal_ded_v" ADD CONSTRAINT "_sal_ded_v_version_user_id_users_id_fk" FOREIGN KEY ("version_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not add constraint _sal_ded_v_version_user_id_users_id_fk';
  END $$;

  CREATE INDEX IF NOT EXISTS "sal_ded_user_idx" ON "sal_ded" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "_sal_ded_v_version_version_user_idx" ON "_sal_ded_v" USING btree ("version_user_id");
  
  ALTER TABLE "sal_ded" DROP COLUMN IF EXISTS "employee_id";
  ALTER TABLE "_sal_ded_v" DROP COLUMN IF EXISTS "version_employee_id";
  
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sal_ded' AND column_name = 'employee_id_display') THEN
      ALTER TABLE "sal_ded" RENAME COLUMN "employee_id_display" TO "employee_id";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '_sal_ded_v' AND column_name = 'version_employee_id_display') THEN
      ALTER TABLE "_sal_ded_v" RENAME COLUMN "version_employee_id_display" TO "version_employee_id";
    END IF;
  END $$;`)
}
