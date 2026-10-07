import { getPayload } from 'payload'
import config from '@payload-config'
import { subscribeOrderEvents } from '@/realtime/order-events'
import { toGuestOrderSnapshot } from '@/collections/public/orders/guest-snapshot'

export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25_000

/**
 * Guest order tracking stream (SSE). Unauthenticated by design - guests never
 * log in, and knowing the order id is the same bar as holding the tracker link
 * itself. Scoped to exactly one order, and only ever emits the trimmed guest
 * snapshot (never the raw doc with restaurant/staff references).
 */
export async function GET(req: Request) {
  const payload = await getPayload({ config })

  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) {
    return new Response('Bad Request', { status: 400 })
  }

  try {
    await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return new Response('Not Found', { status: 404 })
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
        if (event.order.id !== orderId) return
        enqueue(
          `data: ${JSON.stringify({ type: event.type, data: toGuestOrderSnapshot(event.order) })}\n\n`,
        )
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
      'X-Accel-Buffering': 'no',
    },
  })
}
