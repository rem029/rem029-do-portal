import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_pages' AND column_name='info_operator_id') THEN
      ALTER TABLE "menu_pages" RENAME COLUMN "info_operator_id" TO "operator_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_pages' AND column_name='info_restaurant_id') THEN
      ALTER TABLE "menu_pages" RENAME COLUMN "info_restaurant_id" TO "restaurant_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_menu_pages_v' AND column_name='version_info_operator_id') THEN
      ALTER TABLE "_menu_pages_v" RENAME COLUMN "version_info_operator_id" TO "version_operator_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_menu_pages_v' AND column_name='version_info_restaurant_id') THEN
      ALTER TABLE "_menu_pages_v" RENAME COLUMN "version_info_restaurant_id" TO "version_restaurant_id";
    END IF;
  END $$;

  ALTER TABLE "menu_pages" DROP CONSTRAINT IF EXISTS "menu_pages_info_operator_id_operators_id_fk";
  ALTER TABLE "menu_pages" DROP CONSTRAINT IF EXISTS "menu_pages_info_restaurant_id_restaurants_id_fk";
  ALTER TABLE "_menu_pages_v" DROP CONSTRAINT IF EXISTS "_menu_pages_v_version_info_operator_id_operators_id_fk";
  ALTER TABLE "_menu_pages_v" DROP CONSTRAINT IF EXISTS "_menu_pages_v_version_info_restaurant_id_restaurants_id_fk";
  
  DROP INDEX IF EXISTS "_menu_allergens_v_autosave_idx";
  DROP INDEX IF EXISTS "_menu_tags_v_autosave_idx";
  DROP INDEX IF EXISTS "_menu_categories_v_autosave_idx";
  DROP INDEX IF EXISTS "menu_items_slug_idx";
  DROP INDEX IF EXISTS "_menu_items_v_version_version_slug_idx";
  DROP INDEX IF EXISTS "_menu_items_v_autosave_idx";
  DROP INDEX IF EXISTS "menu_slug_idx";
  DROP INDEX IF EXISTS "_menu_v_version_version_slug_idx";
  DROP INDEX IF EXISTS "_menu_v_autosave_idx";
  DROP INDEX IF EXISTS "menu_pages_info_info_operator_idx";
  DROP INDEX IF EXISTS "menu_pages_info_info_restaurant_idx";
  DROP INDEX IF EXISTS "_menu_pages_v_version_info_version_info_operator_idx";
  DROP INDEX IF EXISTS "_menu_pages_v_version_info_version_info_restaurant_idx";
  DROP INDEX IF EXISTS "_menu_pages_v_autosave_idx";

  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restaurant_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "users_restaurant_idx" ON "users" USING btree ("restaurant_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_operator_idx" ON "menu_pages" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_restaurant_idx" ON "menu_pages" USING btree ("restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_operator_idx" ON "_menu_pages_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_version_restaurant_idx" ON "_menu_pages_v" USING btree ("version_restaurant_id");

  ALTER TABLE "_menu_allergens_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_menu_tags_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_menu_categories_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_menu_items_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_menu_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "autosave";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_pages' AND column_name='operator_id') THEN
      ALTER TABLE "menu_pages" RENAME COLUMN "operator_id" TO "info_operator_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_pages' AND column_name='restaurant_id') THEN
      ALTER TABLE "menu_pages" RENAME COLUMN "restaurant_id" TO "info_restaurant_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_menu_pages_v' AND column_name='version_operator_id') THEN
      ALTER TABLE "_menu_pages_v" RENAME COLUMN "version_operator_id" TO "version_info_operator_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='_menu_pages_v' AND column_name='version_restaurant_id') THEN
      ALTER TABLE "_menu_pages_v" RENAME COLUMN "version_restaurant_id" TO "version_info_restaurant_id";
    END IF;
  END $$;

  ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_restaurant_id_restaurants_id_fk";
  ALTER TABLE "menu_pages" DROP CONSTRAINT IF EXISTS "menu_pages_operator_id_operators_id_fk";
  ALTER TABLE "menu_pages" DROP CONSTRAINT IF EXISTS "menu_pages_restaurant_id_restaurants_id_fk";
  ALTER TABLE "_menu_pages_v" DROP CONSTRAINT IF EXISTS "_menu_pages_v_version_operator_id_operators_id_fk";
  ALTER TABLE "_menu_pages_v" DROP CONSTRAINT IF EXISTS "_menu_pages_v_version_restaurant_id_restaurants_id_fk";
  
  DROP INDEX IF EXISTS "users_restaurant_idx";
  DROP INDEX IF EXISTS "menu_pages_operator_idx";
  DROP INDEX IF EXISTS "menu_pages_restaurant_idx";
  DROP INDEX IF EXISTS "_menu_pages_v_version_version_operator_idx";
  DROP INDEX IF EXISTS "_menu_pages_v_version_version_restaurant_idx";

  ALTER TABLE "_menu_allergens_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "_menu_tags_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "_menu_categories_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "_menu_items_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "_menu_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
  ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;

  DO $$ BEGIN
    ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_info_operator_id_operators_id_fk" FOREIGN KEY ("info_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "menu_pages" ADD CONSTRAINT "menu_pages_info_restaurant_id_restaurants_id_fk" FOREIGN KEY ("info_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_info_operator_id_operators_id_fk" FOREIGN KEY ("version_info_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_menu_pages_v" ADD CONSTRAINT "_menu_pages_v_version_info_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_info_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "_menu_allergens_v_autosave_idx" ON "_menu_allergens_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_tags_v_autosave_idx" ON "_menu_tags_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_menu_categories_v_autosave_idx" ON "_menu_categories_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "menu_items_slug_idx" ON "menu_items" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_version_version_slug_idx" ON "_menu_items_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_menu_items_v_autosave_idx" ON "_menu_items_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "menu_slug_idx" ON "menu" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "_menu_v_version_version_slug_idx" ON "_menu_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_menu_v_autosave_idx" ON "_menu_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "menu_pages_info_info_operator_idx" ON "menu_pages" USING btree ("info_operator_id");
  CREATE INDEX IF NOT EXISTS "menu_pages_info_info_restaurant_idx" ON "menu_pages" USING btree ("info_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_info_version_info_operator_idx" ON "_menu_pages_v" USING btree ("version_info_operator_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_version_info_version_info_restaurant_idx" ON "_menu_pages_v" USING btree ("version_info_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_menu_pages_v_autosave_idx" ON "_menu_pages_v" USING btree ("autosave");

  ALTER TABLE "users" DROP COLUMN IF EXISTS "restaurant_id";`)
}
