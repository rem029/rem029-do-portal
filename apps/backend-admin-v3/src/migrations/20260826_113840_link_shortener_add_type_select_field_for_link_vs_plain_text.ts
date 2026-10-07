import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_link_shortener_type" AS ENUM('link', 'plain_text');
   EXCEPTION WHEN duplicate_object THEN null; END $$;

   ALTER TABLE "link_shortener" ALTER COLUMN "link" DROP NOT NULL;
   ALTER TABLE "link_shortener" ADD COLUMN IF NOT EXISTS "type" "enum_link_shortener_type" DEFAULT 'link' NOT NULL;
   ALTER TABLE "link_shortener" ADD COLUMN IF NOT EXISTS "plain_text" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "link_shortener" ALTER COLUMN "link" SET NOT NULL;
   ALTER TABLE "link_shortener" DROP COLUMN IF EXISTS "type";
   ALTER TABLE "link_shortener" DROP COLUMN IF EXISTS "plain_text";
   DROP TYPE IF EXISTS "public"."enum_link_shortener_type";`)
}
