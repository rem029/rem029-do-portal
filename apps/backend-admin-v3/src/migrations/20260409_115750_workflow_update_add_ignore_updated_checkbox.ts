import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ 
    BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='alt') THEN
            ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_media' AND column_name='alt') THEN
            ALTER TABLE "internal_media" ALTER COLUMN "alt" DROP NOT NULL;
        END IF;
    END $$;
    
    ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "notify_originator_on_approval" boolean DEFAULT false;
    ALTER TABLE "workflow_steps" ADD COLUMN IF NOT EXISTS "ignore_future_notifications" boolean DEFAULT false;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ 
    BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='alt') THEN
            ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_media' AND column_name='alt') THEN
            ALTER TABLE "internal_media" ALTER COLUMN "alt" SET NOT NULL;
        END IF;
    END $$;

    ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "notify_originator_on_approval";
    ALTER TABLE "workflow_steps" DROP COLUMN IF EXISTS "ignore_future_notifications";
  `)
}
