import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "menu_items_modifier_groups_options_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "menu_items_modifier_groups_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_menu_items_v_version_modifier_groups_options_locales" (
      "label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" uuid NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_menu_items_v_version_modifier_groups_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" uuid NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "menu_items_modifier_groups_options_locales"
        ADD CONSTRAINT "menu_items_modifier_groups_options_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."menu_items_modifier_groups_options"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "menu_items_modifier_groups_locales"
        ADD CONSTRAINT "menu_items_modifier_groups_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."menu_items_modifier_groups"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_menu_items_v_version_modifier_groups_options_locales"
        ADD CONSTRAINT "_menu_items_v_version_modifier_groups_options_locales_par_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_menu_items_v_version_modifier_groups_options"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_menu_items_v_version_modifier_groups_locales"
        ADD CONSTRAINT "_menu_items_v_version_modifier_groups_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."_menu_items_v_version_modifier_groups"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_modifier_groups_options_locales_locale_parent_id_"
      ON "menu_items_modifier_groups_options_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_modifier_groups_locales_locale_parent_id_unique"
      ON "menu_items_modifier_groups_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_options_locales_locale"
      ON "_menu_items_v_version_modifier_groups_options_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_locales_locale_parent_"
      ON "_menu_items_v_version_modifier_groups_locales" USING btree ("_locale", "_parent_id");

    -- Backfill existing English modifier group names and option labels before dropping columns
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items_modifier_groups' AND column_name = 'name'
      ) THEN
        INSERT INTO "menu_items_modifier_groups_locales" ("_parent_id", "_locale", "name")
        SELECT "id", 'en', "name"
        FROM "menu_items_modifier_groups"
        WHERE "name" IS NOT NULL
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items_modifier_groups_options' AND column_name = 'label'
      ) THEN
        INSERT INTO "menu_items_modifier_groups_options_locales" ("_parent_id", "_locale", "label")
        SELECT "id", 'en', "label"
        FROM "menu_items_modifier_groups_options"
        WHERE "label" IS NOT NULL
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '_menu_items_v_version_modifier_groups' AND column_name = 'name'
      ) THEN
        INSERT INTO "_menu_items_v_version_modifier_groups_locales" ("_parent_id", "_locale", "name")
        SELECT "id", 'en', "name"
        FROM "_menu_items_v_version_modifier_groups"
        WHERE "name" IS NOT NULL
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '_menu_items_v_version_modifier_groups_options' AND column_name = 'label'
      ) THEN
        INSERT INTO "_menu_items_v_version_modifier_groups_options_locales" ("_parent_id", "_locale", "label")
        SELECT "id", 'en', "label"
        FROM "_menu_items_v_version_modifier_groups_options"
        WHERE "label" IS NOT NULL
        ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
      END IF;
    END $$;

    ALTER TABLE "menu_items_modifier_groups_options" DROP COLUMN IF EXISTS "label";
    ALTER TABLE "menu_items_modifier_groups" DROP COLUMN IF EXISTS "name";
    ALTER TABLE "_menu_items_v_version_modifier_groups_options" DROP COLUMN IF EXISTS "label";
    ALTER TABLE "_menu_items_v_version_modifier_groups" DROP COLUMN IF EXISTS "name";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "menu_items_modifier_groups_options" ADD COLUMN IF NOT EXISTS "label" varchar;
    ALTER TABLE "menu_items_modifier_groups" ADD COLUMN IF NOT EXISTS "name" varchar;
    ALTER TABLE "_menu_items_v_version_modifier_groups_options" ADD COLUMN IF NOT EXISTS "label" varchar;
    ALTER TABLE "_menu_items_v_version_modifier_groups" ADD COLUMN IF NOT EXISTS "name" varchar;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items_modifier_groups_locales'
      ) THEN
        UPDATE "menu_items_modifier_groups" AS mg
        SET "name" = l."name"
        FROM "menu_items_modifier_groups_locales" AS l
        WHERE l."_parent_id" = mg."id" AND l."_locale" = 'en' AND mg."name" IS NULL;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items_modifier_groups_options_locales'
      ) THEN
        UPDATE "menu_items_modifier_groups_options" AS opt
        SET "label" = l."label"
        FROM "menu_items_modifier_groups_options_locales" AS l
        WHERE l."_parent_id" = opt."id" AND l."_locale" = 'en' AND opt."label" IS NULL;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = '_menu_items_v_version_modifier_groups_locales'
      ) THEN
        UPDATE "_menu_items_v_version_modifier_groups" AS vmg
        SET "name" = l."name"
        FROM "_menu_items_v_version_modifier_groups_locales" AS l
        WHERE l."_parent_id" = vmg."id" AND l."_locale" = 'en' AND vmg."name" IS NULL;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = '_menu_items_v_version_modifier_groups_options_locales'
      ) THEN
        UPDATE "_menu_items_v_version_modifier_groups_options" AS vopt
        SET "label" = l."label"
        FROM "_menu_items_v_version_modifier_groups_options_locales" AS l
        WHERE l."_parent_id" = vopt."id" AND l."_locale" = 'en' AND vopt."label" IS NULL;
      END IF;
    END $$;

    DROP TABLE IF EXISTS "menu_items_modifier_groups_options_locales" CASCADE;
    DROP TABLE IF EXISTS "menu_items_modifier_groups_locales" CASCADE;
    DROP TABLE IF EXISTS "_menu_items_v_version_modifier_groups_options_locales" CASCADE;
    DROP TABLE IF EXISTS "_menu_items_v_version_modifier_groups_locales" CASCADE;
  `)
}
