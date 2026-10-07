import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // No-op: Branch-local snapshot resync after merging dev (21829935).
  // The database already contains all FnB, orders, tables, and staff tables from
  // earlier branch migrations. This migration exists solely to align the local
  // snapshot chain with the full schema so subsequent migrations diff cleanly.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // No-op counterpart for snapshot resync.
}
