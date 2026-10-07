import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_checkbox_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_checkbox_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_country_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_country_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_email_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_email_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_number_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_number_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_select_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_select_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_text_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_text_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_textarea_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_textarea_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_radio_direction') THEN
      CREATE TYPE "public"."enum_forms_blocks_radio_direction" AS ENUM('column', 'row');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_radio_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_radio_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_date_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_date_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_file_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_file_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_signature_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_signature_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_phone_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_phone_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_group_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_group_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_list_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_list_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_conditional_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_conditional_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_select_restaurants_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_select_restaurants_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_select_operators_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_select_operators_variant" AS ENUM('default', 'label-on-top');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_time_variant') THEN
      CREATE TYPE "public"."enum_forms_blocks_time_variant" AS ENUM('default', 'label-on-top');
    END IF;
  END $$;

  DROP TABLE IF EXISTS "forms_blocks_payment_price_conditions" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_payment" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_payment_locales" CASCADE;

  ALTER TABLE "forms_blocks_checkbox" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_checkbox_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_country" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_country_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_email" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_email_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_number" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_number_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_select" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_select_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_text" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_text_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_textarea" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_textarea_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_date" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_date_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_radio" ADD COLUMN IF NOT EXISTS "direction" "enum_forms_blocks_radio_direction" DEFAULT 'column';
  ALTER TABLE "forms_blocks_radio" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_radio_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_file" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_file_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_signature" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_signature_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_phone" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_phone_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_group" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_group_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_list" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_list_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_conditional" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_conditional_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_select_restaurants" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_select_restaurants_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_select_operators" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_select_operators_variant" DEFAULT 'default';
  ALTER TABLE "forms_blocks_time" ADD COLUMN IF NOT EXISTS "variant" "enum_forms_blocks_time_variant" DEFAULT 'default';
  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "custom_css" varchar;

  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_field";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_status";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_amount";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_payment_processor";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_token";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_brand";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_number";

  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_condition";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_operator";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_value_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_payment_price_conditions_condition') THEN
      CREATE TYPE "public"."enum_forms_blocks_payment_price_conditions_condition" AS ENUM('hasValue', 'equals', 'notEquals');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_payment_price_conditions_operator') THEN
      CREATE TYPE "public"."enum_forms_blocks_payment_price_conditions_operator" AS ENUM('add', 'subtract', 'multiply', 'divide');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_forms_blocks_payment_price_conditions_value_type') THEN
      CREATE TYPE "public"."enum_forms_blocks_payment_price_conditions_value_type" AS ENUM('static', 'valueOfField');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "forms_blocks_payment" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"width" numeric,
  	"base_price" numeric,
  	"required" boolean,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_payment_price_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_to_use" varchar,
  	"condition" "enum_forms_blocks_payment_price_conditions_condition" DEFAULT 'hasValue',
  	"value_for_condition" varchar,
  	"operator" "enum_forms_blocks_payment_price_conditions_operator" DEFAULT 'add',
  	"value_type" "enum_forms_blocks_payment_price_conditions_value_type" DEFAULT 'static',
  	"value_for_operator" varchar
  );

  CREATE TABLE IF NOT EXISTS "forms_blocks_payment_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_field" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_status" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_amount" numeric;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_payment_processor" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_token" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_brand" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_number" varchar;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_price_conditions_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment_price_conditions" ADD CONSTRAINT "forms_blocks_payment_price_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_payment"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment" ADD CONSTRAINT "forms_blocks_payment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment_locales" ADD CONSTRAINT "forms_blocks_payment_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_payment"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "forms_blocks_payment_price_conditions_order_idx" ON "forms_blocks_payment_price_conditions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_payment_price_conditions_parent_id_idx" ON "forms_blocks_payment_price_conditions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_payment_order_idx" ON "forms_blocks_payment" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "forms_blocks_payment_parent_id_idx" ON "forms_blocks_payment" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_payment_path_idx" ON "forms_blocks_payment" USING btree ("_path");
  CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_payment_locales_locale_parent_id_unique" ON "forms_blocks_payment_locales" USING btree ("_locale","_parent_id");

  ALTER TABLE "forms_blocks_checkbox" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_country" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_email" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_number" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_select" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_text" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_textarea" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_radio" DROP COLUMN IF EXISTS "direction";
  ALTER TABLE "forms_blocks_radio" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_date" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_file" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_signature" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_phone" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_group" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_list" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_conditional" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_select_restaurants" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_select_operators" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms_blocks_time" DROP COLUMN IF EXISTS "variant";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "custom_css";

  DROP TYPE IF EXISTS "public"."enum_forms_blocks_checkbox_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_country_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_email_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_number_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_text_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_textarea_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_radio_direction";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_radio_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_date_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_file_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_signature_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_phone_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_group_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_list_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_conditional_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_restaurants_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_select_operators_variant";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_time_variant";`)
}
