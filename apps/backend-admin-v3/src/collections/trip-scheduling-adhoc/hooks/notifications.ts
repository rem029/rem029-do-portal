import type { Payload } from 'payload'
import { TripSchedulingVehicle, Operator } from '@/payload-types'

// === Utility Functions ===
export async function getRelationshipName(
  ref: unknown,
  collection: 'trip-scheduling-vehicles' | 'operators',
  p: Payload,
): Promise<string> {
  try {
    if (!ref) return 'Not specified'

    // If the field is already populated by depth, immediately resolve it
    if (typeof ref === 'object' && ref !== null) {
      const refRecord = ref as Record<string, unknown>
      if ('name' in refRecord && typeof refRecord.name === 'string') return refRecord.name
      if ('title' in refRecord && typeof refRecord.title === 'string') return refRecord.title
    }

    const id =
      typeof ref === 'string' || typeof ref === 'number'
        ? ref
        : (ref as { id?: string | number } | null)?.id

    if (!id) return 'Not specified'

    // Bypass HTTP overhead by fetching raw document directly via Local API
    const doc = await p.findByID({
      collection: collection as 'trip-scheduling-vehicles' | 'operators',
      id: id as string,
      depth: 0,
    })

    if (!doc) return 'Not specified'

    if (collection === 'trip-scheduling-vehicles') {
      const vehicleDoc = doc as unknown as TripSchedulingVehicle
      return vehicleDoc.name || 'Not specified'
    } else {
      const operatorDoc = doc as unknown as Operator
      return operatorDoc.title || 'Not specified'
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    p.logger.warn(`[Relationship Fetch] Could not find ${collection} with ID: ${ref}: ${message}`)
    return 'Not specified'
  }
}
