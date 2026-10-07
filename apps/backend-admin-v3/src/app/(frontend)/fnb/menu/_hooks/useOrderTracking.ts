'use client'

import { useEffect, useState } from 'react'
import { getOrderStatusAction } from '@/app/(frontend)/fnb/menu/_actions/orders'

export type TrackedOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'prepared'
  | 'served'
  | 'completed'
  | 'cancelled'

export interface TrackedOrder {
  id: string
  order_number?: number
  order_date?: string
  status: TrackedOrderStatus
  table?: string
  seat_number?: number
  guest_name?: string
  notes?: string
  items: {
    title: string
    quantity: number
    price: number | null | undefined
    modifiers?: string
  }[]
  total: number
  show_prices?: boolean
  createdAt: string
  confirmed_at?: string | null
  preparing_at?: string | null
  prepared_at?: string | null
  served_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
}

/**
 * Live status for a single order via the unauthenticated /api/orders/track SSE
 * stream. Baseline comes from getOrderStatusAction (also re-fetched on every
 * stream open, covering reconnect gaps); the stream then pushes trimmed
 * snapshots whenever staff move the order through its lifecycle.
 */
export const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<TrackedOrder | undefined>()
  const [connected, setConnected] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchBaseline = () => {
      getOrderStatusAction(orderId).then((result) => {
        if (cancelled) return
        if (result.success && result.data) {
          setOrder(result.data as TrackedOrder)
        } else {
          setNotFound(true)
        }
      })
    }

    fetchBaseline()

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const source = new EventSource(`${basePath}/api/orders/track?orderId=${orderId}`)

    source.onopen = () => {
      setConnected(true)
      fetchBaseline()
    }
    source.onerror = () => setConnected(false)
    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if ((message.type === 'order:new' || message.type === 'order:update') && message.data) {
          setOrder(message.data as TrackedOrder)
        }
      } catch {
        // ignore malformed frames
      }
    }

    return () => {
      cancelled = true
      source.close()
    }
  }, [orderId])

  return { order, connected, notFound }
}
