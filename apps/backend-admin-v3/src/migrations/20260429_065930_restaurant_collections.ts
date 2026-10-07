import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_restaurants_status" AS ENUM('draft', 'published');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
     CREATE TYPE "public"."enum__restaurants_v_version_status" AS ENUM('draft', 'published');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;
   
   DO $$ BEGIN
     CREATE TYPE "public"."enum__restaurants_v_published_locale" AS ENUM('en', 'ar', 'fr');
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;

  CREATE TABLE IF NOT EXISTS "restaurants" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"operator_id" uuid,
  	"header_image_id" uuid,
  	"logo_id" uuid,
  	"description" jsonb,
  	"created_by_id" uuid,
  	"updated_by_id" uuid,
  	"slug" varchar,
  	"operator_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_restaurants_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "_restaurants_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_operator_id" uuid,
  	"version_header_image_id" uuid,
  	"version_logo_id" uuid,
  	"version_description" jsonb,
  	"version_created_by_id" uuid,
  	"version_updated_by_id" uuid,
  	"version_slug" varchar,
  	"version_operator_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__restaurants_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__restaurants_v_published_locale",
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "restaurants_id" uuid;

  DO $$ BEGIN
    ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_header_image_id_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_parent_id_restaurants_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_operator_id_operators_id_fk" FOREIGN KEY ("version_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_header_image_id_media_id_fk" FOREIGN KEY ("version_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "restaurants_operator_idx" ON "restaurants" USING btree ("operator_id");
  CREATE INDEX IF NOT EXISTS "restaurants_header_image_idx" ON "restaurants" USING btree ("header_image_id");
  CREATE INDEX IF NOT EXISTS "restaurants_logo_idx" ON "restaurants" USING btree ("logo_id");
  CREATE INDEX IF NOT EXISTS "restaurants_created_by_idx" ON "restaurants" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "restaurants_updated_by_idx" ON "restaurants" USING btree ("updated_by_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_operator_slug_idx" ON "restaurants" USING btree ("operator_slug");
  CREATE INDEX IF NOT EXISTS "restaurants_updated_at_idx" ON "restaurants" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "restaurants__status_idx" ON "restaurants" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_parent_idx" ON "_restaurants_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_operator_idx" ON "_restaurants_v" USING btree ("version_operator_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_header_image_idx" ON "_restaurants_v" USING btree ("version_header_image_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_logo_idx" ON "_restaurants_v" USING btree ("version_logo_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_created_by_idx" ON "_restaurants_v" USING btree ("version_created_by_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_updated_by_idx" ON "_restaurants_v" USING btree ("version_updated_by_id");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_operator_slug_idx" ON "_restaurants_v" USING btree ("version_operator_slug");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_updated_at_idx" ON "_restaurants_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version_created_at_idx" ON "_restaurants_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_version_version__status_idx" ON "_restaurants_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_created_at_idx" ON "_restaurants_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_updated_at_idx" ON "_restaurants_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_snapshot_idx" ON "_restaurants_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_published_locale_idx" ON "_restaurants_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_restaurants_v_latest_idx" ON "_restaurants_v" USING btree ("latest");

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_restaurants_id_idx" ON "payload_locked_documents_rels" USING btree ("restaurants_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "restaurants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_restaurants_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "restaurants" CASCADE;
  DROP TABLE IF EXISTS "_restaurants_v" CASCADE;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_restaurants_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_restaurants_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "restaurants_id";
  DROP TYPE IF EXISTS "public"."enum_restaurants_status";
  DROP TYPE IF EXISTS "public"."enum__restaurants_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__restaurants_v_published_locale";`)
}
