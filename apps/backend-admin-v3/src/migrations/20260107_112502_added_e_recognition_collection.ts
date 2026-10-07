import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "e_recognition" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"employee_id" varchar,
  	"staff_media_id" uuid,
  	"bg_media_id" uuid,
  	"content" jsonb,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "e_recognition_id" uuid;
  ALTER TABLE "e_recognition" ADD CONSTRAINT "e_recognition_staff_media_id_media_id_fk" FOREIGN KEY ("staff_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "e_recognition" ADD CONSTRAINT "e_recognition_bg_media_id_media_id_fk" FOREIGN KEY ("bg_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "e_recognition" ADD CONSTRAINT "e_recognition_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "e_recognition" ADD CONSTRAINT "e_recognition_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "e_recognition_title_idx" ON "e_recognition" USING btree ("title");
  CREATE INDEX "e_recognition_staff_media_idx" ON "e_recognition" USING btree ("staff_media_id");
  CREATE INDEX "e_recognition_bg_media_idx" ON "e_recognition" USING btree ("bg_media_id");
  CREATE INDEX "e_recognition_created_by_idx" ON "e_recognition" USING btree ("created_by_id");
  CREATE INDEX "e_recognition_updated_by_idx" ON "e_recognition" USING btree ("updated_by_id");
  CREATE INDEX "e_recognition_updated_at_idx" ON "e_recognition" USING btree ("updated_at");
  CREATE INDEX "e_recognition_created_at_idx" ON "e_recognition" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_e_recognition_fk" FOREIGN KEY ("e_recognition_id") REFERENCES "public"."e_recognition"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_e_recognition_id_idx" ON "payload_locked_documents_rels" USING btree ("e_recognition_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "e_recognition" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "e_recognition" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_e_recognition_fk";
  
  DROP INDEX "payload_locked_documents_rels_e_recognition_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "e_recognition_id";`)
}
