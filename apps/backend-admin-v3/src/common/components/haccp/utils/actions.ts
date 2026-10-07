import { getPayload } from 'payload'
import config from '@payload-config'
import type { PayloadRequest } from 'payload'
// Import your generated collection types if needed, or use Payload's native types
import type {
  HaccpPersonalHygiene,
  HaccpDishwashingTemperature,
  HaccpBuffetTemperature,
  HaccpDryStore,
} from '@/payload-types'

// Define a union type of your known HACCP document shapes
type HaccpDocumentData =
  | Partial<HaccpPersonalHygiene>
  | Partial<HaccpDishwashingTemperature>
  | Partial<HaccpBuffetTemperature>
  | Partial<HaccpDryStore>

export async function saveHaccpDocument({
  collection,
  documentId,
  formData,
  req,
}: {
  collection:
    | 'haccp-personal-hygiene'
    | 'haccp-dishwashing-temperature'
    | 'haccp-buffet-temperature'
    | 'haccp-dry-store'
  documentId?: string
  formData: HaccpDocumentData
  req?: PayloadRequest
}) {
  'use server'
  const payloadInstance = await getPayload({ config })
  try {
    if (documentId && documentId !== 'create') {
      const updated = await payloadInstance.update({
        collection,
        id: documentId,
        data: formData as any, // Cast safely at the boundary if Payload's internal generic needs it
        req,
      })
      return { success: true, doc: updated }
    } else {
      const created = await payloadInstance.create({
        collection,
        data: formData as any,
        req,
      })
      return { success: true, doc: created }
    }
  } catch (error: any) {
    payloadInstance.logger.error(
      `--- [HACCP ACTION] Error saving to ${collection}: ${error.message}`,
    )
    return { success: false, error: error.message }
  }
}
