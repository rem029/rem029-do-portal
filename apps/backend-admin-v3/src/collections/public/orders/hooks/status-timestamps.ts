import type { CollectionBeforeChangeHook } from 'payload'
import type { Order } from '@/payload-types'
import type { OrderStatus } from './transition-guard'

const LIFECYCLE: { status: OrderStatus; atField: keyof Order | null }[] = [
  { status: 'pending', atField: null }, // createdAt covers this, untouched
  { status: 'confirmed', atField: 'confirmed_at' },
  { status: 'preparing', atField: 'preparing_at' },
  { status: 'prepared', atField: 'prepared_at' },
  { status: 'served', atField: 'served_at' },
  { status: 'completed', atField: 'completed_at' },
]

export const trackOrderStatusTimestamps: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data?.status || data.status === originalDoc?.status) return data

  const now = new Date().toISOString()

  if (data.status === 'confirmed' && !data.confirmed_at) {
    data.confirmed_at = now
  }

  if (data.status === 'preparing' && !data.preparing_at) {
    data.preparing_at = now
  }

  if (data.status === 'prepared' && !data.prepared_at) {
    data.prepared_at = now
  }

  if (data.status === 'served' && !data.served_at) {
    data.served_at = now
  }

  if (data.status === 'completed' && !data.completed_at) {
    data.completed_at = now
  }

  if (data.status === 'cancelled' && !data.cancelled_at) {
    data.cancelled_at = now
  }

  const fromIdx = LIFECYCLE.findIndex((s) => s.status === originalDoc?.status)
  const toIdx = LIFECYCLE.findIndex((s) => s.status === data.status)
  if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx) {
    for (let i = toIdx + 1; i <= fromIdx; i++) {
      const field = LIFECYCLE[i].atField
      if (field) data[field] = null
    }
  }

  return data
}
