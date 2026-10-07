import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_survey_invitations_status" AS ENUM('pending', 'sent', 'responded', 'error');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE TABLE IF NOT EXISTS "survey_invitations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"form_id" uuid NOT NULL,
  	"email" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_survey_invitations_status" DEFAULT 'pending',
  	"error_message" varchar,
  	"sent_at" timestamp(3) with time zone,
  	"responded_at" timestamp(3) with time zone,
  	"operator_id" uuid NOT NULL,
  	"operator_slug" varchar,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "survey_invitations_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_survey_invitations_fk" FOREIGN KEY ("survey_invitations_id") REFERENCES "public"."survey_invitations"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "survey_invitations_form_idx" ON "survey_invitations" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "survey_invitations_code_idx" ON "survey_invitations" USING btree ("code");
  CREATE INDEX IF NOT EXISTS "survey_invitations_operator_idx" ON "survey_invitations" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "survey_invitations_created_by_idx" ON "survey_invitations" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "survey_invitations_updated_by_idx" ON "survey_invitations" USING btree ("updated_by_id");
  CREATE INDEX IF NOT EXISTS "survey_invitations_updated_at_idx" ON "survey_invitations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "survey_invitations_created_at_idx" ON "survey_invitations" USING btree ("created_at");
  -- Compound uniqueness: the same code may legitimately exist under different forms, so this
  -- is a (form, code) compound unique index — never a bare unique index on "code" alone.
  CREATE UNIQUE INDEX IF NOT EXISTS "form_code_idx" ON "survey_invitations" USING btree ("form_id","code");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_survey_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("survey_invitations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "survey_invitations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "survey_invitations" CASCADE;

  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_survey_invitations_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_survey_invitations_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "survey_invitations_id";

  DROP TYPE IF EXISTS "public"."enum_survey_invitations_status";`)
}
