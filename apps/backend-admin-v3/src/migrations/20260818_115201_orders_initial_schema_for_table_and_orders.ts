import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
   CREATE TYPE "public"."enum_tables_status" AS ENUM('draft', 'published');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum__tables_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum__tables_v_published_locale" AS ENUM('en', 'ar', 'fr');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'confirmed', 'preparing', 'prepared', 'served', 'completed', 'cancelled');
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE TABLE IF NOT EXISTS "tables" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid,
  	"restaurant_id" uuid,
  	"label" varchar,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tables_status" DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS "_tables_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_operator_id" uuid,
  	"version_restaurant_id" uuid,
  	"version_label" varchar,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tables_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__tables_v_published_locale",
  	"latest" boolean
  );

  CREATE TABLE IF NOT EXISTS "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_id" uuid NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"price_at_order" numeric
  );

  CREATE TABLE IF NOT EXISTS "orders" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"restaurant_id" uuid NOT NULL,
  	"table_id" uuid NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"confirmed_at" timestamp(3) with time zone,
  	"preparing_at" timestamp(3) with time zone,
  	"prepared_at" timestamp(3) with time zone,
  	"served_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "waiter_panel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE IF NOT EXISTS "kitchen_panel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE IF NOT EXISTS "cashier_panel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "menu_pages" ADD COLUMN IF NOT EXISTS "c_ordering_enabled" boolean DEFAULT false;
  ALTER TABLE "_menu_pages_v" ADD COLUMN IF NOT EXISTS "version_c_ordering_enabled" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tables_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "orders_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "tables" ADD CONSTRAINT "tables_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "tables" ADD CONSTRAINT "tables_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "tables" ADD CONSTRAINT "tables_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_tables_v" ADD CONSTRAINT "_tables_v_parent_id_tables_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_tables_v" ADD CONSTRAINT "_tables_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_tables_v" ADD CONSTRAINT "_tables_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_tables_v" ADD CONSTRAINT "_tables_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_tables_v" ADD CONSTRAINT "_tables_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_item_id_menu_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "tables_operator_idx" ON "tables" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "tables_restaurant_idx" ON "tables" USING btree ("restaurant_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "tables_operator_slug_idx" ON "tables" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "tables_created_by_idx" ON "tables" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "tables_updated_by_idx" ON "tables" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "tables_updated_at_idx" ON "tables" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tables_created_at_idx" ON "tables" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "tables__status_idx" ON "tables" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_tables_v_parent_idx" ON "_tables_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_operator_idx" ON "_tables_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_restaurant_idx" ON "_tables_v" USING btree ("version_restaurant_id");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_operator_slug_idx" ON "_tables_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_created_by_idx" ON "_tables_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_updated_by_idx" ON "_tables_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_updated_at_idx" ON "_tables_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version_created_at_idx" ON "_tables_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_tables_v_version_version__status_idx" ON "_tables_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_tables_v_created_at_idx" ON "_tables_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_tables_v_updated_at_idx" ON "_tables_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_tables_v_snapshot_idx" ON "_tables_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_tables_v_published_locale_idx" ON "_tables_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_tables_v_latest_idx" ON "_tables_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_items_item_idx" ON "orders_items" USING btree ("item_id");
  CREATE INDEX IF NOT EXISTS "orders_restaurant_idx" ON "orders" USING btree ("restaurant_id");
  CREATE INDEX IF NOT EXISTS "orders_table_idx" ON "orders" USING btree ("table_id");
  CREATE INDEX IF NOT EXISTS "orders_created_by_idx" ON "orders" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "orders_updated_by_idx" ON "orders" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "tables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_tables_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "waiter_panel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "kitchen_panel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "cashier_panel" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "tables" CASCADE;
  DROP TABLE IF EXISTS "_tables_v" CASCADE;
  DROP TABLE IF EXISTS "orders_items" CASCADE;
  DROP TABLE IF EXISTS "orders" CASCADE;
  DROP TABLE IF EXISTS "waiter_panel" CASCADE;
  DROP TABLE IF EXISTS "kitchen_panel" CASCADE;
  DROP TABLE IF EXISTS "cashier_panel" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tables_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_tables_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "menu_pages" DROP COLUMN IF EXISTS "c_ordering_enabled";
  ALTER TABLE "_menu_pages_v" DROP COLUMN IF EXISTS "version_c_ordering_enabled";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tables_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "orders_id";
  DROP TYPE IF EXISTS "public"."enum_tables_status";
  DROP TYPE IF EXISTS "public"."enum__tables_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__tables_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_orders_status";`)
}
