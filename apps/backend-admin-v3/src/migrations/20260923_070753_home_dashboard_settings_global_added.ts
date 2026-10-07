import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "home_dashboard_settings_dashboard_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "home_dashboard_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"show_new_dashboard" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DO $$ BEGIN
   ALTER TABLE "home_dashboard_settings_dashboard_items" ADD CONSTRAINT "home_dashboard_settings_dashboard_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_dashboard_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "home_dashboard_settings" ADD CONSTRAINT "home_dashboard_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "home_dashboard_settings" ADD CONSTRAINT "home_dashboard_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "home_dashboard_settings_dashboard_items_order_idx" ON "home_dashboard_settings_dashboard_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "home_dashboard_settings_dashboard_items_parent_id_idx" ON "home_dashboard_settings_dashboard_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "home_dashboard_settings_created_by_idx" ON "home_dashboard_settings" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "home_dashboard_settings_updated_by_idx" ON "home_dashboard_settings" USING btree ("updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "home_dashboard_settings_dashboard_items" CASCADE;
  DROP TABLE IF EXISTS "home_dashboard_settings" CASCADE;`)
}
