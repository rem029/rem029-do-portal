import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db: _db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  // No-op: snapshot resync after merging dev (TECH-0075 trip scheduling) into TECH-0107.
  // The trip-scheduling tables/enums and the merged payload_jobs task-slug values are already
  // created by dev's 20260920–20260928 migrations (ADD VALUE IF NOT EXISTS keeps the survey job
  // values). This exists only so this .json snapshot holds the full schema for the next diff.
}

export async function down({ db: _db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // No-op counterpart for snapshot resync.
}
