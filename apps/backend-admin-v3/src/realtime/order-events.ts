import type { Order } from '@/payload-types'

export type OrderEventType = 'order:new' | 'order:update'

export type OrderEvent = {
  type: OrderEventType
  restaurantId: string
  // The menu-page / event slug the order was placed from (snapshotted on the
  // order). Optional so the existing restaurant stream keeps compiling and
  // ignoring it; the event stream route filters on it.
  orderingSlug?: string | null
  orderingCollection?: string | null
  order: Order
}

type Subscriber = (event: OrderEvent) => void

// Cached on globalThis so Next dev HMR doesn't create a second, orphaned
// subscriber set every time this module is re-evaluated.
const globalRef = globalThis as unknown as { __orderEventSubscribers?: Set<Subscriber> }
const subscribers = (globalRef.__orderEventSubscribers ??= new Set<Subscriber>())

/**
 * In-process pub/sub for order changes. The write (a server action calling
 * payload.update/create) and the reads (the SSE route handlers) all run in
 * this same Next.js process, so broadcasting the afterChange hook's own `doc`
 * directly is both simpler and more correct than round-tripping through
 * Postgres LISTEN/NOTIFY: there's no second database read that could race the
 * write's transaction commit (an earlier version of this file did exactly
 * that and briefly pushed a pre-update snapshot to connected clients).
 *
 * This does NOT fan out across multiple Next.js instances - it is in-memory,
 * per process. If this app is ever horizontally scaled behind a load
 * balancer, an update handled by instance A won't reach a stream held open by
 * instance B, and this needs to go back to a shared transport (Postgres
 * LISTEN/NOTIFY or Redis pub/sub).
 */
export const publishOrderEvent = (event: OrderEvent) => {
  for (const subscriber of subscribers) {
    try {
      subscriber(event)
    } catch (err) {
      console.error('Order event subscriber error:', err)
    }
  }
}

export const subscribeOrderEvents = (subscriber: Subscriber): (() => void) => {
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}
