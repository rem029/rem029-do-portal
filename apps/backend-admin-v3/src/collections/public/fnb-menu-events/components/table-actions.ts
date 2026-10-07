'use server'

import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { randomUUID } from 'crypto'
import { slugify } from 'payload/shared'
import { assertCanEditEventMenu } from './actions'
import { relId } from './helpers'

export type TableRow = {
  id: string
  label: string
  seatCount: number
}

export type ListTablesResult =
  | { success: true; data: TableRow[] }
  | { success: false; error: string }

export type CreateTableResult =
  | { success: true; data: TableRow }
  | { success: false; error: string }

export type UpdateTableResult =
  | { success: true; data: TableRow }
  | { success: false; error: string }

export type CreateTableInput = {
  label: string
  seatCount: number
}

export type UpdateTableInput = {
  tableId: string
  label: string
  seatCount: number
}

/**
 * Lists all tables belonging to the venue of the given event.
 */
export async function listTablesAction(eventId: string): Promise<ListTablesResult> {
  try {
    if (!eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(payload, headersList, eventId)

    const { docs } = await payload.find({
      collection: 'tables',
      where: {
        restaurant: {
          equals: restaurantId,
        },
      },
      sort: 'label',
      depth: 0,
      limit: 500,
      draft: true,
      overrideAccess: true,
    })

    const rows: TableRow[] = docs.map((doc) => ({
      id: String(doc.id),
      label: doc.label,
      seatCount: doc.seat_count,
    }))

    return { success: true, data: rows }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tables.',
    }
  }
}

/**
 * Creates a table for the event's venue, with automatic slug generation and collision retry.
 */
export async function createTableAction(
  eventId: string,
  data: CreateTableInput,
): Promise<CreateTableResult> {
  try {
    if (!eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    const trimmedLabel = data.label?.trim()
    if (!trimmedLabel) {
      return { success: false, error: 'Table label is required.' }
    }

    const seatCount = data.seatCount
    if (typeof seatCount !== 'number' || !Number.isInteger(seatCount) || seatCount < 1) {
      return { success: false, error: 'Seat count must be a positive integer.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })
    const { operatorId, restaurantId } = await assertCanEditEventMenu(
      payload,
      headersList,
      eventId,
    )

    let slug = (slugify(trimmedLabel) || '').replace(/^[^a-z0-9]+/, '')
    if (!slug) {
      slug = `table-${Date.now()}`
    }

    let created
    try {
      created = await payload.create({
        collection: 'tables',
        // Structural cast: operator_slug is generated server-side via beforeValidate hook
        data: {
          operator: operatorId,
          restaurant: restaurantId,
          label: trimmedLabel,
          slug,
          seat_count: seatCount,
          _status: 'published',
        } as unknown as RequiredDataFromCollectionSlug<'tables'>,
        overrideAccess: true,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isCollision =
        errMsg.includes('unique') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('Slug') ||
        errMsg.includes('slug') ||
        errMsg.includes('23505')

      if (isCollision) {
        const fallbackSlug = `${slug}-${randomUUID().slice(0, 4)}`
        created = await payload.create({
          collection: 'tables',
          // Structural cast: operator_slug is generated server-side via beforeValidate hook
          data: {
            operator: operatorId,
            restaurant: restaurantId,
            label: trimmedLabel,
            slug: fallbackSlug,
            seat_count: seatCount,
            _status: 'published',
          } as unknown as RequiredDataFromCollectionSlug<'tables'>,
          overrideAccess: true,
        })
      } else {
        throw err
      }
    }

    return {
      success: true,
      data: {
        id: String(created.id),
        label: created.label,
        seatCount: created.seat_count,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create table.',
    }
  }
}

/**
 * Updates a table's label and seat count. Preserves slug so existing QR codes don't break.
 */
export async function updateTableAction(
  eventId: string,
  data: UpdateTableInput,
): Promise<UpdateTableResult> {
  try {
    const { tableId } = data

    if (!eventId) {
      return { success: false, error: 'An event must be saved first.' }
    }

    if (!tableId) {
      return { success: false, error: 'Table ID is required.' }
    }

    const trimmedLabel = data.label?.trim()
    if (!trimmedLabel) {
      return { success: false, error: 'Table label is required.' }
    }

    const seatCount = data.seatCount
    if (typeof seatCount !== 'number' || !Number.isInteger(seatCount) || seatCount < 1) {
      return { success: false, error: 'Seat count must be a positive integer.' }
    }

    const headersList = await headers()
    const payload = await getPayload({ config })
    const { restaurantId } = await assertCanEditEventMenu(payload, headersList, eventId)

    let table
    try {
      table = await payload.findByID({
        collection: 'tables',
        id: tableId,
        depth: 0,
        overrideAccess: true,
        draft: true,
      })
    } catch {
      // Handled below
    }

    if (!table) {
      return { success: false, error: 'Table not found.' }
    }

    if (relId(table.restaurant) !== restaurantId) {
      return { success: false, error: 'Table not found for this venue.' }
    }

    const updated = await payload.update({
      collection: 'tables',
      id: tableId,
      data: {
        label: trimmedLabel,
        seat_count: seatCount,
      },
      overrideAccess: true,
      draft: false,
    })

    return {
      success: true,
      data: {
        id: String(updated.id),
        label: updated.label,
        seatCount: updated.seat_count,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update table.',
    }
  }
}
