import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The FAQ content that was hardcoded in app/(frontend)/trip-scheduling/faq/page.tsx, seeded once so the
// page isn't empty after deploy. Only inserted while the faqs table is empty, so admin edits are never overwritten.
const DEFAULT_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'How far in advance do I need to submit a vehicle booking request?',
    answer:
      'Requests should ideally be submitted at least 24 hours prior to your intended departure time to ensure vehicle and driver availability. For urgent or same-day transport requests, please contact the dispatch team directly after submitting your form.',
  },
  {
    question: 'Can I request transportation for a group or multi-passenger trip?',
    answer:
      'Yes. When completing the Vehicle Booking form, specify the total number of passengers and any special luggage or equipment requirements in the trip details section so the appropriate vehicle type can be assigned.',
  },
  {
    question: 'How will I know when my transport request is confirmed?',
    answer:
      "Once your supervisor or department head approves the booking, the transport team will assign a vehicle and driver. You will receive an automated notification with your driver's contact details and pick-up confirmation.",
  },
  {
    question: 'What should I do if I need to modify or cancel my trip?',
    answer:
      'You can update or cancel your request directly through your booking dashboard prior to dispatch. If the driver is already en route, please contact the transport desk immediately to prevent unnecessary dispatch.',
  },
  {
    question: 'What are the standard operational hours for internal transport services?',
    answer:
      'Standard shuttle and scheduled transport services operate daily from 6:00 AM to 10:00 PM. On-call or emergency transport outside these hours requires prior approval from department management.',
  },
  {
    question: 'Are inter-site or off-property transfers supported?',
    answer:
      'Yes, transport can be requested between designated property zones, staff accommodation sites, and off-site operational destinations within the local area. Select your origin and destination zones from the dropdown list on the booking page.',
  },
  {
    question: 'Where can I view real-time shuttle timings and route maps?',
    answer:
      'You can view all upcoming shuttle departure times, pick-up/drop-off locations, and route schedules directly on the Transport Schedule page. Select your designated zone or route to see the complete timetable for today.',
  },
  {
    question: 'How often are the shuttle schedules updated?',
    answer:
      'Route timetables are updated in real-time to reflect seasonal operations, event shifts, or road adjustments. We recommend checking the live schedule on the page before heading to your designated shuttle pick-up point.',
  },
  {
    question: 'What should I do if a shuttle is running late or delayed?',
    answer:
      'Live status indicators on the schedule page will display any active delays or route changes. If a shuttle is delayed beyond 10 minutes past its scheduled departure, you can use the quick contact link on the schedule page to reach the transport dispatch desk directly.',
  },
  {
    question: 'Do I need to book a seat in advance for standard shuttle loops?',
    answer:
      'Regular operational shuttle loops do not require advance seat booking—boarding is on a first-come, first-served basis. However, if you are traveling with a large group during peak hours, submitting a vehicle request in advance is recommended.',
  },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "trip_scheduling_settings_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  ALTER TABLE "trip_scheduling_settings" ADD COLUMN IF NOT EXISTS "general_background_image_id" uuid;
  ALTER TABLE "trip_scheduling_settings" ADD COLUMN IF NOT EXISTS "landing_header_background_image_id" uuid;
  DO $$ BEGIN
   ALTER TABLE "trip_scheduling_settings_faqs" ADD CONSTRAINT "trip_scheduling_settings_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trip_scheduling_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "trip_scheduling_settings" ADD CONSTRAINT "trip_scheduling_settings_general_background_image_id_internal_media_id_fk" FOREIGN KEY ("general_background_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "trip_scheduling_settings" ADD CONSTRAINT "trip_scheduling_settings_landing_header_background_image_id_internal_media_id_fk" FOREIGN KEY ("landing_header_background_image_id") REFERENCES "public"."internal_media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_faqs_order_idx" ON "trip_scheduling_settings_faqs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_faqs_parent_id_idx" ON "trip_scheduling_settings_faqs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_general_background_image_idx" ON "trip_scheduling_settings" USING btree ("general_background_image_id");
  CREATE INDEX IF NOT EXISTS "trip_scheduling_settings_landing_header_background_image_idx" ON "trip_scheduling_settings" USING btree ("landing_header_background_image_id");`)

  // The global's row only exists once it has been saved; the faqs rows need it as their parent.
  await db.execute(sql`
  INSERT INTO "trip_scheduling_settings" ("created_at", "updated_at")
  SELECT now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM "trip_scheduling_settings");`)

  const rows = sql.join(
    DEFAULT_FAQS.map(
      (f, i) => sql`(${i + 1}::integer, ${f.question}::varchar, ${f.answer}::varchar)`,
    ),
    sql`, `,
  )
  await db.execute(sql`
  INSERT INTO "trip_scheduling_settings_faqs" ("_order", "_parent_id", "id", "question", "answer")
  SELECT v.ord, s.id, gen_random_uuid()::text, v.question, v.answer
  FROM (VALUES ${rows}) AS v(ord, question, answer)
  CROSS JOIN (SELECT "id" FROM "trip_scheduling_settings" ORDER BY "created_at" LIMIT 1) AS s
  WHERE NOT EXISTS (SELECT 1 FROM "trip_scheduling_settings_faqs");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "trip_scheduling_settings_faqs" CASCADE;
  ALTER TABLE "trip_scheduling_settings" DROP CONSTRAINT IF EXISTS "trip_scheduling_settings_general_background_image_id_internal_media_id_fk";
  ALTER TABLE "trip_scheduling_settings" DROP CONSTRAINT IF EXISTS "trip_scheduling_settings_landing_header_background_image_id_internal_media_id_fk";
  DROP INDEX IF EXISTS "trip_scheduling_settings_general_background_image_idx";
  DROP INDEX IF EXISTS "trip_scheduling_settings_landing_header_background_image_idx";
  ALTER TABLE "trip_scheduling_settings" DROP COLUMN IF EXISTS "general_background_image_id";
  ALTER TABLE "trip_scheduling_settings" DROP COLUMN IF EXISTS "landing_header_background_image_id";`)
}
