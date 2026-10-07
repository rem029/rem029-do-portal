import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_global_custom_fields_conditions_operator') THEN
      CREATE TYPE "public"."enum_workflow_global_custom_fields_conditions_operator" AS ENUM('equals', 'not_equals');
    END IF;
  END $$;
  
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_global_custom_fields_type') THEN
      CREATE TYPE "public"."enum_workflow_global_custom_fields_type" AS ENUM('text', 'number', 'select');
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_workflow_steps_custom_fields_conditions_operator') THEN
      CREATE TYPE "public"."enum_workflow_steps_custom_fields_conditions_operator" AS ENUM('equals', 'not_equals');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS "workflow_global_custom_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_global_custom_fields_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"operator" "enum_workflow_global_custom_fields_conditions_operator" DEFAULT 'equals',
  	"value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_global_custom_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"type" "enum_workflow_global_custom_fields_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"default_value" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_steps_selected_global_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_name" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "workflow_steps_custom_fields_conditions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"operator" "enum_workflow_steps_custom_fields_conditions_operator" DEFAULT 'equals',
  	"value" varchar
  );
  
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_global_custom_fields_options_parent_id_fk') THEN
      ALTER TABLE "workflow_global_custom_fields_options" ADD CONSTRAINT "workflow_global_custom_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_global_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_global_custom_fields_conditions_parent_id_fk') THEN
      ALTER TABLE "workflow_global_custom_fields_conditions" ADD CONSTRAINT "workflow_global_custom_fields_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_global_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_global_custom_fields_parent_id_fk') THEN
      ALTER TABLE "workflow_global_custom_fields" ADD CONSTRAINT "workflow_global_custom_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_steps_selected_global_fields_parent_id_fk') THEN
      ALTER TABLE "workflow_steps_selected_global_fields" ADD CONSTRAINT "workflow_steps_selected_global_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_steps"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_steps_custom_fields_conditions_parent_id_fk') THEN
      ALTER TABLE "workflow_steps_custom_fields_conditions" ADD CONSTRAINT "workflow_steps_custom_fields_conditions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workflow_steps_custom_fields"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_options_order_idx" ON "workflow_global_custom_fields_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_options_parent_id_idx" ON "workflow_global_custom_fields_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_conditions_order_idx" ON "workflow_global_custom_fields_conditions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_conditions_parent_id_idx" ON "workflow_global_custom_fields_conditions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_order_idx" ON "workflow_global_custom_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_global_custom_fields_parent_id_idx" ON "workflow_global_custom_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_steps_selected_global_fields_order_idx" ON "workflow_steps_selected_global_fields" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_steps_selected_global_fields_parent_id_idx" ON "workflow_steps_selected_global_fields" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_conditions_order_idx" ON "workflow_steps_custom_fields_conditions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "workflow_steps_custom_fields_conditions_parent_id_idx" ON "workflow_steps_custom_fields_conditions" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "workflow_global_custom_fields_options" CASCADE;
  DROP TABLE IF EXISTS "workflow_global_custom_fields_conditions" CASCADE;
  DROP TABLE IF EXISTS "workflow_global_custom_fields" CASCADE;
  DROP TABLE IF EXISTS "workflow_steps_selected_global_fields" CASCADE;
  DROP TABLE IF EXISTS "workflow_steps_custom_fields_conditions" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_workflow_global_custom_fields_conditions_operator";
  DROP TYPE IF EXISTS "public"."enum_workflow_global_custom_fields_type";
  DROP TYPE IF EXISTS "public"."enum_workflow_steps_custom_fields_conditions_operator";`)
}
