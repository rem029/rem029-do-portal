import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "qr_png_id" uuid;
    ALTER TABLE "fnb_menu_events" ADD COLUMN IF NOT EXISTS "qr_svg_id" uuid;
    ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_qr_png_id" uuid;
    ALTER TABLE "_fnb_menu_events_v" ADD COLUMN IF NOT EXISTS "version_qr_svg_id" uuid;

    DO $$ BEGIN
      ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_qr_png_id_menu_media_id_fk" FOREIGN KEY ("qr_png_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "fnb_menu_events" ADD CONSTRAINT "fnb_menu_events_qr_svg_id_menu_media_id_fk" FOREIGN KEY ("qr_svg_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_qr_png_id_menu_media_id_fk" FOREIGN KEY ("version_qr_png_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_fnb_menu_events_v" ADD CONSTRAINT "_fnb_menu_events_v_version_qr_svg_id_menu_media_id_fk" FOREIGN KEY ("version_qr_svg_id") REFERENCES "public"."menu_media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "fnb_menu_events_qr_png_idx" ON "fnb_menu_events" USING btree ("qr_png_id");
    CREATE INDEX IF NOT EXISTS "fnb_menu_events_qr_svg_idx" ON "fnb_menu_events" USING btree ("qr_svg_id");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_qr_png_idx" ON "_fnb_menu_events_v" USING btree ("version_qr_png_id");
    CREATE INDEX IF NOT EXISTS "_fnb_menu_events_v_version_version_qr_svg_idx" ON "_fnb_menu_events_v" USING btree ("version_qr_svg_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "fnb_menu_events" DROP CONSTRAINT IF EXISTS "fnb_menu_events_qr_png_id_menu_media_id_fk";
    ALTER TABLE "fnb_menu_events" DROP CONSTRAINT IF EXISTS "fnb_menu_events_qr_svg_id_menu_media_id_fk";
    ALTER TABLE "_fnb_menu_events_v" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_version_qr_png_id_menu_media_id_fk";
    ALTER TABLE "_fnb_menu_events_v" DROP CONSTRAINT IF EXISTS "_fnb_menu_events_v_version_qr_svg_id_menu_media_id_fk";

    DROP INDEX IF EXISTS "fnb_menu_events_qr_png_idx";
    DROP INDEX IF EXISTS "fnb_menu_events_qr_svg_idx";
    DROP INDEX IF EXISTS "_fnb_menu_events_v_version_version_qr_png_idx";
    DROP INDEX IF EXISTS "_fnb_menu_events_v_version_version_qr_svg_idx";

    ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "qr_png_id";
    ALTER TABLE "fnb_menu_events" DROP COLUMN IF EXISTS "qr_svg_id";
    ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_qr_png_id";
    ALTER TABLE "_fnb_menu_events_v" DROP COLUMN IF EXISTS "version_qr_svg_id";
  `)
}
