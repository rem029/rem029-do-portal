import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "hr_requests_settings_types" CASCADE;
  DROP TABLE "hr_requests_settings_allowed_requestors_on_behalf" CASCADE;
  DROP TABLE "hr_requests_settings" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "hr_requests_settings_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "hr_requests_settings_allowed_requestors_on_behalf" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "hr_requests_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_slug" varchar,
  	"cutoff_day" numeric DEFAULT 15 NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "hr_requests_settings_types" ADD CONSTRAINT "hr_requests_settings_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hr_requests_settings_allowed_requestors_on_behalf" ADD CONSTRAINT "hr_requests_settings_allowed_requestors_on_behalf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_requests_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hr_requests_settings" ADD CONSTRAINT "hr_requests_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_requests_settings" ADD CONSTRAINT "hr_requests_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hr_requests_settings_types_order_idx" ON "hr_requests_settings_types" USING btree ("_order");
  CREATE INDEX "hr_requests_settings_types_parent_id_idx" ON "hr_requests_settings_types" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hr_requests_settings_types_slug_idx" ON "hr_requests_settings_types" USING btree ("slug");
  CREATE INDEX "hr_requests_settings_allowed_requestors_on_behalf_order_idx" ON "hr_requests_settings_allowed_requestors_on_behalf" USING btree ("_order");
  CREATE INDEX "hr_requests_settings_allowed_requestors_on_behalf_parent_id_idx" ON "hr_requests_settings_allowed_requestors_on_behalf" USING btree ("_parent_id");
  CREATE INDEX "hr_requests_settings_created_by_idx" ON "hr_requests_settings" USING btree ("created_by_id");
  CREATE INDEX "hr_requests_settings_updated_by_idx" ON "hr_requests_settings" USING btree ("updated_by_id");`)
}
