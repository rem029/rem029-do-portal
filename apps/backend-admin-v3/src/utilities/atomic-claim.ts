import type { Payload } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { SQL } from '@payloadcms/db-postgres/drizzle'

// Runs one conditional `UPDATE ... WHERE ... RETURNING` and returns the claimed rows. Unlike
// payload.update({ where }) — a find followed by an update by id — a single statement lets only one
// concurrent caller win. It bypasses Payload hooks and access, so keep claims to bookkeeping columns.
// The base adapter type has no `drizzle`, hence the cast.
export async function runAtomicClaim<Row extends Record<string, unknown>>(
  payload: Payload,
  statement: SQL,
): Promise<Row[]> {
  const result = await (payload.db as unknown as PostgresAdapter).drizzle.execute(statement)
  return result.rows as Row[]
}
