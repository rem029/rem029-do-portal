'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utilities/cn'
import { useCartStore } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import { useOrderTrackingStore } from '@/app/(frontend)/fnb/menu/_store/order-store'
import { useRestaurantStore } from '@/app/(frontend)/fnb/menu/_store/store'
import { getTableAction, placeOrderAction } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { getMenuItemsByIdsAction } from '@/app/(frontend)/fnb/menu/_actions'
import { MenuItem, MenuMedia, Table } from '@/payload-types'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import ItemQuantityControl from '@/app/(frontend)/fnb/menu/_components/ordering/item-quantity-control'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import { Language, t } from '@/utilities/translations'

interface CartBarProps {
  onRequestTable: () => void
  onRequestSeat: () => void
}

const CartBar = ({ onRequestTable, onRequestSeat }: CartBarProps) => {
  const { selectedLanguage } = useMenuNav()
  const lang = selectedLanguage as Language
  const lines = useCartStore((state) => state.lines)
  const tableId = useCartStore((state) => state.tableId)
  const seatNumber = useCartStore((state) => state.seatNumber)
  const guestName = useCartStore((state) => state.guestName)
  const notes = useCartStore((state) => state.notes)
  const setGuestName = useCartStore((state) => state.setGuestName)
  const setNotes = useCartStore((state) => state.setNotes)
  const clear = useCartStore((state) => state.clear)
  const addOrderId = useOrderTrackingStore((state) => state.addOrderId)
  const restaurant = useRestaurantStore((state) => state.restaurant)
  const showPrices = useRestaurantStore((state) => state.showPrices)
  const orderingContext = useRestaurantStore((state) => state.orderingContext)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | undefined>()
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | undefined>()
  const [itemsById, setItemsById] = useState<Map<string, MenuItem>>(new Map())
  const previewRef = useRef<HTMLDivElement>(null)

  // Panel stays mounted for the transition; inert while hidden keeps its fields out
  // of the tab order / a11y tree until opened.
  useEffect(() => {
    if (previewRef.current) previewRef.current.inert = !showPreview
  }, [showPreview])

  useEffect(() => {
    if (!tableId) {
      setSelectedTable(undefined)
      return
    }

    let cancelled = false
    getTableAction(tableId).then((result) => {
      if (!cancelled && result.success && result.data) {
        setSelectedTable(result.data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [tableId])

  // Cart lines persist across reloads but the item cache (useMenuItems) doesn't -
  // resolve cart line items by id here rather than from browsed categories.
  const lineItemIds = lines.map((l) => l.itemId).join(',')
  useEffect(() => {
    if (!restaurant?.id || lines.length === 0) return

    let cancelled = false
    getMenuItemsByIdsAction(
      restaurant.id,
      lines.map((l) => l.itemId),
      selectedLanguage || 'en',
    ).then((result) => {
      if (cancelled || !result.success || !result.data) return
      const map = new Map<string, MenuItem>()
      for (const item of result.data as MenuItem[]) {
        map.set(item.id, item)
      }
      setItemsById(map)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, lineItemIds, selectedLanguage])

  const { totalQuantity, totalPrice } = useMemo(() => {
    let qty = 0
    let price = 0
    for (const line of lines) {
      const item = itemsById.get(line.itemId)
      qty += line.quantity
      price += (item?.price || 0) * line.quantity
    }
    return { totalQuantity: qty, totalPrice: price }
  }, [lines, itemsById])

  // Stay mounted through the success window so the confirmation renders after clear().
  if (lines.length === 0 && !success) return null

  const handleOrder = async () => {
    if (!tableId) {
      onRequestTable()
      return
    }

    if (!seatNumber) {
      onRequestSeat()
      return
    }

    setSubmitting(true)
    setError(undefined)

    const result = await placeOrderAction(
      tableId,
      seatNumber,
      lines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        selectedModifiers: l.selectedModifiers,
      })),
      { guestName, notes },
      orderingContext ?? undefined,
    )

    setSubmitting(false)

    if (result.success && result.data) {
      clear()
      addOrderId(result.data.id)
      setOrderNumber(result.data.orderNumber ?? undefined)
      setSuccess(true)
      setShowPreview(false)
      setTimeout(() => setSuccess(false), 4000)
    } else {
      setError(result.error || t('Failed to place order', lang))
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-95 mx-auto w-full max-w-md">
      <div className="flex flex-col rounded-t-2xl overflow-hidden border-x border-t border-menu-neutral/30 shadow-lg">
        {/* grid-rows 0fr -> 1fr animates open without a hard-coded height; inner
            wrapper needs overflow-hidden to clip the collapse. */}
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
            showPreview ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div ref={previewRef} className="overflow-hidden">
            <div
              className={cn(
                'flex flex-col max-h-[55vh] overflow-y-auto bg-menu-background-card text-menu-text',
                'transition-opacity duration-200 ease-out motion-reduce:transition-none',
                showPreview ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div className="flex flex-row items-center justify-between px-3 pt-3 pb-1">
                <p className="text-sm font-bold font-menu-primary menu-cart-title">
                  {t('Your order', lang)}
                </p>
                {selectedTable && (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-bold font-menu-secondary text-menu-neutral menu-cart-meta">
                      {t('Table', lang)}: {selectedTable.label}
                      {seatNumber ? ` · ${t('Seat', lang)} ${seatNumber}` : ''}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-[10px] font-menu-secondary text-menu-neutral underline underline-offset-2 cursor-pointer menu-link"
                        onClick={onRequestTable}
                      >
                        {t('Switch table?', lang)}
                      </button>
                      <button
                        type="button"
                        className="text-[10px] font-menu-secondary text-menu-neutral underline underline-offset-2 cursor-pointer menu-link"
                        onClick={onRequestSeat}
                      >
                        {t('Change seat?', lang)}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <ul className="flex flex-col px-3">
                {lines.map((line) => {
                  const item = itemsById.get(line.itemId)
                  if (!item) return null
                  const image = item.image as MenuMedia | undefined

                  const modifiersText = line.selectedModifiers
                    .map((m) => m.selections.join(', '))
                    .filter(Boolean)
                    .join(' · ')

                  return (
                    <li
                      key={line.lineId}
                      className="flex flex-row items-center gap-3 py-2 border-b border-menu-primary/10 last:border-b-0"
                    >
                      {image?.url ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={image.url}
                            alt={image.filename || item.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-lg bg-menu-primary/10" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold font-menu-primary truncate menu-cart-item-title">
                          {item.title}
                        </p>
                        {modifiersText && (
                          <p className="text-[11px] font-menu-tertiary font-light text-menu-neutral truncate menu-cart-item-meta">
                            {modifiersText}
                          </p>
                        )}
                        {showPrices && (
                          <p className="text-xs font-menu-primary text-menu-neutral menu-price">
                            QAR {item.price}
                          </p>
                        )}
                      </div>
                      <ItemQuantityControl
                        itemId={line.itemId}
                        selectedModifiers={line.selectedModifiers}
                      />
                    </li>
                  )
                })}
              </ul>

              <div className="flex flex-col gap-3 px-3 py-3 border-t border-menu-primary/10">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cart-guest-name"
                    className="text-xs font-menu-tertiary font-light text-menu-neutral menu-form-label"
                  >
                    {t('Name', lang)} <span className="opacity-60">— {t('optional', lang)}</span>
                  </label>
                  <input
                    id="cart-guest-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    placeholder={t('So staff know whose order this is', lang)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-sm font-menu-tertiary font-light menu-form-input',
                      'bg-menu-background text-menu-text placeholder:text-menu-neutral',
                      'border border-menu-primary/20 outline-none',
                      'focus:border-menu-primary focus:ring-1 focus:ring-menu-primary/30',
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cart-notes"
                    className="text-xs font-menu-tertiary font-light text-menu-neutral menu-form-label"
                  >
                    {t('Special requests', lang)}{' '}
                    <span className="opacity-60">— {t('optional', lang)}</span>
                  </label>
                  <textarea
                    id="cart-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={t('Allergies, no ice, extra napkins…', lang)}
                    className={cn(
                      'w-full resize-none rounded-lg px-3 py-2 text-sm font-menu-tertiary font-light menu-form-input',
                      'bg-menu-background text-menu-text placeholder:text-menu-neutral',
                      'border border-menu-primary/20 outline-none',
                      'focus:border-menu-primary focus:ring-1 focus:ring-menu-primary/30',
                    )}
                  />
                </div>
              </div>

              {showPrices && (
                <div className="flex flex-row items-center justify-between px-3 py-3 border-t border-menu-primary/10">
                  <span className="text-xs font-menu-tertiary font-light text-menu-neutral menu-cart-meta">
                    {t('Total', lang)}
                  </span>
                  <span className="text-sm font-bold font-menu-primary menu-price">
                    QAR {totalPrice}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-menu-primary text-menu-primary-contrast">
          {error && <p className="text-xs text-red-200">{error}</p>}
          {success ? (
            <p className="text-sm font-menu-tertiary font-light text-center py-1 menu-helper-text">
              {`${t('Order', lang)}${orderNumber ? ` #${orderNumber}` : ''} ${t(
                'placed! The kitchen has received your order.',
                lang,
              )}`}
            </p>
          ) : (
            <div className="flex flex-row items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-menu-primary-contrast/50 px-2.5 py-1 text-xs font-menu-secondary w-fit cursor-pointer menu-link"
                onClick={() => setShowPreview((v) => !v)}
              >
                <span>
                  {totalQuantity} {t(totalQuantity === 1 ? 'item' : 'items', lang)}
                  {showPrices ? ` · QAR ${totalPrice}` : ''}
                </span>
                {showPreview ? (
                  <IoChevronDown className="h-3 w-auto" />
                ) : (
                  <IoChevronUp className="h-3 w-auto" />
                )}
              </button>
              <button
                type="button"
                disabled={submitting}
                className={cn(
                  'rounded-lg bg-menu-primary-contrast text-menu-primary',
                  'px-4 py-2 text-sm font-bold font-menu-secondary menu-add-to-cart',
                  'cursor-pointer disabled:opacity-50',
                )}
                onClick={handleOrder}
              >
                {submitting
                  ? t('Placing order...', lang)
                  : !tableId
                    ? t('Select table to order', lang)
                    : !seatNumber
                      ? t('Select seat to order', lang)
                      : t('Order', lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartBar
