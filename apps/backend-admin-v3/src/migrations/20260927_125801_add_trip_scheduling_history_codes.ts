import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "trip_scheduling_history_codes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"email" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"consumed_at" timestamp(3) with time zone,
  	"session_token_hash" varchar,
  	"session_expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "trip_scheduling_history_codes_id" uuid;
  CREATE INDEX IF NOT EXISTS "trip_scheduling_history_codes_email_idx" ON "trip_scheduling_history_codes" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_history_codes_expires_at_idx" ON "trip_scheduling_history_codes" USING btree ("expires_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_history_codes_session_token_hash_idx" ON "trip_scheduling_history_codes" USING btree ("session_token_hash");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_history_codes_updated_at_idx" ON "trip_scheduling_history_codes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_history_codes_created_at_idx" ON "trip_scheduling_history_codes" USING btree ("created_at");
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trip_scheduling_history_cod_fk" FOREIGN KEY ("trip_scheduling_history_codes_id") REFERENCES "public"."trip_scheduling_history_codes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_trip_scheduling_history_co_idx" ON "payload_locked_documents_rels" USING btree ("trip_scheduling_history_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_trip_scheduling_history_cod_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_trip_scheduling_history_co_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trip_scheduling_history_codes_id";
  DROP TABLE IF EXISTS "trip_scheduling_history_codes" CASCADE;`)
}
