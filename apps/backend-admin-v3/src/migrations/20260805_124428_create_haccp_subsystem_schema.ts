import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_haccp_personal_hygiene_entries_hair" AS ENUM('Short', 'Long');
  CREATE TYPE "public"."enum_haccp_personal_hygiene_entries_nails" AS ENUM('Short', 'Long');
  CREATE TYPE "public"."enum_haccp_personal_hygiene_entries_uniform" AS ENUM('Clean', 'Dirty');
  CREATE TYPE "public"."enum_haccp_personal_hygiene_entries_shoes" AS ENUM('Clean', 'Dirty');
  CREATE TYPE "public"."enum_haccp_personal_hygiene_status" AS ENUM('Draft', 'Pending HIC Verification', 'Verified');
  CREATE TABLE "outlets" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "haccp_personal_hygiene_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"staff_name" varchar NOT NULL,
  	"hair" "enum_haccp_personal_hygiene_entries_hair" NOT NULL,
  	"nails" "enum_haccp_personal_hygiene_entries_nails" NOT NULL,
  	"uniform" "enum_haccp_personal_hygiene_entries_uniform" NOT NULL,
  	"shoes" "enum_haccp_personal_hygiene_entries_shoes" NOT NULL,
  	"jewellery" boolean DEFAULT false,
  	"symptoms_of_sick" boolean DEFAULT false,
  	"medical_card" boolean DEFAULT true,
  	"remark" varchar
  );
  
  CREATE TABLE "haccp_personal_hygiene" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"outlet_id" uuid NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_haccp_personal_hygiene_status" DEFAULT 'Draft' NOT NULL,
  	"checked_by_id" uuid,
  	"verified_by_id" uuid,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "haccp_settings_outlet_assignments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"outlet_id" uuid NOT NULL,
  	"pic_email" varchar NOT NULL,
  	"hic_email" varchar NOT NULL
  );
  
  CREATE TABLE "haccp_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"default_hygiene_in_charge_id" uuid,
  	"enable_email_alerts" boolean DEFAULT true,
  	"escalation_email" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "outlets_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "haccp_personal_hygiene_id" uuid;
  ALTER TABLE "outlets" ADD CONSTRAINT "outlets_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outlets" ADD CONSTRAINT "outlets_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene_entries" ADD CONSTRAINT "haccp_personal_hygiene_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_personal_hygiene"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_checked_by_id_users_id_fk" FOREIGN KEY ("checked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_settings_outlet_assignments" ADD CONSTRAINT "haccp_settings_outlet_assignments_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_settings_outlet_assignments" ADD CONSTRAINT "haccp_settings_outlet_assignments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."haccp_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_default_hygiene_in_charge_id_users_id_fk" FOREIGN KEY ("default_hygiene_in_charge_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "haccp_settings" ADD CONSTRAINT "haccp_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "outlets_name_idx" ON "outlets" USING btree ("name");
  CREATE INDEX "outlets_created_by_idx" ON "outlets" USING btree ("created_by_id");
  CREATE INDEX "outlets_updated_by_idx" ON "outlets" USING btree ("updated_by_id");
  CREATE INDEX "outlets_updated_at_idx" ON "outlets" USING btree ("updated_at");
  CREATE INDEX "outlets_created_at_idx" ON "outlets" USING btree ("created_at");
  CREATE INDEX "haccp_personal_hygiene_entries_order_idx" ON "haccp_personal_hygiene_entries" USING btree ("_order");
  CREATE INDEX "haccp_personal_hygiene_entries_parent_id_idx" ON "haccp_personal_hygiene_entries" USING btree ("_parent_id");
  CREATE INDEX "haccp_personal_hygiene_outlet_idx" ON "haccp_personal_hygiene" USING btree ("outlet_id");
  CREATE INDEX "haccp_personal_hygiene_checked_by_idx" ON "haccp_personal_hygiene" USING btree ("checked_by_id");
  CREATE INDEX "haccp_personal_hygiene_verified_by_idx" ON "haccp_personal_hygiene" USING btree ("verified_by_id");
  CREATE INDEX "haccp_personal_hygiene_created_by_idx" ON "haccp_personal_hygiene" USING btree ("created_by_id");
  CREATE INDEX "haccp_personal_hygiene_updated_by_idx" ON "haccp_personal_hygiene" USING btree ("updated_by_id");
  CREATE INDEX "haccp_personal_hygiene_updated_at_idx" ON "haccp_personal_hygiene" USING btree ("updated_at");
  CREATE INDEX "haccp_personal_hygiene_created_at_idx" ON "haccp_personal_hygiene" USING btree ("created_at");
  CREATE INDEX "haccp_settings_outlet_assignments_order_idx" ON "haccp_settings_outlet_assignments" USING btree ("_order");
  CREATE INDEX "haccp_settings_outlet_assignments_parent_id_idx" ON "haccp_settings_outlet_assignments" USING btree ("_parent_id");
  CREATE INDEX "haccp_settings_outlet_assignments_outlet_idx" ON "haccp_settings_outlet_assignments" USING btree ("outlet_id");
  CREATE INDEX "haccp_settings_default_hygiene_in_charge_idx" ON "haccp_settings" USING btree ("default_hygiene_in_charge_id");
  CREATE INDEX "haccp_settings_created_by_idx" ON "haccp_settings" USING btree ("created_by_id");
  CREATE INDEX "haccp_settings_updated_by_idx" ON "haccp_settings" USING btree ("updated_by_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outlets_fk" FOREIGN KEY ("outlets_id") REFERENCES "public"."outlets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_haccp_personal_hygiene_fk" FOREIGN KEY ("haccp_personal_hygiene_id") REFERENCES "public"."haccp_personal_hygiene"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_outlets_id_idx" ON "payload_locked_documents_rels" USING btree ("outlets_id");
  CREATE INDEX "payload_locked_documents_rels_haccp_personal_hygiene_id_idx" ON "payload_locked_documents_rels" USING btree ("haccp_personal_hygiene_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "outlets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "haccp_personal_hygiene_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "haccp_personal_hygiene" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "haccp_settings_outlet_assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "haccp_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "outlets" CASCADE;
  DROP TABLE "haccp_personal_hygiene_entries" CASCADE;
  DROP TABLE "haccp_personal_hygiene" CASCADE;
  DROP TABLE "haccp_settings_outlet_assignments" CASCADE;
  DROP TABLE "haccp_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_outlets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_haccp_personal_hygiene_fk";
  
  DROP INDEX "payload_locked_documents_rels_outlets_id_idx";
  DROP INDEX "payload_locked_documents_rels_haccp_personal_hygiene_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "outlets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "haccp_personal_hygiene_id";
  DROP TYPE "public"."enum_haccp_personal_hygiene_entries_hair";
  DROP TYPE "public"."enum_haccp_personal_hygiene_entries_nails";
  DROP TYPE "public"."enum_haccp_personal_hygiene_entries_uniform";
  DROP TYPE "public"."enum_haccp_personal_hygiene_entries_shoes";
  DROP TYPE "public"."enum_haccp_personal_hygiene_status";`)
}
