import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sal_ded_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reason_text" varchar NOT NULL
  );
  
  CREATE TABLE "_sal_ded_v_version_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"reason_text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  ALTER TABLE "sal_ded" ADD COLUMN "description_intro" varchar NOT NULL;
  ALTER TABLE "sal_ded" ADD COLUMN "next_policy_reminder" varchar NOT NULL;
  ALTER TABLE "_sal_ded_v" ADD COLUMN "version_description_intro" varchar NOT NULL;
  ALTER TABLE "_sal_ded_v" ADD COLUMN "version_next_policy_reminder" varchar NOT NULL;
  ALTER TABLE "salary_deduction_settings" ADD COLUMN "docx_template_id" uuid;
  ALTER TABLE "offer_letter_settings" ADD COLUMN "docx_template_id" uuid;
  ALTER TABLE "sal_ded_reasons" ADD CONSTRAINT "sal_ded_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sal_ded"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sal_ded_v_version_reasons" ADD CONSTRAINT "_sal_ded_v_version_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sal_ded_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sal_ded_reasons_order_idx" ON "sal_ded_reasons" USING btree ("_order");
  CREATE INDEX "sal_ded_reasons_parent_id_idx" ON "sal_ded_reasons" USING btree ("_parent_id");
  CREATE INDEX "_sal_ded_v_version_reasons_order_idx" ON "_sal_ded_v_version_reasons" USING btree ("_order");
  CREATE INDEX "_sal_ded_v_version_reasons_parent_id_idx" ON "_sal_ded_v_version_reasons" USING btree ("_parent_id");
  ALTER TABLE "salary_deduction_settings" ADD CONSTRAINT "salary_deduction_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offer_letter_settings" ADD CONSTRAINT "offer_letter_settings_docx_template_id_internal_media_id_fk" FOREIGN KEY ("docx_template_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "salary_deduction_settings_docx_template_idx" ON "salary_deduction_settings" USING btree ("docx_template_id");
  CREATE INDEX "offer_letter_settings_docx_template_idx" ON "offer_letter_settings" USING btree ("docx_template_id");
  ALTER TABLE "sal_ded" DROP COLUMN "description";
  ALTER TABLE "_sal_ded_v" DROP COLUMN "version_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sal_ded_reasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sal_ded_v_version_reasons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sal_ded_reasons" CASCADE;
  DROP TABLE "_sal_ded_v_version_reasons" CASCADE;
  ALTER TABLE "salary_deduction_settings" DROP CONSTRAINT "salary_deduction_settings_docx_template_id_internal_media_id_fk";
  
  ALTER TABLE "offer_letter_settings" DROP CONSTRAINT "offer_letter_settings_docx_template_id_internal_media_id_fk";
  
  DROP INDEX "salary_deduction_settings_docx_template_idx";
  DROP INDEX "offer_letter_settings_docx_template_idx";
  ALTER TABLE "sal_ded" ADD COLUMN "description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"This is to inform you <reason here>, dated below:","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0},{"tag":"ul","type":"list","start":1,"format":"","indent":0,"version":1,"children":[{"type":"listitem","value":1,"format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"Reason 1","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null},{"type":"listitem","value":2,"format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"Reason 2","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null}],"listType":"bullet","direction":null},{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"<more description here>","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0},{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"This matter is strictly confidential, and you are requested not to discuss the details with anyone other than your Line Manager or with Human Resources.","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0}],"direction":null}}'::jsonb NOT NULL;
  ALTER TABLE "_sal_ded_v" ADD COLUMN "version_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"This is to inform you <reason here>, dated below:","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0},{"tag":"ul","type":"list","start":1,"format":"","indent":0,"version":1,"children":[{"type":"listitem","value":1,"format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"Reason 1","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null},{"type":"listitem","value":2,"format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"Reason 2","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null}],"listType":"bullet","direction":null},{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"<more description here>","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0},{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"mode":"normal","text":"This matter is strictly confidential, and you are requested not to discuss the details with anyone other than your Line Manager or with Human Resources.","type":"text","style":"","detail":0,"format":0,"version":1}],"direction":null,"textStyle":"","textFormat":0}],"direction":null}}'::jsonb NOT NULL;
  ALTER TABLE "sal_ded" DROP COLUMN "description_intro";
  ALTER TABLE "sal_ded" DROP COLUMN "next_policy_reminder";
  ALTER TABLE "_sal_ded_v" DROP COLUMN "version_description_intro";
  ALTER TABLE "_sal_ded_v" DROP COLUMN "version_next_policy_reminder";
  ALTER TABLE "salary_deduction_settings" DROP COLUMN "docx_template_id";
  ALTER TABLE "offer_letter_settings" DROP COLUMN "docx_template_id";`)
}
