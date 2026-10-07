import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_settings_signature_group_type') THEN
        CREATE TYPE "public"."enum_user_settings_signature_group_type" AS ENUM('draw', 'upload');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_settings_initials_group_type') THEN
        CREATE TYPE "public"."enum_user_settings_initials_group_type" AS ENUM('draw', 'upload');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature_group_type') THEN
        ALTER TABLE "user_settings" ADD COLUMN "signature_group_type" "enum_user_settings_signature_group_type" DEFAULT 'draw';
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature_group_signature_base64') THEN
        ALTER TABLE "user_settings" ADD COLUMN "signature_group_signature_base64" varchar;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='initials_group_type') THEN
        ALTER TABLE "user_settings" ADD COLUMN "initials_group_type" "enum_user_settings_initials_group_type" DEFAULT 'draw';
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='initials_group_signature_base64') THEN
        ALTER TABLE "user_settings" ADD COLUMN "initials_group_signature_base64" varchar;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature') THEN
        ALTER TABLE "user_settings" DROP COLUMN "signature";
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature') THEN
        ALTER TABLE "user_settings" ADD COLUMN "signature" varchar;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature_group_type') THEN
        ALTER TABLE "user_settings" DROP COLUMN "signature_group_type";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='signature_group_signature_base64') THEN
        ALTER TABLE "user_settings" DROP COLUMN "signature_group_signature_base64";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='initials_group_type') THEN
        ALTER TABLE "user_settings" DROP COLUMN "initials_group_type";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='initials_group_signature_base64') THEN
        ALTER TABLE "user_settings" DROP COLUMN "initials_group_signature_base64";
      END IF;
    END $$;

    DROP TYPE IF EXISTS "public"."enum_user_settings_signature_group_type";
    DROP TYPE IF EXISTS "public"."enum_user_settings_initials_group_type";
  `)
}
