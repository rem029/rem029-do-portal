import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_qa_field_types_select_multi" AS ENUM('red', 'green', 'blue');
  CREATE TYPE "public"."enum_qa_field_types_blocks_alert_block_level" AS ENUM('info', 'warning', 'error');
  CREATE TYPE "public"."enum_qa_field_types_select_single" AS ENUM('alpha', 'beta', 'gamma');
  CREATE TYPE "public"."enum_qa_field_types_radio_field" AS ENUM('choice_1', 'choice_2', 'choice_3');
  CREATE TABLE "qa_field_types_select_multi" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_qa_field_types_select_multi",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "qa_field_types_array_field" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_name" varchar,
  	"item_value" numeric
  );
  
  CREATE TABLE "qa_field_types_blocks_content_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "qa_field_types_blocks_alert_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" "enum_qa_field_types_blocks_alert_block_level" DEFAULT 'info',
  	"message" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "qa_field_types" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"textarea_field" varchar,
  	"email_field" varchar,
  	"number_field" numeric,
  	"date_field" timestamp(3) with time zone,
  	"checkbox_field" boolean DEFAULT true,
  	"select_single" "enum_qa_field_types_select_single" DEFAULT 'alpha',
  	"radio_field" "enum_qa_field_types_radio_field" DEFAULT 'choice_1',
  	"relationship_single_id" uuid,
  	"parent_id" uuid,
  	"rich_text_field" jsonb,
  	"upload_field_id" uuid,
  	"code_field" varchar,
  	"json_field" jsonb,
  	"group_field_group_text_1" varchar,
  	"group_field_group_text_2" varchar,
  	"row_col_1" varchar,
  	"row_col_2" varchar,
  	"collapsible_field_1" varchar,
  	"collapsible_field_2" varchar,
  	"tab_alpha_text" varchar,
  	"tab_beta_notes" varchar,
  	"operator_id" uuid NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"slug" varchar NOT NULL,
  	"operator_slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "qa_field_types_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"departments_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "qa_field_types_id" uuid;
  ALTER TABLE "qa_field_types_select_multi" ADD CONSTRAINT "qa_field_types_select_multi_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "qa_field_types_array_field" ADD CONSTRAINT "qa_field_types_array_field_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "qa_field_types_blocks_content_block" ADD CONSTRAINT "qa_field_types_blocks_content_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "qa_field_types_blocks_alert_block" ADD CONSTRAINT "qa_field_types_blocks_alert_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_relationship_single_id_departments_id_fk" FOREIGN KEY ("relationship_single_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_parent_id_qa_field_types_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_upload_field_id_media_id_fk" FOREIGN KEY ("upload_field_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types" ADD CONSTRAINT "qa_field_types_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "qa_field_types_rels" ADD CONSTRAINT "qa_field_types_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "qa_field_types_rels" ADD CONSTRAINT "qa_field_types_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "qa_field_types_select_multi_order_idx" ON "qa_field_types_select_multi" USING btree ("order");
  CREATE INDEX "qa_field_types_select_multi_parent_idx" ON "qa_field_types_select_multi" USING btree ("parent_id");
  CREATE INDEX "qa_field_types_array_field_order_idx" ON "qa_field_types_array_field" USING btree ("_order");
  CREATE INDEX "qa_field_types_array_field_parent_id_idx" ON "qa_field_types_array_field" USING btree ("_parent_id");
  CREATE INDEX "qa_field_types_blocks_content_block_order_idx" ON "qa_field_types_blocks_content_block" USING btree ("_order");
  CREATE INDEX "qa_field_types_blocks_content_block_parent_id_idx" ON "qa_field_types_blocks_content_block" USING btree ("_parent_id");
  CREATE INDEX "qa_field_types_blocks_content_block_path_idx" ON "qa_field_types_blocks_content_block" USING btree ("_path");
  CREATE INDEX "qa_field_types_blocks_alert_block_order_idx" ON "qa_field_types_blocks_alert_block" USING btree ("_order");
  CREATE INDEX "qa_field_types_blocks_alert_block_parent_id_idx" ON "qa_field_types_blocks_alert_block" USING btree ("_parent_id");
  CREATE INDEX "qa_field_types_blocks_alert_block_path_idx" ON "qa_field_types_blocks_alert_block" USING btree ("_path");
  CREATE INDEX "qa_field_types_relationship_single_idx" ON "qa_field_types" USING btree ("relationship_single_id");
  CREATE INDEX "qa_field_types_parent_idx" ON "qa_field_types" USING btree ("parent_id");
  CREATE INDEX "qa_field_types_upload_field_idx" ON "qa_field_types" USING btree ("upload_field_id");
  CREATE INDEX "qa_field_types_operator_idx" ON "qa_field_types" USING btree ("operator_id");
  CREATE INDEX "qa_field_types_created_by_idx" ON "qa_field_types" USING btree ("created_by_id");
  CREATE INDEX "qa_field_types_updated_by_idx" ON "qa_field_types" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX "qa_field_types_operator_slug_idx" ON "qa_field_types" USING btree ("operator_slug");
  CREATE INDEX "qa_field_types_updated_at_idx" ON "qa_field_types" USING btree ("updated_at");
  CREATE INDEX "qa_field_types_created_at_idx" ON "qa_field_types" USING btree ("created_at");
  CREATE INDEX "qa_field_types_rels_order_idx" ON "qa_field_types_rels" USING btree ("order");
  CREATE INDEX "qa_field_types_rels_parent_idx" ON "qa_field_types_rels" USING btree ("parent_id");
  CREATE INDEX "qa_field_types_rels_path_idx" ON "qa_field_types_rels" USING btree ("path");
  CREATE INDEX "qa_field_types_rels_departments_id_idx" ON "qa_field_types_rels" USING btree ("departments_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_qa_field_types_fk" FOREIGN KEY ("qa_field_types_id") REFERENCES "public"."qa_field_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_qa_field_types_id_idx" ON "payload_locked_documents_rels" USING btree ("qa_field_types_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "qa_field_types_select_multi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "qa_field_types_array_field" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "qa_field_types_blocks_content_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "qa_field_types_blocks_alert_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "qa_field_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "qa_field_types_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "qa_field_types_select_multi" CASCADE;
  DROP TABLE "qa_field_types_array_field" CASCADE;
  DROP TABLE "qa_field_types_blocks_content_block" CASCADE;
  DROP TABLE "qa_field_types_blocks_alert_block" CASCADE;
  DROP TABLE "qa_field_types" CASCADE;
  DROP TABLE "qa_field_types_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_qa_field_types_fk";
  
  DROP INDEX "payload_locked_documents_rels_qa_field_types_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "qa_field_types_id";
  DROP TYPE "public"."enum_qa_field_types_select_multi";
  DROP TYPE "public"."enum_qa_field_types_blocks_alert_block_level";
  DROP TYPE "public"."enum_qa_field_types_select_single";
  DROP TYPE "public"."enum_qa_field_types_radio_field";`)
}
