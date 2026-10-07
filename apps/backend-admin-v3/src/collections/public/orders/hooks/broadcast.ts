import type { CollectionAfterChangeHook } from 'payload'
import type { Order } from '@/payload-types'
import { publishOrderEvent } from '@/realtime/order-events'

export const broadcastOrderUpdate =
  (collectionSlug: string): CollectionAfterChangeHook =>
  async ({ doc, operation, req: { payload } }) => {
    const restaurantId = typeof doc.restaurant === 'object' ? doc.restaurant?.id : doc.restaurant

    if (!restaurantId) return doc

    try {
      publishOrderEvent({
        type: operation === 'create' ? 'order:new' : 'order:update',
        restaurantId,
        orderingSlug: (doc as Order).ordering_slug ?? null,
        orderingCollection: (doc as Order).ordering_collection ?? null,
        order: doc as Order,
      })
    } catch (err) {
      payload.logger.error(`Error broadcasting ${collectionSlug} event: ${err}`)
    }

    return doc
  }
