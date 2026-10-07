import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_fnb_event_staff_role" AS ENUM('waiter', 'boh', 'cashier');
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE TABLE IF NOT EXISTS "fnb_event_staff" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"operator_id" uuid NOT NULL,
  	"event_id" uuid NOT NULL,
  	"user_id" uuid NOT NULL,
  	"role" "enum_fnb_event_staff_role" NOT NULL,
  	"operator_slug" varchar NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "fnb_event_staff_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "fnb_event_staff" ADD CONSTRAINT "fnb_event_staff_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "fnb_event_staff" ADD CONSTRAINT "fnb_event_staff_event_id_fnb_menu_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fnb_menu_events"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "fnb_event_staff" ADD CONSTRAINT "fnb_event_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "fnb_event_staff" ADD CONSTRAINT "fnb_event_staff_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  DO $$ BEGIN
    ALTER TABLE "fnb_event_staff" ADD CONSTRAINT "fnb_event_staff_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "fnb_event_staff_operator_idx" ON "fnb_event_staff" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_event_idx" ON "fnb_event_staff" USING btree ("event_id");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_user_idx" ON "fnb_event_staff" USING btree ("user_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "fnb_event_staff_operator_slug_idx" ON "fnb_event_staff" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_created_by_idx" ON "fnb_event_staff" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_updated_by_idx" ON "fnb_event_staff" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_updated_at_idx" ON "fnb_event_staff" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "fnb_event_staff_created_at_idx" ON "fnb_event_staff" USING btree ("created_at");

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fnb_event_staff_fk" FOREIGN KEY ("fnb_event_staff_id") REFERENCES "public"."fnb_event_staff"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_fnb_event_staff_id_idx" ON "payload_locked_documents_rels" USING btree ("fnb_event_staff_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_fnb_event_staff_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_fnb_event_staff_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fnb_event_staff_id";
  DROP TABLE IF EXISTS "fnb_event_staff" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_fnb_event_staff_role";`)
}
