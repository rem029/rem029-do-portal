import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_analytics_event_type" AS ENUM('page_view', 'click', 'form_submission', 'error', 'video_started', 'video_ended');
  CREATE TABLE "analytics" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"event_type" "enum_analytics_event_type" NOT NULL,
  	"path" varchar NOT NULL,
  	"element_id" varchar,
  	"referrer" varchar,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"additional_data" jsonb,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_id" uuid;
  ALTER TABLE "analytics" ADD CONSTRAINT "analytics_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "analytics" ADD CONSTRAINT "analytics_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "analytics_created_by_idx" ON "analytics" USING btree ("created_by_id");
  CREATE INDEX "analytics_updated_by_idx" ON "analytics" USING btree ("updated_by_id");
  CREATE INDEX "analytics_updated_at_idx" ON "analytics" USING btree ("updated_at");
  CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_fk" FOREIGN KEY ("analytics_id") REFERENCES "public"."analytics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_id";
  DROP TYPE "public"."enum_analytics_event_type";`)
}
