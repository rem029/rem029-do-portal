import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_menu_items_modifier_groups_input_type" AS ENUM('checkbox', 'radio');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    CREATE TYPE "public"."enum__menu_items_v_version_modifier_groups_input_type" AS ENUM('checkbox', 'radio');
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE TABLE IF NOT EXISTS "menu_items_modifier_groups_options" (
   	"_order" integer NOT NULL,
   	"_parent_id" varchar NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"label" varchar
   );

   CREATE TABLE IF NOT EXISTS "menu_items_modifier_groups" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar,
   	"input_type" "enum_menu_items_modifier_groups_input_type" DEFAULT 'checkbox',
   	"required" boolean DEFAULT false
   );

   CREATE TABLE IF NOT EXISTS "_menu_items_v_version_modifier_groups_options" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
   	"label" varchar,
   	"_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "_menu_items_v_version_modifier_groups" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
   	"name" varchar,
   	"input_type" "enum__menu_items_v_version_modifier_groups_input_type" DEFAULT 'checkbox',
   	"required" boolean DEFAULT false,
   	"_uuid" varchar
   );

   CREATE TABLE IF NOT EXISTS "orders_items_selected_modifiers" (
   	"_order" integer NOT NULL,
   	"_parent_id" varchar NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"group_name" varchar NOT NULL
   );

   CREATE TABLE IF NOT EXISTS "orders_texts" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"order" integer NOT NULL,
   	"parent_id" uuid NOT NULL,
   	"path" varchar NOT NULL,
   	"text" varchar
   );

   DO $$ BEGIN
    ALTER TABLE "menu_items_modifier_groups_options" ADD CONSTRAINT "menu_items_modifier_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items_modifier_groups"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    ALTER TABLE "menu_items_modifier_groups" ADD CONSTRAINT "menu_items_modifier_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    ALTER TABLE "_menu_items_v_version_modifier_groups_options" ADD CONSTRAINT "_menu_items_v_version_modifier_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_items_v_version_modifier_groups"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    ALTER TABLE "_menu_items_v_version_modifier_groups" ADD CONSTRAINT "_menu_items_v_version_modifier_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_menu_items_v"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    ALTER TABLE "orders_items_selected_modifiers" ADD CONSTRAINT "orders_items_selected_modifiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_items"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;
   DO $$ BEGIN
    ALTER TABLE "orders_texts" ADD CONSTRAINT "orders_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   CREATE INDEX IF NOT EXISTS "menu_items_modifier_groups_options_order_idx" ON "menu_items_modifier_groups_options" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "menu_items_modifier_groups_options_parent_id_idx" ON "menu_items_modifier_groups_options" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "menu_items_modifier_groups_order_idx" ON "menu_items_modifier_groups" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "menu_items_modifier_groups_parent_id_idx" ON "menu_items_modifier_groups" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_options_order_idx" ON "_menu_items_v_version_modifier_groups_options" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_options_parent_id_idx" ON "_menu_items_v_version_modifier_groups_options" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_order_idx" ON "_menu_items_v_version_modifier_groups" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "_menu_items_v_version_modifier_groups_parent_id_idx" ON "_menu_items_v_version_modifier_groups" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "orders_items_selected_modifiers_order_idx" ON "orders_items_selected_modifiers" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "orders_items_selected_modifiers_parent_id_idx" ON "orders_items_selected_modifiers" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "orders_texts_order_parent" ON "orders_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "menu_items_modifier_groups_options" CASCADE;
   DROP TABLE IF EXISTS "menu_items_modifier_groups" CASCADE;
   DROP TABLE IF EXISTS "_menu_items_v_version_modifier_groups_options" CASCADE;
   DROP TABLE IF EXISTS "_menu_items_v_version_modifier_groups" CASCADE;
   DROP TABLE IF EXISTS "orders_items_selected_modifiers" CASCADE;
   DROP TABLE IF EXISTS "orders_texts" CASCADE;
   DROP TYPE IF EXISTS "public"."enum_menu_items_modifier_groups_input_type";
   DROP TYPE IF EXISTS "public"."enum__menu_items_v_version_modifier_groups_input_type";`)
}
