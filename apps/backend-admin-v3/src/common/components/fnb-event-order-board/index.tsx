'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Gutter, useModal } from '@payloadcms/ui'
import { useBrowserNotifications } from '@/common/hooks/useBrowserNotifications'
import { useLocalStorage } from '@/common/hooks/use-local-storage'
import type { MenuItem, Order } from '@/payload-types'
import {
  GRID_CLASSES,
  OUTLINE_BUTTON_CLASSES,
  OrderCard,
  OrderStatus,
  PanelRole,
  STATUS_LABEL,
  ackEntryStatusesForOrder,
  isBohOnly,
  isOrderActiveForRole,
  notifyTitle,
  resolveRoleConfig,
  tableSeatLabel,
  sortOrdersByNumber,
  backActionFor,
  HistoryOrderCard,
  buildConfirmMessage,
  type OrderAction,
} from '../fnb-order-board'
import { ConfirmDialog, CONFIRM_ORDER_MODAL_SLUG } from '../fnb-order-board/confirm-dialog'
import { useUndoToast } from '../fnb-order-board/undo-toast'
import { RingAlertBanner } from '../fnb-order-board/ring-alert-banner'
import { NotificationSettingsMenu } from '../fnb-order-board/notification-settings-menu'
import {
  getEventStaffContextAction,
  listEventOrdersAction,
  updateOrderStatusAction,
  type OrderListScope,
  type StaffEventItem,
} from './actions'

export interface EventOrderBoardProps {
  role: PanelRole
  title: string
}

export const EventOrderBoard: React.FC<EventOrderBoardProps> = ({ role, title }) => {
  const [events, setEvents] = useState<StaffEventItem[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>()
  const [orders, setOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loadingContext, setLoadingContext] = useState(true)
  const [actionError, setActionError] = useState<string | undefined>()

  const notifications = useBrowserNotifications({ scope: role })
  const notificationsRef = useRef(notifications)
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  const [pendingAckIds, setPendingAckIds] = useState<Set<string>>(new Set())
  const pendingAckIdsRef = useRef<Set<string>>(pendingAckIds)
  useEffect(() => {
    pendingAckIdsRef.current = pendingAckIds
  }, [pendingAckIds])

  const [silenced, setSilenced] = useState(false)

  const activeOrderIdsRef = useRef<Set<string>>(new Set())

  // Remembers the last event this role picked on this device so a multi-access
  // staffer doesn't have to reselect it after every reload. Read once at mount via a
  // ref (avoids re-running the context-load effect whenever the value changes).
  const [lastSlug, setLastSlug] = useLocalStorage<string | undefined>(
    `fnb-last-event:${role}`,
    undefined,
  )
  const lastSlugRef = useRef(lastSlug)

  // Drive ringing loop when unacknowledged actionable orders exist and ringing is not silenced
  const shouldRing = notifications.loopEnabled && pendingAckIds.size > 0 && !silenced
  const { setRinging } = notifications
  useEffect(() => {
    setRinging(shouldRing)
  }, [shouldRing, setRinging])

  useEffect(() => {
    getEventStaffContextAction(role).then((result) => {
      if (result.success && result.data) {
        setEvents(result.data.events)
        const remembered = result.data.events.find((e) => e.slug === lastSlugRef.current)
        setSelectedSlug(remembered ? remembered.slug : result.data.defaultSlug)
      }
      setLoadingContext(false)
    })
  }, [role])

  const handleEventChange = useCallback(
    (slug: string) => {
      setSelectedSlug(slug)
      setLastSlug(slug)
    },
    [setLastSlug],
  )

  const upsertOrder = useCallback(
    (order: Order) => {
      const isActive = isOrderActiveForRole(role, order)
      setOrders((prev) => {
        const withoutOrder = prev.filter((o) => o.id !== order.id)
        return isActive ? sortOrdersByNumber([...withoutOrder, order]) : withoutOrder
      })
      setHistoryOrders((prev) => prev.filter((o) => o.id !== order.id))
    },
    [role],
  )

  const fetchOrders = useCallback(
    async (scope: OrderListScope) => {
      if (!selectedSlug) return
      const result = await listEventOrdersAction(selectedSlug, scope)
      if (!result.success || !result.data) return

      if (scope === 'active') {
        const active = result.data.filter((o) => isOrderActiveForRole(role, o))
        setOrders(sortOrdersByNumber(active))
        activeOrderIdsRef.current = new Set(active.map((o) => o.id))
        const ackIds = new Set(
          active
            .filter((o) => ackEntryStatusesForOrder(role, o).includes(o.status))
            .map((o) => o.id),
        )
        setPendingAckIds(ackIds)
        pendingAckIdsRef.current = ackIds
      } else {
        setHistoryOrders(result.data)
      }
    },
    [selectedSlug, role],
  )

  // Baseline via server action, deltas via SSE; onopen re-fetches to cover missed events.
  useEffect(() => {
    setOrders([])
    setHistoryOrders([])
    setPendingAckIds(new Set())
    pendingAckIdsRef.current = new Set()
    activeOrderIdsRef.current = new Set()
    setSilenced(false)
    setConnected(false)

    if (!selectedSlug) return

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const source = new EventSource(
      `${basePath}/api/events/orders/stream?orderingSlug=${encodeURIComponent(selectedSlug)}`,
    )

    source.onopen = () => {
      setConnected(true)
      fetchOrders('active')
    }
    source.onerror = () => setConnected(false)
    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if ((message.type === 'order:new' || message.type === 'order:update') && message.data) {
          const order = message.data as Order
          const isActive = isOrderActiveForRole(role, order)

          if (message.type === 'order:new') {
            // A waiter never handles a Back-of-House-only order — don't ping them for one.
            // Every other panel keeps getting the "new order" heads-up as before.
            if (!(role === 'waiter' && isBohOnly(order))) {
              const itemsSummary =
                (order.items || [])
                  .map((line) => {
                    const item = line.item as MenuItem
                    const lineTitle = typeof item === 'object' ? item?.title : ''
                    return lineTitle ? `${line.quantity}x ${lineTitle}` : `${line.quantity}x item`
                  })
                  .join(', ') || tableSeatLabel(order)

              notificationsRef.current.notify(notifyTitle(order), {
                body: itemsSummary,
                tag: `order-${order.id}`,
              })
            }
          } else if (message.type === 'order:update') {
            if (isActive && !activeOrderIdsRef.current.has(order.id)) {
              const title =
                order.order_number != null
                  ? `Order #${order.order_number} — ${tableSeatLabel(order)}`
                  : `Order — ${tableSeatLabel(order)}`
              notificationsRef.current.notify(title, {
                body: `Now ${STATUS_LABEL[order.status].toLowerCase()} — ready for you`,
                tag: `order-${order.id}`,
              })
            }
          }

          if (isActive) {
            activeOrderIdsRef.current.add(order.id)
          } else {
            activeOrderIdsRef.current.delete(order.id)
          }

          // Maintain pendingAckIds and un-silence if genuinely new alert for this panel
          if (ackEntryStatusesForOrder(role, order).includes(order.status)) {
            if (!pendingAckIdsRef.current.has(order.id)) {
              setSilenced(false)
            }
            setPendingAckIds((prev) => {
              const next = new Set(prev)
              next.add(order.id)
              pendingAckIdsRef.current = next
              return next
            })
          } else {
            setPendingAckIds((prev) => {
              if (!prev.has(order.id)) return prev
              const next = new Set(prev)
              next.delete(order.id)
              pendingAckIdsRef.current = next
              return next
            })
          }

          upsertOrder(order)
        }
      } catch {
        // ignore malformed frames
      }
    }

    return () => {
      source.close()
    }
  }, [selectedSlug, fetchOrders, upsertOrder, role])

  const { openModal } = useModal()
  const { push: pushToast, UndoToastStack } = useUndoToast()
  const [confirmModalData, setConfirmModalData] = useState<{
    order: Order
    action: OrderAction
    message: string
  } | null>(null)

  const handleRefresh = () => {
    fetchOrders('active')
    if (historyOpen) fetchOrders('history')
  }

  const handleOpenHistory = () => {
    setHistoryOpen(true)
    fetchOrders('history')
  }

  const updateStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    setActionError(undefined)
    const result = await updateOrderStatusAction(orderId, status)
    if (!result.success) {
      setActionError(result.error)
      return false
    } else {
      // Immediately remove from pendingAckIds so ring stops without waiting for SSE round trip
      setPendingAckIds((prev) => {
        if (!prev.has(orderId)) return prev
        const next = new Set(prev)
        next.delete(orderId)
        pendingAckIdsRef.current = next
        return next
      })
      return true
    }
    // No optimistic update - the card repaints when our change returns via the stream.
  }

  const executeUpdate = async (
    order: Order,
    action: OrderAction,
    isUndo = false,
  ) => {
    const ok = await updateStatus(order.id, action.nextStatus)
    if (ok && !isUndo && action.variant !== 'back') {
      const resultingOrder: Order = { ...order, status: action.nextStatus }
      const reverse = backActionFor(role, resultingOrder)
      if (reverse) {
        pushToast({
          orderId: order.id,
          orderNumber: order.order_number,
          previousStatus: order.status,
          newStatus: action.nextStatus,
          onUndo: async () => {
            await executeUpdate(resultingOrder, reverse, true)
          },
        })
      }
    }
  }

  const handleActionClick = (order: Order, action: OrderAction) => {
    if (action.confirm) {
      setConfirmModalData({
        order,
        action,
        message: buildConfirmMessage(order, action),
      })
      openModal(CONFIRM_ORDER_MODAL_SLUG)
    } else {
      executeUpdate(order, action)
    }
  }

  const handleModalConfirm = () => {
    if (!confirmModalData) return
    const { order, action } = confirmModalData
    setConfirmModalData(null)
    executeUpdate(order, action)
  }

  const handleModalCancel = () => {
    setConfirmModalData(null)
  }

  if (loadingContext) {
    return (
      <Gutter className="py-12">
        <p>Loading {title.toLowerCase()} orders...</p>
      </Gutter>
    )
  }

  const currentEvent = events.find((e) => e.slug === selectedSlug)
  const currentEventLabel = currentEvent
    ? currentEvent.restaurantName
      ? `${currentEvent.title} — ${currentEvent.restaurantName}`
      : currentEvent.title
    : 'No event'

  return (
    <Gutter className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold m-0">{title}</h1>
          <p className="text-sm opacity-70 mt-1">
            {connected ? 'Live' : 'Disconnected'} &middot; {currentEventLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {events.length > 1 && (
            <select
              value={selectedSlug}
              onChange={(e) => handleEventChange(e.target.value)}
              className="border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-800)] rounded px-2 py-1 shadow-[3px_3px_0px_0px_var(--theme-elevation-1000)]"
            >
              {events.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.restaurantName ? `${e.title} — ${e.restaurantName}` : e.title}
                </option>
              ))}
            </select>
          )}
          <NotificationSettingsMenu notifications={notifications} />
          <button onClick={handleRefresh} className={OUTLINE_BUTTON_CLASSES}>
            Refresh
          </button>
          <button onClick={handleOpenHistory} className={OUTLINE_BUTTON_CLASSES}>
            History
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 text-sm font-semibold text-red-600">{actionError}</p>
      )}

      {events.length === 0 ? (
        <p>No events assigned to you.</p>
      ) : (
        <>
          {orders.length === 0 && <p>No orders waiting on you right now.</p>}

          <div className={GRID_CLASSES}>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={resolveRoleConfig(role, order).actions(order)}
                backAction={backActionFor(role, order)}
                onAction={handleActionClick}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        </>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setHistoryOpen(false)}>
          <div
            className="bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-800)] border-l-2 border-[var(--theme-elevation-1000)] w-full max-w-2xl h-full overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl m-0">Order History</h2>
              <button onClick={() => setHistoryOpen(false)} className={OUTLINE_BUTTON_CLASSES}>
                Close
              </button>
            </div>
            {historyOrders.length === 0 && <p>No closed orders yet.</p>}
            {/* single column - this is a narrow side panel, not the main board grid */}
            <div className="grid grid-cols-1 gap-4">
              {historyOrders.map((order) => (
                <HistoryOrderCard
                  key={order.id}
                  order={order}
                  role={role}
                  onAction={handleActionClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        order={confirmModalData?.order ?? null}
        message={confirmModalData?.message || ''}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {/* Floating bottom overlays: ring alert on the left, undo toasts on the
          right (desktop); stacked full-width on mobile - see undo-toast.tsx's
          UndoToastStack and ring-alert-banner.tsx for why positioning lives here
          rather than inside either component. */}
      <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 pointer-events-none sm:inset-x-5 sm:bottom-5 sm:flex-row sm:items-end">
        {notifications.loopEnabled && pendingAckIds.size > 0 && (
          <RingAlertBanner
            count={pendingAckIds.size}
            silenced={silenced}
            onSilence={() => setSilenced(true)}
          />
        )}
        <UndoToastStack />
      </div>
    </Gutter>
  )
}

export default EventOrderBoard
