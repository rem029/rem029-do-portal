'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/utilities/cn'
import {
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoFlameOutline,
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
} from 'react-icons/io5'
import type { IconType } from 'react-icons'
import {
  useBrowserNotifications,
  UseBrowserNotifications,
} from '@/common/hooks/useBrowserNotifications'
import { useOrderTrackingStore } from '@/app/(frontend)/fnb/menu/_store/order-store'
import {
  useOrderTracking,
  TrackedOrderStatus,
} from '@/app/(frontend)/fnb/menu/_hooks/useOrderTracking'
import { cancelOrderAction } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { NotificationPrompt } from './notification-prompt'
import CarouselFilters from '@/common/components/embla-carousel/carousel-filters'
import { Language, t } from '@/utilities/translations'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'

const STATUS_LABEL: Record<TrackedOrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  prepared: 'Ready to serve',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// One icon + motion per lifecycle stage, so the header communicates progress at a
// glance instead of through text alone. Only stages the guest is actively waiting on
// (placed / preparing / ready) loop continuously; confirmed/served just pop in once to
// acknowledge the change, and the two terminal states sit still. `motion-safe:` keeps
// every loop off for prefers-reduced-motion - the icon and color still carry the state.
//
// Color is a deliberate, narrow exception to this app's "never hardcode a guest color"
// rule: FnB menu pages only expose brand fields (primary/background/text/neutral), no
// semantic status tokens, and a universally-read status color (amber=waiting,
// orange=active, red=cancelled...) only works if it's the same hue regardless of the
// page's own brand color. Scoped to this one icon, not reused elsewhere.
const STATUS_ICON: Record<
  TrackedOrderStatus,
  { Icon: IconType; className: string; colorClass: string }
> = {
  pending: {
    Icon: IoReceiptOutline,
    className: 'motion-safe:animate-pulse',
    colorClass: 'text-amber-500',
  },
  confirmed: {
    Icon: IoCheckmarkCircleOutline,
    className: 'motion-safe:animate-pop',
    colorClass: 'text-blue-500',
  },
  preparing: {
    Icon: IoFlameOutline,
    className: 'motion-safe:animate-flicker',
    colorClass: 'text-orange-500',
  },
  prepared: {
    Icon: IoNotificationsOutline,
    className: 'motion-safe:animate-ring',
    colorClass: 'text-violet-500',
  },
  served: {
    Icon: IoCheckmarkDoneOutline,
    className: 'motion-safe:animate-pop',
    colorClass: 'text-teal-500',
  },
  completed: { Icon: IoCheckmarkCircle, className: '', colorClass: 'text-emerald-500' },
  cancelled: { Icon: IoCloseCircle, className: '', colorClass: 'text-red-500' },
}

const STEP_ORDER: TrackedOrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'prepared',
  'served',
  'completed',
]

interface OrderTrackerCardProps {
  orderId: string
  onDismiss: () => void
  notify: UseBrowserNotifications['notify']
  onTerminalChange?: (orderId: string, isTerminal: boolean) => void
}

const OrderTrackerCard = ({
  orderId,
  onDismiss,
  notify,
  onTerminalChange,
}: OrderTrackerCardProps) => {
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language
  const { order, connected, notFound } = useOrderTracking(orderId)
  const [expanded, setExpanded] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const prevStatusRef = useRef<TrackedOrderStatus | undefined>(undefined)

  useEffect(() => {
    if (!order) return

    const prev = prevStatusRef.current
    prevStatusRef.current = order.status

    if (prev === undefined || prev === order.status) {
      return
    }

    const numPrefix =
      order.order_number != null
        ? `${t('Order', lang)} #${order.order_number} `
        : `${t('Your order', lang)} `
    const tableSeat = [
      order.table,
      order.seat_number != null ? `${t('Seat', lang)} ${order.seat_number}` : '',
    ]
      .filter(Boolean)
      .join(' · ')

    switch (order.status) {
      case 'preparing':
        notify(`${numPrefix}${t('is being prepared', lang)}`, {
          body: t('The kitchen has started on your order.', lang),
          tag: `track-${order.id}`,
        })
        break
      case 'prepared':
        notify(`${numPrefix}${t('is ready', lang)}`, {
          body: tableSeat || t('Ready to serve', lang),
          tag: `track-${order.id}`,
        })
        break
      case 'served':
        notify(`${numPrefix}${t('has been served', lang)}`, {
          body: tableSeat || t('Enjoy your meal!', lang),
          tag: `track-${order.id}`,
        })
        break
      case 'cancelled':
        notify(`${numPrefix}${t('was cancelled', lang)}`, {
          body: tableSeat || t('Your order was cancelled.', lang),
          tag: `track-${order.id}`,
        })
        break
      default:
        break
    }
  }, [order, notify, lang])

  // Drop a stale tracked id (order deleted / demo reseed) instead of showing a blank card.
  useEffect(() => {
    if (notFound) onDismiss()
  }, [notFound, onDismiss])

  // Report terminal status up so "Dismiss all" only clears completed/cancelled orders,
  // never ones still in progress.
  useEffect(() => {
    onTerminalChange?.(
      orderId,
      order ? order.status === 'completed' || order.status === 'cancelled' : false,
    )
  }, [order, orderId, onTerminalChange])

  if (!order) return null

  const isTerminal = order.status === 'completed' || order.status === 'cancelled'
  const stepIndex = STEP_ORDER.indexOf(order.status)

  let placedAt = ''
  try {
    if (order.createdAt) placedAt = format(new Date(order.createdAt), 'd MMM yyyy · h:mm a')
  } catch {
    placedAt = ''
  }

  const handleCancel = async () => {
    setCancelling(true)
    await cancelOrderAction(orderId)
    setCancelling(false)
  }

  const {
    Icon: StatusIcon,
    className: statusIconClass,
    colorClass: statusColorClass,
  } = STATUS_ICON[order.status]

  return (
    <div className="rounded-lg bg-menu-background-card text-menu-text border-[0.5px] border-menu-primary/30 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 p-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-sm font-bold font-menu-primary text-left flex items-center gap-1.5 menu-order-status-title">
          <StatusIcon
            key={order.status}
            aria-hidden="true"
            className={cn('h-4 w-4 shrink-0', statusColorClass, statusIconClass)}
          />
          <span>
            {order.order_number ? `#${order.order_number} · ` : ''}
            {order.table}
            {order.seat_number ? ` · ${t('Seat', lang)} ${order.seat_number}` : ''} &middot;{' '}
            {t(STATUS_LABEL[order.status], lang)}
            {!connected && ` (${t('reconnecting...', lang)})`}
          </span>
        </span>
        {expanded ? (
          <IoChevronDown className="h-4 w-auto shrink-0" />
        ) : (
          <IoChevronUp className="h-4 w-auto shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          {order.status !== 'cancelled' && (
            <div className="flex items-center gap-1">
              {STEP_ORDER.map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    i <= stepIndex ? 'bg-menu-primary' : 'bg-menu-neutral/30',
                  )}
                />
              ))}
            </div>
          )}

          {placedAt && (
            <p className="text-xs text-menu-neutral">
              {t('Placed', lang)} <span className="font-bold text-menu-text">{placedAt}</span>
            </p>
          )}

          {(order.guest_name || order.notes) && (
            <div className="flex flex-col gap-1 text-xs">
              {order.guest_name && (
                <p className="text-menu-neutral break-words">
                  {t('For', lang)}{' '}
                  <span className="font-bold text-menu-text">{order.guest_name}</span>
                </p>
              )}
              {order.notes && (
                <p className="text-menu-neutral whitespace-pre-line break-words">
                  <span className="font-bold text-menu-text">{t('Note', lang)}:</span>{' '}
                  {order.notes}
                </p>
              )}
            </div>
          )}

          <ul className="text-xs text-menu-neutral flex flex-col gap-0.5">
            {order.items.map((line, i) => (
              <li key={i}>
                {line.quantity}x {line.title}
                {line.modifiers && <span className="opacity-70"> ({line.modifiers})</span>}
              </li>
            ))}
          </ul>
          {order.show_prices !== false && <p className="text-xs font-bold">QAR {order.total}</p>}

          <div className="flex gap-2">
            {order.status === 'pending' && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded border border-red-400 text-red-500 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? t('Cancelling...', lang) : t('Cancel order', lang)}
              </button>
            )}
            {isTerminal && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs px-3 py-1.5 rounded border border-menu-primary/40 cursor-pointer flex items-center gap-1"
              >
                <IoClose className="h-3 w-auto" /> {t('Dismiss', lang)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const OrderTracker = () => {
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language
  const orderIds = useOrderTrackingStore((state) => state.orderIds)
  const removeOrderId = useOrderTrackingStore((state) => state.removeOrderId)
  const notifications = useBrowserNotifications()
  // ids reported by their card as completed/cancelled - "Dismiss all" only ever
  // clears these, never an order that's still pending/preparing/etc.
  const [terminalIds, setTerminalIds] = useState<Set<string>>(new Set())

  const handleTerminalChange = useCallback((orderId: string, isTerminal: boolean) => {
    setTerminalIds((prev) => {
      if (prev.has(orderId) === isTerminal) return prev
      const next = new Set(prev)
      if (isTerminal) next.add(orderId)
      else next.delete(orderId)
      return next
    })
  }, [])

  if (orderIds.length === 0) return null

  const cards = orderIds.map((id) => (
    <OrderTrackerCard
      key={id}
      orderId={id}
      onDismiss={() => removeOrderId(id)}
      notify={notifications.notify}
      onTerminalChange={handleTerminalChange}
    />
  ))

  const handleDismissAll = () => {
    orderIds.forEach((id) => {
      if (terminalIds.has(id)) removeOrderId(id)
    })
  }

  return (
    <div className="w-full flex flex-col gap-2 mb-2">
      <NotificationPrompt
        permission={notifications.permission}
        onEnable={() => void notifications.requestPermission()}
      />
      {orderIds.length > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDismissAll}
            className="text-xs px-2.5 py-1 rounded border border-menu-primary/40 cursor-pointer flex items-center gap-1"
          >
            <IoClose className="h-3 w-auto" /> {t('Dismiss all', lang)}
          </button>
        </div>
      )}
      {orderIds.length > 1 ? (
        <CarouselFilters showButtons={false} showDots slideSize="100%">
          {cards}
        </CarouselFilters>
      ) : (
        cards[0]
      )}
    </div>
  )
}

export default OrderTracker
