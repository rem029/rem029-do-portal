import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_forms_theme" ADD VALUE 'banyan-tree-lululemon';
  ALTER TABLE "forms" ADD COLUMN "background_image_id" uuid;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "forms_background_image_idx" ON "forms" USING btree ("background_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP CONSTRAINT "forms_background_image_id_media_id_fk";
  
  ALTER TABLE "forms" ALTER COLUMN "theme" SET DATA TYPE text;
  ALTER TABLE "forms" ALTER COLUMN "theme" SET DEFAULT 'dohaquest'::text;
  DROP TYPE "public"."enum_forms_theme";
  CREATE TYPE "public"."enum_forms_theme" AS ENUM('printemps', 'dohaoasis', 'dohaoasis-new', 'dohaoasis-alt', 'dohaquest');
  ALTER TABLE "forms" ALTER COLUMN "theme" SET DEFAULT 'dohaquest'::"public"."enum_forms_theme";
  ALTER TABLE "forms" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_forms_theme" USING "theme"::"public"."enum_forms_theme";
  DROP INDEX "forms_background_image_idx";
  ALTER TABLE "forms" DROP COLUMN "background_image_id";`)
}
