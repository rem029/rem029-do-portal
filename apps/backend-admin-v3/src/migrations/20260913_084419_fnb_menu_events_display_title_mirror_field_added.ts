import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: `payload migrate:create` also proposed
// `ALTER TABLE "fnb_event_staff" ALTER COLUMN "operator_slug" DROP NOT NULL`
// here — that's pre-existing, unrelated schema drift on a different collection
// (not something this change touches or investigated). Deliberately left out
// of this migration; needs its own migration once someone confirms intent.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_title" varchar;

    -- Backfill existing events: mirror the 'en' info.title, falling back to
    -- operator_slug for anything with no title yet. The syncEventDisplayTitle
    -- beforeChange hook keeps this current for every save from here on; this
    -- one-time backfill just covers docs that predate the hook.
    UPDATE "fnb_menu_events" AS e
    SET "title" = l."info_title"
    FROM "fnb_menu_events_locales" AS l
    WHERE l."_parent_id" = e."id"
      AND l."_locale" = 'en'
      AND l."info_title" IS NOT NULL
      AND e."title" IS NULL;

    UPDATE "fnb_menu_events"
    SET "title" = "operator_slug"
    WHERE "title" IS NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_title";
  `)
}
