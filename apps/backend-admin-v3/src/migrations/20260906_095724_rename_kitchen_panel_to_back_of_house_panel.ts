import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "back_of_house_panel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    DROP TABLE IF EXISTS "kitchen_panel" CASCADE;

    -- Carry over already-granted staff access: accessCheck matches users-access
    -- rows by slug, so without this every configured kitchen/BOH staff member
    -- silently loses access. Drop any pre-existing 'back-of-house-panel' row on
    -- the same parent first so the rename can't create a duplicate slug (the
    -- users-access field validates slug uniqueness).
    DELETE FROM "users_access_access"
      WHERE "slug" = 'kitchen-panel'
        AND "_parent_id" IN (
          SELECT "_parent_id" FROM "users_access_access" WHERE "slug" = 'back-of-house-panel'
        );
    UPDATE "users_access_access" SET "slug" = 'back-of-house-panel' WHERE "slug" = 'kitchen-panel';

    -- Carry over saved admin-UI preferences keyed by the old global slug.
    UPDATE "payload_preferences"
      SET "key" = REPLACE("key", 'kitchen-panel', 'back-of-house-panel')
      WHERE "key" LIKE '%kitchen-panel%';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "kitchen_panel" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    DROP TABLE IF EXISTS "back_of_house_panel" CASCADE;

    DELETE FROM "users_access_access"
      WHERE "slug" = 'back-of-house-panel'
        AND "_parent_id" IN (
          SELECT "_parent_id" FROM "users_access_access" WHERE "slug" = 'kitchen-panel'
        );
    UPDATE "users_access_access" SET "slug" = 'kitchen-panel' WHERE "slug" = 'back-of-house-panel';

    UPDATE "payload_preferences"
      SET "key" = REPLACE("key", 'back-of-house-panel', 'kitchen-panel')
      WHERE "key" LIKE '%back-of-house-panel%';
  `)
}
