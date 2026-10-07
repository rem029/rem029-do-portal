import type { Payload, PayloadRequest } from 'payload'
import type { TripSchedulingZone } from '@/payload-types'
import { formatZoneLabel } from '@/utilities/trip-scheduling-zone-label'

// === Utility Functions ===
export async function getRelationshipName(
  ref: unknown,
  collection: 'trip-scheduling-vehicles' | 'operators',
  p: Payload,
): Promise<string> {
  try {
    if (!ref) return 'Not specified'

    if (typeof ref === 'object' && ref !== null) {
      if ('name' in ref) return String((ref as any).name)
      if ('title' in ref) return String((ref as any).title)
    }

    const id = typeof ref === 'string' ? ref : (ref as any)?.id
    if (!id) return 'Not specified'

    const doc = await p.findByID({
      collection: collection as any,
      id,
      depth: 0,
    })

    return (doc as any)?.name || (doc as any)?.title || 'Not specified'
  } catch (err) {
    p.logger.warn(`[Relationship Fetch] Could not find ${collection} with ID: ${ref}`)
    return 'Not specified'
  }
}

// A booking's zone, populated or by id. Null when unset or the zone no longer exists, so emails can omit the row.
export async function getZoneLabel(
  ref: string | TripSchedulingZone | null | undefined,
  p: Payload,
  req?: PayloadRequest,
): Promise<string | null> {
  if (!ref) return null
  if (typeof ref === 'object') return formatZoneLabel(ref)
  const zone = await p
    .findByID({ collection: 'trip-scheduling-zones', id: ref, depth: 0, req })
    .catch(() => null)
  return formatZoneLabel(zone)
}
