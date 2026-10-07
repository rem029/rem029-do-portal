import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { subscribeOrderEvents } from '@/realtime/order-events'
import { resolveStaffRestaurantId } from '@/utilities/fnb-staff-access'

export const dynamic = 'force-dynamic'

// Comment frames keep intermediaries (nginx, LBs) from closing an idle stream.
const HEARTBEAT_MS = 25_000

/**
 * Staff order stream (SSE). One long-lived GET per open panel; every order
 * create/update for the resolved restaurant is pushed as a `data:` frame.
 * Writes never come through here - panels submit status changes via server
 * actions, and the resulting afterChange hook publishes directly to this
 * process's subscribers (see realtime/order-events.ts) - that's what feeds
 * this stream.
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config })

  // Same-origin GET, so the admin session cookie arrives like any page load.
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null }
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const requestedRestaurantId =
    new URL(req.url).searchParams.get('restaurantId') || undefined
  const restaurantId = await resolveStaffRestaurantId(payload, user, requestedRestaurantId)
  if (!restaurantId) {
    return new Response('Forbidden', { status: 403 })
  }

  const encoder = new TextEncoder()
  let cleanup: (() => void) | undefined

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

      const enqueue = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      const unsubscribe = subscribeOrderEvents((event) => {
        if (event.restaurantId !== restaurantId) return
        if (event.orderingCollection === 'fnb-menu-events') return
        enqueue(`data: ${JSON.stringify({ type: event.type, data: event.order })}\n\n`)
      })

      const heartbeat = setInterval(() => enqueue(': ping\n\n'), HEARTBEAT_MS)

      cleanup = () => {
        closed = true
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // already closed by the client disconnecting
        }
      }

      req.signal.addEventListener('abort', () => cleanup?.())

      // Confirms the subscription is live; clients fetch their baseline list
      // via a server action on open rather than through the stream.
      enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
    },
    cancel() {
      cleanup?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      // nginx would otherwise buffer the stream and events would never flush.
      'X-Accel-Buffering': 'no',
    },
  })
}
