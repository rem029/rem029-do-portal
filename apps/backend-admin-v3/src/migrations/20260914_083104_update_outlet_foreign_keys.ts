import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ 
    BEGIN
      -- 1. haccp_personal_hygiene
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_personal_hygiene') THEN
        ALTER TABLE "haccp_personal_hygiene" 
        DROP CONSTRAINT IF EXISTS "haccp_personal_hygiene_outlet_id_outlets_id_fk";

        ALTER TABLE "haccp_personal_hygiene" 
        ADD CONSTRAINT "haccp_personal_hygiene_outlet_id_outlets_id_fk" 
        FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") 
        ON DELETE CASCADE ON UPDATE no action;
      END IF;

      -- 2. haccp_buffet_temperature
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_buffet_temperature') THEN
        ALTER TABLE "haccp_buffet_temperature" 
        DROP CONSTRAINT IF EXISTS "haccp_buffet_temperature_outlet_id_outlets_id_fk";

        ALTER TABLE "haccp_buffet_temperature" 
        ADD CONSTRAINT "haccp_buffet_temperature_outlet_id_outlets_id_fk" 
        FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") 
        ON DELETE CASCADE ON UPDATE no action;
      END IF;

      -- 3. haccp_dishwashing_temperature
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_dishwashing_temperature') THEN
        ALTER TABLE "haccp_dishwashing_temperature" 
        DROP CONSTRAINT IF EXISTS "haccp_dishwashing_temperature_outlet_id_outlets_id_fk";

        ALTER TABLE "haccp_dishwashing_temperature" 
        ADD CONSTRAINT "haccp_dishwashing_temperature_outlet_id_outlets_id_fk" 
        FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") 
        ON DELETE CASCADE ON UPDATE no action;
      END IF;

      -- 4. haccp_outlet_settings
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_outlet_settings') THEN
        ALTER TABLE "haccp_outlet_settings" 
        DROP CONSTRAINT IF EXISTS "haccp_outlet_settings_outlet_id_outlets_id_fk";

        ALTER TABLE "haccp_outlet_settings" 
        ADD CONSTRAINT "haccp_outlet_settings_outlet_id_outlets_id_fk" 
        FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") 
        ON DELETE CASCADE ON UPDATE no action;
      END IF;

      -- 5. haccp_checklists
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_checklists') THEN
        ALTER TABLE "haccp_checklists" 
        DROP CONSTRAINT IF EXISTS "haccp_checklists_outlet_id_outlets_id_fk";

        ALTER TABLE "haccp_checklists" 
        ADD CONSTRAINT "haccp_checklists_outlet_id_outlets_id_fk" 
        FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") 
        ON DELETE CASCADE ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_personal_hygiene') THEN
        ALTER TABLE "haccp_personal_hygiene" DROP CONSTRAINT IF EXISTS "haccp_personal_hygiene_outlet_id_outlets_id_fk";
        ALTER TABLE "haccp_personal_hygiene" ADD CONSTRAINT "haccp_personal_hygiene_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE SET NULL ON UPDATE no action;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_buffet_temperature') THEN
        ALTER TABLE "haccp_buffet_temperature" DROP CONSTRAINT IF EXISTS "haccp_buffet_temperature_outlet_id_outlets_id_fk";
        ALTER TABLE "haccp_buffet_temperature" ADD CONSTRAINT "haccp_buffet_temperature_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE SET NULL ON UPDATE no action;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_dishwashing_temperature') THEN
        ALTER TABLE "haccp_dishwashing_temperature" DROP CONSTRAINT IF EXISTS "haccp_dishwashing_temperature_outlet_id_outlets_id_fk";
        ALTER TABLE "haccp_dishwashing_temperature" ADD CONSTRAINT "haccp_dishwashing_temperature_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE SET NULL ON UPDATE no action;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_outlet_settings') THEN
        ALTER TABLE "haccp_outlet_settings" DROP CONSTRAINT IF EXISTS "haccp_outlet_settings_outlet_id_outlets_id_fk";
        ALTER TABLE "haccp_outlet_settings" ADD CONSTRAINT "haccp_outlet_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE SET NULL ON UPDATE no action;
      END IF;

      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'haccp_checklists') THEN
        ALTER TABLE "haccp_checklists" DROP CONSTRAINT IF EXISTS "haccp_checklists_outlet_id_outlets_id_fk";
        ALTER TABLE "haccp_checklists" ADD CONSTRAINT "haccp_checklists_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE SET NULL ON UPDATE no action;
      END IF;
    END $$;
  `)
}