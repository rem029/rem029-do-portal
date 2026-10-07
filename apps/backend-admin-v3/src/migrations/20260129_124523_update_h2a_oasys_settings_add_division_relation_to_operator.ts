import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "h2a_oasys_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"operators_id" uuid
  );
  
  DROP TABLE "h2a_oasys_settings_divisions" CASCADE;
  ALTER TABLE "h2a_oasys_settings_rels" ADD CONSTRAINT "h2a_oasys_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."h2a_oasys_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "h2a_oasys_settings_rels" ADD CONSTRAINT "h2a_oasys_settings_rels_operators_fk" FOREIGN KEY ("operators_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "h2a_oasys_settings_rels_order_idx" ON "h2a_oasys_settings_rels" USING btree ("order");
  CREATE INDEX "h2a_oasys_settings_rels_parent_idx" ON "h2a_oasys_settings_rels" USING btree ("parent_id");
  CREATE INDEX "h2a_oasys_settings_rels_path_idx" ON "h2a_oasys_settings_rels" USING btree ("path");
  CREATE INDEX "h2a_oasys_settings_rels_operators_id_idx" ON "h2a_oasys_settings_rels" USING btree ("operators_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "h2a_oasys_settings_divisions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  DROP TABLE "h2a_oasys_settings_rels" CASCADE;
  ALTER TABLE "h2a_oasys_settings_divisions" ADD CONSTRAINT "h2a_oasys_settings_divisions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."h2a_oasys_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "h2a_oasys_settings_divisions_order_idx" ON "h2a_oasys_settings_divisions" USING btree ("_order");
  CREATE INDEX "h2a_oasys_settings_divisions_parent_id_idx" ON "h2a_oasys_settings_divisions" USING btree ("_parent_id");`)
}
