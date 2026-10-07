import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import { subscribeOrderEvents } from '@/realtime/order-events'
import { isFnbEventStaff, resolveStaffEventScope } from '@/utilities/fnb-staff-access'

export const dynamic = 'force-dynamic'

// Comment frames keep intermediaries (nginx, LBs) from closing an idle stream.
const HEARTBEAT_MS = 25_000

/**
 * Event staff order stream (SSE). The event equivalent of
 * `/api/orders/stream` - one long-lived GET per open event panel, scoped to a
 * single event (or a set) by `?orderingSlug=`. Every order create/update whose
 * snapshotted `ordering_slug` is in the caller's allowed set is pushed as a
 * `data:` frame. Writes never come through here; the orders afterChange hook
 * publishes to this process's subscribers (realtime/order-events.ts).
 *
 * The existing `/api/orders/stream` route is untouched and keeps filtering by
 * restaurant.
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config })

  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null }
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!isFnbEventStaff(user)) {
    return new Response('Forbidden', { status: 403 })
  }

  const params = new URL(req.url).searchParams
  // Accept both repeated (?orderingSlug=a&orderingSlug=b) and comma-list forms.
  const requestedSlugs = params
    .getAll('orderingSlug')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  const allowedSlugs = await resolveStaffEventScope(payload, user, requestedSlugs)
  if (allowedSlugs.length === 0) {
    return new Response('Forbidden', { status: 403 })
  }
  const allowed = new Set(allowedSlugs)

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
          // Client vanished without an abort event - tear the subscription and
          // heartbeat down now rather than leaking them until GC.
          closed = true
          cleanup?.()
        }
      }

      const unsubscribe = subscribeOrderEvents((event) => {
        if (!event.orderingSlug || !allowed.has(event.orderingSlug)) return
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
