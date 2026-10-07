import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrderTrackingState {
  orderIds: string[]
  addOrderId: (orderId: string) => void
  removeOrderId: (orderId: string) => void
}

/**
 * Guests aren't logged in, so this localStorage list of recent order ids is
 * what powers "track your order" after a refresh - keep a handful, most recent first.
 */
export const useOrderTrackingStore = create<OrderTrackingState>()(
  persist(
    (set, get) => ({
      orderIds: [],
      addOrderId: (orderId: string) => {
        const orderIds = [orderId, ...get().orderIds.filter((id) => id !== orderId)].slice(0, 5)
        set({ orderIds })
      },
      removeOrderId: (orderId: string) => {
        set({ orderIds: get().orderIds.filter((id) => id !== orderId) })
      },
    }),
    { name: 'fnb-order-tracking' },
  ),
)
