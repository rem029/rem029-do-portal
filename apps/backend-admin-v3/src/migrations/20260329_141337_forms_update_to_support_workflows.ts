import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_form_submissions_workflow_reviews_response') THEN
      CREATE TYPE "public"."enum_form_submissions_workflow_reviews_response" AS ENUM('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_form_submissions_workflow_status') THEN
      CREATE TYPE "public"."enum_form_submissions_workflow_status" AS ENUM('draft', 'in_review', 'completed', 'rejected');
    END IF;
   END $$;

   CREATE TABLE IF NOT EXISTS "forms_media" (
   	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
   	"alt" varchar NOT NULL,
   	"created_by_id" uuid,
   	"updated_by_id" uuid,
   	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
   	"url" varchar,
   	"thumbnail_u_r_l" varchar,
   	"filename" varchar,
   	"mime_type" varchar,
   	"filesize" numeric,
   	"width" numeric,
   	"height" numeric,
   	"focal_x" numeric,
   	"focal_y" numeric
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
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_payment_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_date" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"width" numeric,
   	"required" boolean,
   	"default_value" timestamp(3) with time zone,
   	"block_name" varchar
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_date_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_file" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"width" numeric,
   	"required" boolean DEFAULT false,
   	"block_name" varchar
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_file_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_group" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"width" numeric,
   	"required" boolean DEFAULT false,
   	"block_name" varchar
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_group_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_list" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"_path" text NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"name" varchar NOT NULL,
   	"width" numeric,
   	"required" boolean DEFAULT false,
   	"block_name" varchar
   );
   
   CREATE TABLE IF NOT EXISTS "forms_blocks_list_locales" (
   	"label" varchar,
   	"id" serial PRIMARY KEY NOT NULL,
   	"_locale" "_locales" NOT NULL,
   	"_parent_id" varchar NOT NULL
   );
   
   CREATE TABLE IF NOT EXISTS "form_submissions_workflow_reviews" (
   	"_order" integer NOT NULL,
   	"_parent_id" uuid NOT NULL,
   	"id" varchar PRIMARY KEY NOT NULL,
   	"label" varchar,
   	"comments" varchar,
   	"reviewer" varchar,
   	"status_slug" varchar,
   	"response" "enum_form_submissions_workflow_reviews_response",
   	"reviewed_by" varchar,
   	"reviewed_at" timestamp(3) with time zone,
   	"signature" varchar,
   	"token" varchar,
   	"approver_type" varchar,
   	"can_acknowledge" boolean DEFAULT false,
   	"can_approve" boolean DEFAULT true,
   	"can_reject" boolean DEFAULT true,
   	"can_attach" boolean DEFAULT false,
   	"can_generate_wordfile" boolean DEFAULT false,
   	"acknowledge_label" varchar DEFAULT 'Acknowledge',
   	"approve_label" varchar DEFAULT 'Approve',
   	"reject_label" varchar DEFAULT 'Reject'
   );
   
   CREATE TABLE IF NOT EXISTS "form_submissions_rels" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"order" integer,
   	"parent_id" uuid NOT NULL,
   	"path" varchar NOT NULL,
   	"internal_media_id" uuid
   );
   
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "has_terms" boolean DEFAULT false;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "terms_content" jsonb;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "show_sequence_number" boolean DEFAULT true;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "requires_auth" boolean DEFAULT false;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "required_access" varchar;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "enable_workflow" boolean DEFAULT false;
   ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "workflow_slug" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_field" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_status" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_amount" numeric;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_payment_processor" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_token" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_brand" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "payment_credit_card_number" varchar;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "workflow_status" "enum_form_submissions_workflow_status" DEFAULT 'draft';
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "_workflow_status" varchar DEFAULT 'draft';
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "operator_id" uuid;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "created_by_id" uuid;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "updated_by_id" uuid;
   ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "previous_submission_id" uuid;
   ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "forms_media_id" uuid;

   DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_media_created_by_id_users_id_fk') THEN
      ALTER TABLE "forms_media" ADD CONSTRAINT "forms_media_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_media_updated_by_id_users_id_fk') THEN
      ALTER TABLE "forms_media" ADD CONSTRAINT "forms_media_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_price_conditions_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment_price_conditions" ADD CONSTRAINT "forms_blocks_payment_price_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_payment"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment" ADD CONSTRAINT "forms_blocks_payment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_payment_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_payment_locales" ADD CONSTRAINT "forms_blocks_payment_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_payment"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_date_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_date" ADD CONSTRAINT "forms_blocks_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_date_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_date_locales" ADD CONSTRAINT "forms_blocks_date_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_date"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_file_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_file" ADD CONSTRAINT "forms_blocks_file_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_file_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_file_locales" ADD CONSTRAINT "forms_blocks_file_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_file"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_group_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_group" ADD CONSTRAINT "forms_blocks_group_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_group_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_group_locales" ADD CONSTRAINT "forms_blocks_group_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_group"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_list_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_list" ADD CONSTRAINT "forms_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forms_blocks_list_locales_parent_id_fk') THEN
      ALTER TABLE "forms_blocks_list_locales" ADD CONSTRAINT "forms_blocks_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_list"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_workflow_reviews_parent_id_fk') THEN
      ALTER TABLE "form_submissions_workflow_reviews" ADD CONSTRAINT "form_submissions_workflow_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_rels_parent_fk') THEN
      ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_rels_internal_media_fk') THEN
      ALTER TABLE "form_submissions_rels" ADD CONSTRAINT "form_submissions_rels_internal_media_fk" FOREIGN KEY ("internal_media_id") REFERENCES "public"."internal_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_operator_id_operators_id_fk') THEN
   	  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_created_by_id_users_id_fk') THEN
      ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_updated_by_id_users_id_fk') THEN
      ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_submissions_previous_submission_id_form_submissions_id_fk') THEN
      ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_previous_submission_id_form_submissions_id_fk" FOREIGN KEY ("previous_submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_forms_media_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_media_fk" FOREIGN KEY ("forms_media_id") REFERENCES "public"."forms_media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
   END $$;

   CREATE INDEX IF NOT EXISTS "forms_media_created_by_idx" ON "forms_media" USING btree ("created_by_id");
   CREATE INDEX IF NOT EXISTS "forms_media_updated_by_idx" ON "forms_media" USING btree ("updated_by_id");
   CREATE INDEX IF NOT EXISTS "forms_media_updated_at_idx" ON "forms_media" USING btree ("updated_at");
   CREATE INDEX IF NOT EXISTS "forms_media_created_at_idx" ON "forms_media" USING btree ("created_at");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_media_filename_idx" ON "forms_media" USING btree ("filename");
   CREATE INDEX IF NOT EXISTS "forms_blocks_payment_price_conditions_order_idx" ON "forms_blocks_payment_price_conditions" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_payment_price_conditions_parent_id_idx" ON "forms_blocks_payment_price_conditions" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_payment_order_idx" ON "forms_blocks_payment" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_payment_parent_id_idx" ON "forms_blocks_payment" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_payment_path_idx" ON "forms_blocks_payment" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_payment_locales_locale_parent_id_unique" ON "forms_blocks_payment_locales" USING btree ("_locale","_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_date_order_idx" ON "forms_blocks_date" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_date_parent_id_idx" ON "forms_blocks_date" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_date_path_idx" ON "forms_blocks_date" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_date_locales_locale_parent_id_unique" ON "forms_blocks_date_locales" USING btree ("_locale","_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_file_order_idx" ON "forms_blocks_file" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_file_parent_id_idx" ON "forms_blocks_file" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_file_path_idx" ON "forms_blocks_file" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_file_locales_locale_parent_id_unique" ON "forms_blocks_file_locales" USING btree ("_locale","_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_group_order_idx" ON "forms_blocks_group" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_group_parent_id_idx" ON "forms_blocks_group" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_group_path_idx" ON "forms_blocks_group" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_group_locales_locale_parent_id_unique" ON "forms_blocks_group_locales" USING btree ("_locale","_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_list_order_idx" ON "forms_blocks_list" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "forms_blocks_list_parent_id_idx" ON "forms_blocks_list" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "forms_blocks_list_path_idx" ON "forms_blocks_list" USING btree ("_path");
   CREATE UNIQUE INDEX IF NOT EXISTS "forms_blocks_list_locales_locale_parent_id_unique" ON "forms_blocks_list_locales" USING btree ("_locale","_parent_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_workflow_reviews_order_idx" ON "form_submissions_workflow_reviews" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "form_submissions_workflow_reviews_parent_id_idx" ON "form_submissions_workflow_reviews" USING btree ("_parent_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_rels_order_idx" ON "form_submissions_rels" USING btree ("order");
   CREATE INDEX IF NOT EXISTS "form_submissions_rels_parent_idx" ON "form_submissions_rels" USING btree ("parent_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_rels_path_idx" ON "form_submissions_rels" USING btree ("path");
   CREATE INDEX IF NOT EXISTS "form_submissions_rels_internal_media_id_idx" ON "form_submissions_rels" USING btree ("internal_media_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_operator_idx" ON "form_submissions" USING btree ("operator_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_created_by_idx" ON "form_submissions" USING btree ("created_by_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_updated_by_idx" ON "form_submissions" USING btree ("updated_by_id");
   CREATE INDEX IF NOT EXISTS "form_submissions_previous_submission_idx" ON "form_submissions" USING btree ("previous_submission_id");
   CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_forms_media_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "forms_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_payment_price_conditions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_payment" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_payment_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_date" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_date_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_file" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_file_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_group" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_group_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "forms_blocks_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "form_submissions_workflow_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "form_submissions_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "forms_media" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_payment_price_conditions" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_payment" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_payment_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_date" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_date_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_file" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_file_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_group" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_group_locales" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_list" CASCADE;
  DROP TABLE IF EXISTS "forms_blocks_list_locales" CASCADE;
  DROP TABLE IF EXISTS "form_submissions_workflow_reviews" CASCADE;
  DROP TABLE IF EXISTS "form_submissions_rels" CASCADE;
  ALTER TABLE IF EXISTS "form_submissions" DROP CONSTRAINT IF EXISTS "form_submissions_operator_id_operators_id_fk";
  ALTER TABLE IF EXISTS "form_submissions" DROP CONSTRAINT IF EXISTS "form_submissions_created_by_id_users_id_fk";
  ALTER TABLE IF EXISTS "form_submissions" DROP CONSTRAINT IF EXISTS "form_submissions_updated_by_id_users_id_fk";
  ALTER TABLE IF EXISTS "form_submissions" DROP CONSTRAINT IF EXISTS "form_submissions_previous_submission_id_form_submissions_id_fk";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_forms_media_fk";
  
  DROP INDEX IF EXISTS "form_submissions_operator_idx";
  DROP INDEX IF EXISTS "form_submissions_created_by_idx";
  DROP INDEX IF EXISTS "form_submissions_updated_by_idx";
  DROP INDEX IF EXISTS "form_submissions_previous_submission_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_forms_media_id_idx";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "has_terms";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "terms_content";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "show_sequence_number";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "requires_auth";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "required_access";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "enable_workflow";
  ALTER TABLE IF EXISTS "forms" DROP COLUMN IF EXISTS "workflow_slug";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_field";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_status";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_amount";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_payment_processor";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_token";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_brand";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "payment_credit_card_number";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "workflow_status";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "_workflow_status";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "operator_id";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "created_by_id";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "updated_by_id";
  ALTER TABLE IF EXISTS "form_submissions" DROP COLUMN IF EXISTS "previous_submission_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "forms_media_id";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_condition";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_operator";
  DROP TYPE IF EXISTS "public"."enum_forms_blocks_payment_price_conditions_value_type";
  DROP TYPE IF EXISTS "public"."enum_form_submissions_workflow_reviews_response";
  DROP TYPE IF EXISTS "public"."enum_form_submissions_workflow_status";`)
}
