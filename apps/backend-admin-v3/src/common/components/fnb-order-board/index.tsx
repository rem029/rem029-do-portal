'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Gutter, Pill, useModal } from '@payloadcms/ui'
import { useBrowserNotifications } from '@/common/hooks/useBrowserNotifications'
import { useLocalStorage } from '@/common/hooks/use-local-storage'
import { NotificationSettingsMenu } from './notification-settings-menu'
import { ConfirmDialog, CONFIRM_ORDER_MODAL_SLUG } from './confirm-dialog'
import { useUndoToast } from './undo-toast'
import { RingAlertBanner } from './ring-alert-banner'
import {
  orderTotal,
  OrderItemsList,
  tableLabel,
  tableSeatLabel,
  notifyTitle,
  fmtDateTime,
  OrderHeading,
  OrderNote,
  sortOrdersByNumber,
} from './order-display'
import {
  getFnbStaffContextAction,
  listOrdersAction,
  updateOrderStatusAction,
  OrderListScope,
} from './actions'

import { MenuItem, Order, Restaurant } from '@/payload-types'

// Re-exported for existing consumers (e.g. fnb-event-order-board/index.tsx) that
// import these display primitives from this module.
export {
  orderTotal,
  OrderItemsList,
  tableLabel,
  tableSeatLabel,
  notifyTitle,
  fmtDateTime,
  OrderHeading,
  OrderNote,
  sortOrdersByNumber,
}

export type OrderStatus = Order['status']
export type PanelRole = 'waiter' | 'boh' | 'cashier'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  prepared: 'Prepared',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// Local copy of @payloadcms/ui's PillStyle union - not exported from its public entry.
export type PillStyle = 'always-white' | 'dark' | 'error' | 'light' | 'light-gray' | 'success' | 'warning' | 'white'

// Payload's Pill styles flip with the admin light/dark theme; Tailwind pastels wouldn't.
export const STATUS_PILL: Record<OrderStatus, PillStyle> = {
  pending: 'warning',
  confirmed: 'light-gray',
  preparing: 'dark',
  prepared: 'light',
  served: 'success',
  completed: 'success',
  cancelled: 'error',
}

export type OrderAction = {
  label: string
  nextStatus: OrderStatus
  variant: 'primary' | 'danger' | 'back'
  confirm?: boolean
}

/**
 * Which buttons each role sees - NOT enforcement. The server locks every (from, to)
 * transition to its owning role (orders/hooks/transition-guard). Lifecycle:
 * pending -> confirmed -> preparing -> prepared -> served -> completed; cancel from pending/confirmed.
 */
export const ROLE_CONFIG: Record<
  PanelRole,
  { activeStatuses: OrderStatus[]; actions: (order: Order) => OrderAction[] }
> = {
  waiter: {
    activeStatuses: ['pending', 'confirmed', 'preparing', 'prepared'],
    actions: (order) => {
      if (order.status === 'pending') {
        return [
          { label: 'Confirm Order', nextStatus: 'confirmed', variant: 'primary' },
          { label: 'Cancel', nextStatus: 'cancelled', variant: 'danger' },
        ]
      }
      if (order.status === 'confirmed') {
        return [{ label: 'Cancel', nextStatus: 'cancelled', variant: 'danger' }]
      }
      if (order.status === 'prepared') {
        return [{ label: 'Mark Served', nextStatus: 'served', variant: 'primary', confirm: true }]
      }
      return []
    },
  },
  boh: {
    activeStatuses: ['confirmed', 'preparing'],
    actions: (order) => {
      if (order.status === 'confirmed') {
        return [{ label: 'Start Preparing', nextStatus: 'preparing', variant: 'primary' }]
      }
      if (order.status === 'preparing') {
        return [{ label: 'Mark Prepared', nextStatus: 'prepared', variant: 'primary' }]
      }
      return []
    },
  },
  cashier: {
    activeStatuses: ['served'],
    actions: (order) =>
      order.status === 'served'
        ? [{ label: 'Mark Complete', nextStatus: 'completed', variant: 'primary', confirm: true }]
        : [],
  },
}

/**
 * The status at which an order first demands THIS panel's action.
 * Ring stops as soon as staff take that first action (or the order leaves).
 */
export const ACK_ENTRY_STATUSES: Record<PanelRole, OrderStatus[]> = {
  waiter: ['pending', 'prepared'], // Confirm Order / Mark Served
  boh: ['confirmed'], // Start Preparing
  cashier: ['served'], // Mark Complete
}

export const isBohOnly = (order: Order) => order.fulfillment === 'boh_only'

export const BOH_ONLY_CONFIG: { activeStatuses: OrderStatus[]; actions: (order: Order) => OrderAction[] } = {
  activeStatuses: ['pending', 'confirmed', 'preparing', 'prepared'],
  actions: (order) => {
    if (order.status === 'pending')
      return [
        { label: 'Confirm Order', nextStatus: 'confirmed', variant: 'primary' },
        { label: 'Cancel', nextStatus: 'cancelled', variant: 'danger' },
      ]
    if (order.status === 'confirmed')
      return [
        { label: 'Start Preparing', nextStatus: 'preparing', variant: 'primary' },
        { label: 'Cancel', nextStatus: 'cancelled', variant: 'danger' },
      ]
    if (order.status === 'preparing')
      return [{ label: 'Mark Prepared', nextStatus: 'prepared', variant: 'primary' }]
    if (order.status === 'prepared')
      return [{ label: 'Mark Served', nextStatus: 'served', variant: 'primary', confirm: true }]
    return []
  },
}

export const resolveRoleConfig = (role: PanelRole, order: Order) =>
  role === 'boh' && isBohOnly(order) ? BOH_ONLY_CONFIG : ROLE_CONFIG[role]

export const backActionFor = (role: PanelRole, order: Order): OrderAction | null => {
  const bohOnly = isBohOnly(order)

  if (order.status === 'confirmed') {
    // Reverse of pending -> confirmed (waiter, or boh on boh_only or boh board)
    if (role === 'waiter' && !bohOnly) {
      return { label: 'Back to Pending', nextStatus: 'pending', variant: 'back', confirm: true }
    }
    if (role === 'boh') {
      return { label: 'Back to Pending', nextStatus: 'pending', variant: 'back', confirm: true }
    }
  }

  if (order.status === 'preparing') {
    // Reverse of confirmed -> preparing (boh)
    // Waiter's preparing card is intentionally read-only today — leave that alone, don't add a button there.
    if (role === 'boh') {
      return { label: 'Back to Confirmed', nextStatus: 'confirmed', variant: 'back', confirm: true }
    }
  }

  if (order.status === 'prepared') {
    // Reverse of preparing -> prepared: granted to boh (self) and waiter (board-visibility)
    if (role === 'waiter' && !bohOnly) {
      return { label: 'Back to Preparing', nextStatus: 'preparing', variant: 'back', confirm: true }
    }
    if (role === 'boh') {
      return { label: 'Back to Preparing', nextStatus: 'preparing', variant: 'back', confirm: true }
    }
  }

  if (order.status === 'served') {
    // Reverse of prepared -> served: granted to waiter (self), cashier (board-visibility), and boh on boh_only (self)
    if (role === 'cashier') {
      return { label: 'Back to Prepared', nextStatus: 'prepared', variant: 'back', confirm: true }
    }
    if (role === 'waiter' && !bohOnly) {
      return { label: 'Back to Prepared', nextStatus: 'prepared', variant: 'back', confirm: true }
    }
    if (role === 'boh' && bohOnly) {
      return { label: 'Back to Prepared', nextStatus: 'prepared', variant: 'back', confirm: true }
    }
  }

  if (order.status === 'completed') {
    // Reverse of served -> completed: cashier only (History revert feature)
    // Event-mode orders skip 'served' by design and have no cashier board to land back on.
    if (role === 'cashier' && !order.event_mode) {
      return { label: 'Revert to Served', nextStatus: 'served', variant: 'back', confirm: true }
    }
  }

  return null
}

// Waiters never see Back-of-House-only orders; otherwise it's the role's active set.
export const isOrderActiveForRole = (role: PanelRole, order: Order): boolean => {
  if (role === 'waiter' && isBohOnly(order)) return false
  return resolveRoleConfig(role, order).activeStatuses.includes(order.status)
}

export const ackEntryStatusesForOrder = (role: PanelRole, order: Order): OrderStatus[] => {
  if (role === 'waiter' && isBohOnly(order)) return []
  // BOH-only: ring when a new order lands (needs confirming) and again when it's
  // cooked (needs serving) — not on 'confirmed', or it would re-ring the instant
  // BOH confirms it themselves.
  return role === 'boh' && isBohOnly(order) ? ['pending', 'prepared'] : ACK_ENTRY_STATUSES[role]
}

interface OrderBoardProps {
  role: PanelRole
  title: string
}

// Collapsible lifecycle log - one row per step reached; hidden until past "Placed".
export const TIMELINE_STEPS: { label: string; at: (o: Order) => string | null | undefined }[] = [
  { label: 'Placed', at: (o) => o.createdAt },
  { label: 'Confirmed', at: (o) => o.confirmed_at },
  { label: 'Preparing', at: (o) => o.preparing_at },
  { label: 'Prepared', at: (o) => o.prepared_at },
  { label: 'Served', at: (o) => o.served_at },
  { label: 'Completed', at: (o) => o.completed_at },
  { label: 'Cancelled', at: (o) => o.cancelled_at },
]

export const OrderTimeline = ({ order }: { order: Order }) => {
  const [open, setOpen] = useState(false)
  const steps = TIMELINE_STEPS.map((s) => ({ label: s.label, at: s.at(order) })).filter(
    (s): s is { label: string; at: string } => Boolean(s.at),
  )
  if (steps.length < 2) return null

  return (
    <div className="pt-2 border-t border-[var(--theme-elevation-150)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--theme-elevation-700)] cursor-pointer bg-transparent border-0 p-0"
      >
        <span className="inline-block w-3 text-center">{open ? '▾' : '▸'}</span>
        History
      </button>
      {open && (
        <ol className="mt-2 flex flex-col gap-1 m-0 p-0 list-none">
          {steps.map((s) => (
            <li key={s.label} className="flex justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--theme-elevation-800)]">{s.label}</span>
              <span className="text-[var(--theme-elevation-600)] tabular-nums whitespace-nowrap">
                {fmtDateTime(s.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// Use Payload's --theme-elevation-* vars directly - Tailwind's dark: variant isn't
// wired to the admin theme toggle here. --theme-elevation-1000 (black <-> white) is
// what makes the neubrutalist offset shadows pop in both themes.
export const CARD_CLASSES =
  'rounded-lg p-4 flex flex-col gap-3 bg-[var(--theme-elevation-50)] border-2 border-[var(--theme-elevation-1000)] text-[var(--theme-elevation-800)] shadow-[4px_4px_0px_0px_var(--theme-elevation-1000)]'
export const OUTLINE_BUTTON_CLASSES =
  'px-4 py-2 rounded font-semibold border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-800)] cursor-pointer shadow-[3px_3px_0px_0px_var(--theme-elevation-1000)] transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--theme-elevation-1000)]'
export const ACTION_BUTTON_CLASSES =
  'px-3 py-2 rounded text-white font-bold cursor-pointer border-2 border-[var(--theme-elevation-1000)] shadow-[3px_3px_0px_0px_var(--theme-elevation-1000)] transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--theme-elevation-1000)]'
export const GRID_CLASSES = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className="inline-flex shrink-0 rounded-full border-2 border-[var(--theme-elevation-1000)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)]">
    {/* Payload's `rounded` Pill only rounds to --style-radius-l; force full radius
        so the fill doesn't poke past this wrapper's capsule ring. */}
    <Pill pillStyle={STATUS_PILL[status]} size="small" rounded className="!rounded-full">
      {STATUS_LABEL[status]}
    </Pill>
  </span>
)

export const BACK_BUTTON_CLASSES =
  'px-3 py-2 rounded text-sm font-bold cursor-pointer border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-150)] text-[var(--theme-elevation-800)] hover:bg-[var(--theme-elevation-200)] shadow-[3px_3px_0px_0px_var(--theme-elevation-1000)] transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--theme-elevation-1000)]'

export const OrderCard = ({
  order,
  actions,
  backAction,
  onAction,
  onUpdateStatus,
}: {
  order: Order
  actions: OrderAction[]
  backAction?: OrderAction | null
  onAction?: (order: Order, action: OrderAction) => void
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void
}) => {
  const handleActionClick = (action: OrderAction) => {
    if (onAction) {
      onAction(order, action)
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, action.nextStatus)
    }
  }

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-2">
        <OrderHeading order={order} />
        <StatusBadge status={order.status} />
      </div>
      <OrderNote order={order} />
      <OrderItemsList order={order} />
      {order.show_prices !== false && (
        <p className="text-sm font-semibold m-0 pt-2 border-t border-[var(--theme-elevation-150)]">
          QAR {orderTotal(order)}
        </p>
      )}
      {(actions.length > 0 || backAction) && (
        <div className="flex items-center justify-between gap-2 mt-auto pt-1 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleActionClick(action)}
                className={`${ACTION_BUTTON_CLASSES} ${action.variant === 'danger' ? 'bg-red-600' : 'bg-green-600'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
          {backAction && (
            <div className="flex items-center ml-auto">
              <button
                key={backAction.label}
                type="button"
                onClick={() => handleActionClick(backAction)}
                className={BACK_BUTTON_CLASSES}
              >
                {backAction.label}
              </button>
            </div>
          )}
        </div>
      )}
      <OrderTimeline order={order} />
    </div>
  )
}

export const HistoryOrderCard = ({
  order,
  role,
  onAction,
}: {
  order: Order
  role: PanelRole
  onAction?: (order: Order, action: OrderAction) => void
}) => {
  const revertAction = backActionFor(role, order)

  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-start justify-between gap-2">
        <OrderHeading order={order} />
        <StatusBadge status={order.status} />
      </div>
      <OrderNote order={order} />
      <OrderItemsList order={order} />
      {order.show_prices !== false && (
        <p className="text-sm font-semibold m-0 pt-2 border-t border-[var(--theme-elevation-150)]">
          QAR {orderTotal(order)}
        </p>
      )}
      {revertAction && (
        <div className="flex justify-end mt-auto pt-1">
          <button
            type="button"
            onClick={() => onAction?.(order, revertAction)}
            className={BACK_BUTTON_CLASSES}
          >
            {revertAction.label}
          </button>
        </div>
      )}
      <OrderTimeline order={order} />
    </div>
  )
}

export const buildConfirmMessage = (order: Order, action: OrderAction): string => {
  if (action.variant === 'back') {
    if (action.label.startsWith('Revert')) {
      return 'Revert this order to served?'
    }
    return `Move this order back to ${STATUS_LABEL[action.nextStatus].toLowerCase()}?`
  }
  if (action.nextStatus === 'served') {
    return 'Mark this order as served?'
  }
  if (action.nextStatus === 'completed') {
    return 'Mark this order as complete?'
  }
  return `Move this order to ${STATUS_LABEL[action.nextStatus].toLowerCase()}?`
}

export const OrderBoard: React.FC<OrderBoardProps> = ({ role, title }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantId, setRestaurantId] = useState<string | undefined>()
  const [orders, setOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [reconnectNonce, setReconnectNonce] = useState(0)
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

  // Remembers the last restaurant this role picked on this device so a multi-access
  // staffer doesn't have to reselect it after every reload. Read once at mount via a
  // ref (avoids re-running the context-load effect whenever the value changes).
  const [lastRestaurantId, setLastRestaurantId] = useLocalStorage<string | undefined>(
    `fnb-last-restaurant:${role}`,
    undefined,
  )
  const lastRestaurantIdRef = useRef(lastRestaurantId)

  // Drive ringing loop when unacknowledged actionable orders exist and ringing is not silenced
  const shouldRing = notifications.loopEnabled && pendingAckIds.size > 0 && !silenced
  const { setRinging } = notifications
  useEffect(() => {
    setRinging(shouldRing)
  }, [shouldRing, setRinging])

  useEffect(() => {
    getFnbStaffContextAction().then((result) => {
      if (result.success && result.data) {
        setRestaurants(result.data.restaurants)
        const remembered = result.data.restaurants.find(
          (r) => r.id === lastRestaurantIdRef.current,
        )
        setRestaurantId(remembered ? remembered.id : result.data.defaultRestaurantId)
      }
      setLoadingContext(false)
    })
  }, [])

  const handleRestaurantChange = useCallback(
    (id: string) => {
      setRestaurantId(id)
      setLastRestaurantId(id)
    },
    [setLastRestaurantId],
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
      if (!restaurantId) return
      const result = await listOrdersAction(restaurantId, scope)
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
    [restaurantId, role],
  )

  // Baseline via server action, deltas via SSE; onopen re-fetches to cover missed events.
  useEffect(() => {
    if (!restaurantId) return

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const source = new EventSource(`${basePath}/api/orders/stream?restaurantId=${restaurantId}`)

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

    return () => source.close()
  }, [restaurantId, fetchOrders, upsertOrder, role, reconnectNonce])

  const handleForceReconnect = () => {
    setReconnectNonce((n) => n + 1)
  }

  const handleRefresh = () => {
    fetchOrders('active')
    if (historyOpen) fetchOrders('history')
  }

  const { openModal } = useModal()
  const { push: pushToast, UndoToastStack } = useUndoToast()
  const [confirmModalData, setConfirmModalData] = useState<{
    order: Order
    action: OrderAction
    message: string
  } | null>(null)

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

  return (
    <Gutter className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold m-0">{title}</h1>
          <p className="text-sm opacity-70 mt-1">
            {connected ? 'Live' : 'Disconnected'} &middot;{' '}
            {(restaurants.find((r) => r.id === restaurantId) as Restaurant)?.title || 'No restaurant'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {restaurants.length > 1 && (
            <select
              value={restaurantId}
              onChange={(e) => handleRestaurantChange(e.target.value)}
              className="border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-800)] rounded px-2 py-1 shadow-[3px_3px_0px_0px_var(--theme-elevation-1000)]"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          )}
          <NotificationSettingsMenu notifications={notifications} />
          <button onClick={handleRefresh} className={OUTLINE_BUTTON_CLASSES}>
            Refresh
          </button>
          <button onClick={handleForceReconnect} className={OUTLINE_BUTTON_CLASSES}>
            Force reconnect
          </button>
          <button onClick={handleOpenHistory} className={OUTLINE_BUTTON_CLASSES}>
            History
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 text-sm font-semibold text-red-600">{actionError}</p>
      )}

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

export default OrderBoard
