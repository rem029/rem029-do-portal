import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_docusign_envelopes_recipients_role" AS ENUM('signer', 'approver', 'cc');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_docusign_envelopes_status" AS ENUM('created', 'sent', 'delivered', 'completed', 'declined', 'voided');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "docusign_envelopes_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"role" "enum_docusign_envelopes_recipients_role" NOT NULL,
  	"routing_order" numeric NOT NULL,
  	"status" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "docusign_envelopes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"docusign_envelope_id" varchar NOT NULL,
  	"document_name" varchar NOT NULL,
  	"email_subject" varchar,
  	"requested_by_id" uuid NOT NULL,
  	"status" "enum_docusign_envelopes_status" DEFAULT 'created',
  	"status_changed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "docusign_envelopes_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "docusign_envelopes_recipients" ADD CONSTRAINT "docusign_envelopes_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."docusign_envelopes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "docusign_envelopes" ADD CONSTRAINT "docusign_envelopes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "docusign_envelopes" ADD CONSTRAINT "docusign_envelopes_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "docusign_envelopes" ADD CONSTRAINT "docusign_envelopes_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "docusign_envelopes_recipients_order_idx" ON "docusign_envelopes_recipients" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_recipients_parent_id_idx" ON "docusign_envelopes_recipients" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_created_by_idx" ON "docusign_envelopes" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_updated_by_idx" ON "docusign_envelopes" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "docusign_envelopes_docusign_envelope_id_idx" ON "docusign_envelopes" USING btree ("docusign_envelope_id");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_requested_by_idx" ON "docusign_envelopes" USING btree ("requested_by_id");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_updated_at_idx" ON "docusign_envelopes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "docusign_envelopes_created_at_idx" ON "docusign_envelopes" USING btree ("created_at");

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_docusign_envelopes_fk" FOREIGN KEY ("docusign_envelopes_id") REFERENCES "public"."docusign_envelopes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_docusign_envelopes_id_idx" ON "payload_locked_documents_rels" USING btree ("docusign_envelopes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "docusign_envelopes_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "docusign_envelopes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "docusign_envelopes_recipients" CASCADE;
  DROP TABLE IF EXISTS "docusign_envelopes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_docusign_envelopes_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_docusign_envelopes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "docusign_envelopes_id";
  DROP TYPE IF EXISTS "public"."enum_docusign_envelopes_recipients_role";
  DROP TYPE IF EXISTS "public"."enum_docusign_envelopes_status";`)
}
