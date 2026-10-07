import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sal_ded_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  CREATE TABLE "_sal_ded_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"internal_media_id" uuid
  );
  
  ALTER TABLE "workflow_steps" ADD COLUMN "can_attach" boolean DEFAULT false;
  ALTER TABLE "workflow_steps" ADD COLUMN "can_generate_wordfile" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "can_attach" boolean DEFAULT false;
  ALTER TABLE "sal_ded_workflow_reviews" ADD COLUMN "can_generate_wordfile" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "can_attach" boolean DEFAULT false;
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" ADD COLUMN "can_generate_wordfile" boolean DEFAULT false;
  ALTER TABLE "sal_ded_rels" ADD CONSTRAINT "sal_ded_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sal_ded"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sal_ded_rels" ADD CONSTRAINT "sal_ded_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sal_ded_v_rels" ADD CONSTRAINT "_sal_ded_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_sal_ded_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sal_ded_v_rels" ADD CONSTRAINT "_sal_ded_v_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sal_ded_rels_order_idx" ON "sal_ded_rels" USING btree ("order");
  CREATE INDEX "sal_ded_rels_parent_idx" ON "sal_ded_rels" USING btree ("parent_id");
  CREATE INDEX "sal_ded_rels_path_idx" ON "sal_ded_rels" USING btree ("path");
  CREATE INDEX "sal_ded_rels_internal_media_id_idx" ON "sal_ded_rels" USING btree ("internal_media_id");
  CREATE INDEX "_sal_ded_v_rels_order_idx" ON "_sal_ded_v_rels" USING btree ("order");
  CREATE INDEX "_sal_ded_v_rels_parent_idx" ON "_sal_ded_v_rels" USING btree ("parent_id");
  CREATE INDEX "_sal_ded_v_rels_path_idx" ON "_sal_ded_v_rels" USING btree ("path");
  CREATE INDEX "_sal_ded_v_rels_internal_media_id_idx" ON "_sal_ded_v_rels" USING btree ("internal_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sal_ded_rels" CASCADE;
  DROP TABLE "_sal_ded_v_rels" CASCADE;
  ALTER TABLE "workflow_steps" DROP COLUMN "can_attach";
  ALTER TABLE "workflow_steps" DROP COLUMN "can_generate_wordfile";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "can_attach";
  ALTER TABLE "sal_ded_workflow_reviews" DROP COLUMN "can_generate_wordfile";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "can_attach";
  ALTER TABLE "_sal_ded_v_version_workflow_reviews" DROP COLUMN "can_generate_wordfile";`)
}
