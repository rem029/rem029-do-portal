import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // No-op: Branch-local snapshot resync after merging dev (8f7929dc).
  // The database already contains the DocuSign global tables (payload_docusign,
  // payload_docusign_texts for allowed_origins, enum_payload_docusign_environment) from
  // dev's 20260921 migrations. This migration exists solely to align the local
  // snapshot chain with the full schema so subsequent migrations diff cleanly.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // No-op counterpart for snapshot resync.
}
