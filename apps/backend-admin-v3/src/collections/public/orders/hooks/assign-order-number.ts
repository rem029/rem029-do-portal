import type { CollectionBeforeChangeHook } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { TIMEZONE } from '@/utilities/constant'

type OrderNumberRow = {
  order_number: number
  order_date: string
}

type PgExecutor = {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: OrderNumberRow[] }>
}

/**
 * Assigns a human-readable, daily-sequential order number per restaurant
 * (1, 2, 3... resetting each day at midnight in the `TIMEZONE` constant -
 * currently Asia/Qatar. If this system is ever served in another country, the
 * day boundary is driven entirely by that one constant; make it per-operator /
 * per-restaurant here if a single deployment needs multiple local days.
 *
 * Atomicity:
 * A single atomic UPDATE ... RETURNING statement against the restaurant row handles
 * both same-day incrementing and day rollover. Postgres row locking on the restaurant
 * row serialises concurrent callers, preventing race conditions or duplicate numbers
 * without requiring read-then-write application logic.
 *
 * Note on drafts/versions:
 * The UPDATE modifies the published restaurant row directly. If an admin restores an
 * older version of a restaurant, Payload may write back the older counter value, which
 * could cause order numbers to repeat for that restaurant.
 */
export const assignOrderNumber: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data
  if (data?.order_number) return data

  const restaurantId =
    typeof data?.restaurant === 'object' ? data.restaurant?.id : data?.restaurant
  if (!restaurantId) return data

  try {
    // Prefer the request's transaction session so counter bump and order insert
    // commit/rollback together; fall back to the base drizzle client.
    // Payload types transactionID as `string | number | Promise<...>`, so await it.
    const transactionId = await req.transactionID
    const db =
      (transactionId != null && req.payload.db.sessions?.[transactionId]?.db) ||
      req.payload.db.drizzle

    if (!db) {
      req.payload.logger.error('Database client unavailable in assignOrderNumber hook')
      return data
    }

    // Drizzle transaction / client union has divergent signatures in Payload's types,
    // so cast to PgExecutor to access node-postgres execute.
    const executor = db as unknown as PgExecutor

    // `${TIMEZONE}` binds as a parameter (AT TIME ZONE accepts a text expression),
    // so this stays injection-safe even though the value is app-supplied.
    const result = await executor.execute(sql`
      UPDATE restaurants
      SET last_order_number = CASE
            WHEN last_order_number_date = (now() AT TIME ZONE ${TIMEZONE})::date
              THEN last_order_number + 1
            ELSE 1
          END,
          last_order_number_date = (now() AT TIME ZONE ${TIMEZONE})::date
      WHERE id = ${restaurantId}
      RETURNING last_order_number AS order_number,
                to_char(last_order_number_date, 'YYYY-MM-DD') AS order_date;
    `)

    const row = result?.rows?.[0]

    if (row?.order_number != null) {
      data.order_number = row.order_number
      data.order_date = row.order_date
    } else {
      // Bad or missing restaurant row in DB
      req.payload.logger.error(
        `Failed to assign order number: restaurant ${restaurantId} not found or update returned no rows`,
      )
    }
  } catch (err) {
    // Never throw - an order without a number is better than a failed submission
    req.payload.logger.error(`Error in assignOrderNumber hook: ${err}`)
  }

  return data
}
