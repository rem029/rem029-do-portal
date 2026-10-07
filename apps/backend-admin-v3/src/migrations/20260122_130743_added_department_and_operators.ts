import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_departments_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__departments_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__departments_v_published_locale" AS ENUM('en', 'ar', 'fr');
  CREATE TABLE "departments_sub_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"manager_name" varchar,
  	"manager_email" varchar
  );
  
  CREATE TABLE "departments" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"operator_id" uuid,
  	"manager_name" varchar,
  	"manager_email" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_departments_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_departments_v_version_sub_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"manager_name" varchar,
  	"manager_email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_departments_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_operator_id" uuid,
  	"version_manager_name" varchar,
  	"version_manager_email" varchar,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__departments_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__departments_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "operators" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"super_user" boolean DEFAULT false,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "full_name" varchar DEFAULT '';
  ALTER TABLE "users" ADD COLUMN "designation" varchar DEFAULT '';
  ALTER TABLE "users" ADD COLUMN "operator_id" uuid;
  ALTER TABLE "users" ADD COLUMN "department_id" uuid;
  ALTER TABLE "users" ADD COLUMN "created_by_id" uuid;
  ALTER TABLE "users" ADD COLUMN "updated_by_id" uuid;
  ALTER TABLE "users_access" ADD COLUMN "created_by_id" uuid;
  ALTER TABLE "users_access" ADD COLUMN "updated_by_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "departments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "operators_id" uuid;
  ALTER TABLE "departments_sub_departments" ADD CONSTRAINT "departments_sub_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "departments" ADD CONSTRAINT "departments_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_departments_v_version_sub_departments" ADD CONSTRAINT "_departments_v_version_sub_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_departments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_departments_v" ADD CONSTRAINT "_departments_v_parent_id_departments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_departments_v" ADD CONSTRAINT "_departments_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_departments_v" ADD CONSTRAINT "_departments_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_departments_v" ADD CONSTRAINT "_departments_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators" ADD CONSTRAINT "operators_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators" ADD CONSTRAINT "operators_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "departments_sub_departments_order_idx" ON "departments_sub_departments" USING btree ("_order");
  CREATE INDEX "departments_sub_departments_parent_id_idx" ON "departments_sub_departments" USING btree ("_parent_id");
  CREATE INDEX "departments_operator_idx" ON "departments" USING btree ("operator_id");
  CREATE INDEX "departments_created_by_idx" ON "departments" USING btree ("created_by_id");
  CREATE INDEX "departments_updated_by_idx" ON "departments" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX "departments_operator_slug_idx" ON "departments" USING btree ("operator_slug");
  CREATE INDEX "departments_updated_at_idx" ON "departments" USING btree ("updated_at");
  CREATE INDEX "departments_created_at_idx" ON "departments" USING btree ("created_at");
  CREATE INDEX "departments__status_idx" ON "departments" USING btree ("_status");
  CREATE INDEX "_departments_v_version_sub_departments_order_idx" ON "_departments_v_version_sub_departments" USING btree ("_order");
  CREATE INDEX "_departments_v_version_sub_departments_parent_id_idx" ON "_departments_v_version_sub_departments" USING btree ("_parent_id");
  CREATE INDEX "_departments_v_parent_idx" ON "_departments_v" USING btree ("parent_id");
  CREATE INDEX "_departments_v_version_version_operator_idx" ON "_departments_v" USING btree ("version_operator_id");
  CREATE INDEX "_departments_v_version_version_created_by_idx" ON "_departments_v" USING btree ("version_created_by_id");
  CREATE INDEX "_departments_v_version_version_updated_by_idx" ON "_departments_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_departments_v_version_version_operator_slug_idx" ON "_departments_v" USING btree ("version_operator_slug");
  CREATE INDEX "_departments_v_version_version_updated_at_idx" ON "_departments_v" USING btree ("version_updated_at");
  CREATE INDEX "_departments_v_version_version_created_at_idx" ON "_departments_v" USING btree ("version_created_at");
  CREATE INDEX "_departments_v_version_version__status_idx" ON "_departments_v" USING btree ("version__status");
  CREATE INDEX "_departments_v_created_at_idx" ON "_departments_v" USING btree ("created_at");
  CREATE INDEX "_departments_v_updated_at_idx" ON "_departments_v" USING btree ("updated_at");
  CREATE INDEX "_departments_v_snapshot_idx" ON "_departments_v" USING btree ("snapshot");
  CREATE INDEX "_departments_v_published_locale_idx" ON "_departments_v" USING btree ("published_locale");
  CREATE INDEX "_departments_v_latest_idx" ON "_departments_v" USING btree ("latest");
  CREATE UNIQUE INDEX "operators_slug_idx" ON "operators" USING btree ("slug");
  CREATE INDEX "operators_created_by_idx" ON "operators" USING btree ("created_by_id");
  CREATE INDEX "operators_updated_by_idx" ON "operators" USING btree ("updated_by_id");
  CREATE INDEX "operators_updated_at_idx" ON "operators" USING btree ("updated_at");
  CREATE INDEX "operators_created_at_idx" ON "operators" USING btree ("created_at");
  ALTER TABLE "users" ADD CONSTRAINT "users_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_access" ADD CONSTRAINT "users_access_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_access" ADD CONSTRAINT "users_access_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_departments_fk" FOREIGN KEY ("departments_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_operators_fk" FOREIGN KEY ("operators_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_operator_idx" ON "users" USING btree ("operator_id");
  CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");
  CREATE INDEX "users_created_by_idx" ON "users" USING btree ("created_by_id");
  CREATE INDEX "users_updated_by_idx" ON "users" USING btree ("updated_by_id");
  CREATE INDEX "users_access_created_by_idx" ON "users_access" USING btree ("created_by_id");
  CREATE INDEX "users_access_updated_by_idx" ON "users_access" USING btree ("updated_by_id");
  CREATE INDEX "payload_locked_documents_rels_departments_id_idx" ON "payload_locked_documents_rels" USING btree ("departments_id");
  CREATE INDEX "payload_locked_documents_rels_operators_id_idx" ON "payload_locked_documents_rels" USING btree ("operators_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "departments_sub_departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_departments_v_version_sub_departments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_departments_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "operators" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "departments_sub_departments" CASCADE;
  DROP TABLE "departments" CASCADE;
  DROP TABLE "_departments_v_version_sub_departments" CASCADE;
  DROP TABLE "_departments_v" CASCADE;
  DROP TABLE "operators" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_operator_id_operators_id_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_department_id_departments_id_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_created_by_id_users_id_fk";
  
  ALTER TABLE "users" DROP CONSTRAINT "users_updated_by_id_users_id_fk";
  
  ALTER TABLE "users_access" DROP CONSTRAINT "users_access_created_by_id_users_id_fk";
  
  ALTER TABLE "users_access" DROP CONSTRAINT "users_access_updated_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_departments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_operators_fk";
  
  DROP INDEX "users_operator_idx";
  DROP INDEX "users_department_idx";
  DROP INDEX "users_created_by_idx";
  DROP INDEX "users_updated_by_idx";
  DROP INDEX "users_access_created_by_idx";
  DROP INDEX "users_access_updated_by_idx";
  DROP INDEX "payload_locked_documents_rels_departments_id_idx";
  DROP INDEX "payload_locked_documents_rels_operators_id_idx";
  ALTER TABLE "users" DROP COLUMN "full_name";
  ALTER TABLE "users" DROP COLUMN "designation";
  ALTER TABLE "users" DROP COLUMN "operator_id";
  ALTER TABLE "users" DROP COLUMN "department_id";
  ALTER TABLE "users" DROP COLUMN "created_by_id";
  ALTER TABLE "users" DROP COLUMN "updated_by_id";
  ALTER TABLE "users_access" DROP COLUMN "created_by_id";
  ALTER TABLE "users_access" DROP COLUMN "updated_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "departments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "operators_id";
  DROP TYPE "public"."enum_departments_status";
  DROP TYPE "public"."enum__departments_v_version_status";
  DROP TYPE "public"."enum__departments_v_published_locale";`)
}
