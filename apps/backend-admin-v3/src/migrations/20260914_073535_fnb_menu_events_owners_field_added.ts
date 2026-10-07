import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events_rels" ADD COLUMN IF NOT EXISTS "users_id" uuid;
    ALTER TABLE "_fnb_menu_events_v_rels" ADD COLUMN IF NOT EXISTS "users_id" uuid;

    DO $$ BEGIN
      ALTER TABLE "fnb_menu_events_rels" ADD CONSTRAINT "fnb_menu_events_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_fnb_menu_events_v_rels" ADD CONSTRAINT "_fnb_menu_events_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "fnb_menu_events_rels_users_id_idx" ON "fnb_menu_events_rels" USING btree ("users_id");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_rels_users_id_idx" ON "_fnb_menu_events_v_rels" USING btree ("users_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events_rels" DROP CONSTRAINT IF EXISTS "fnb_menu_events_rels_users_fk";
    ALTER TABLE "_fnb_menu_events_v_rels" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_rels_users_fk";

    DROP INDEX IF EXISTS "fnb_menu_events_rels_users_id_idx";
    DROP INDEX IF EXISTS "_fnb_menu_events_v_rels_users_id_idx";

    ALTER TABLE "fnb_menu_events_rels" DROP COLUMN IF EXISTS "users_id";
    ALTER TABLE "_fnb_menu_events_v_rels" DROP COLUMN IF EXISTS "users_id";
  `)
}
