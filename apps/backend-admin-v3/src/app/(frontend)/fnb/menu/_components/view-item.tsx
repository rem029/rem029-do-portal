'use client'

import { useEffect, useState } from 'react'
import { MenuAllergen, MenuItem, MenuMedia } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { IoClose } from 'react-icons/io5'
import { FaPlus } from 'react-icons/fa'
import { usePathname } from 'next/navigation'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import Image from 'next/image'
import { t, Language } from '@/utilities/translations'
import { useRestaurantStore } from '@/app/(frontend)/fnb/menu/_store/store'
import { useCartStore, SelectedModifierGroup } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import { getMenuItemBySlugAction } from '@/app/(frontend)/fnb/menu/_actions'

type ModifierGroup = NonNullable<MenuItem['modifier_groups']>[number]

interface ViewItemProps {
  selectedItemSlug: string
  handleClose?: () => void
}

const ViewItem = ({ selectedItemSlug, handleClose }: ViewItemProps) => {
  const { selectedLanguage, isPreview, addAnalytics } = useMenuNav()
  const orderingEnabled = useRestaurantStore((state) => state.orderingEnabled)
  const showPrices = useRestaurantStore((state) => state.showPrices)
  const restaurant = useRestaurantStore((state) => state.restaurant)
  const addItem = useCartStore((state) => state.addItem)
  const pathname = usePathname()

  // Fetched directly by slug rather than looked up from a preloaded item list - items are
  // now only in memory for categories the user has actually browsed (see useMenuItems.ts),
  // so a deep-linked `?item=` slug or a click from a not-yet-loaded category's card
  // wouldn't otherwise be resolvable.
  const [item, setItem] = useState<MenuItem | undefined>(undefined)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})

  useEffect(() => {
    // Reset in-progress selections whenever a different item is opened, rather
    // than carrying the previous item's picks into this one.
    setAnswers({})
  }, [selectedItemSlug])

  useEffect(() => {
    if (!selectedItemSlug || !restaurant?.id) {
      setItem(undefined)
      return
    }

    let cancelled = false
    getMenuItemBySlugAction(restaurant.id, selectedItemSlug, selectedLanguage || 'en').then(
      (result) => {
        if (cancelled) return
        setItem(result.success ? result.data : undefined)
      },
    )

    return () => {
      cancelled = true
    }
  }, [selectedItemSlug, restaurant?.id, selectedLanguage])

  useEffect(() => {
    if (selectedItemSlug) {
      addAnalytics(
        'page_view',
        pathname,
        { additionalData: { selectedItemSlug } },
        isPreview,
        'view_item',
      )
    }
  }, [selectedItemSlug])

  if (!item) return <></>

  const modifierGroups = (item.modifier_groups || []) as ModifierGroup[]

  const toggleSelection = (group: ModifierGroup, label: string) => {
    setAnswers((prev) => {
      const current = prev[group.name] || []
      if (group.input_type === 'radio') {
        return { ...prev, [group.name]: [label] }
      }
      const next = current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label]
      return { ...prev, [group.name]: next }
    })
  }

  const selectedModifiers: SelectedModifierGroup[] = modifierGroups
    .map((group) => ({ groupName: group.name, selections: answers[group.name] || [] }))
    .filter((group) => group.selections.length > 0)

  const missingRequiredGroup = modifierGroups.some(
    (group) => group.required && (answers[group.name] || []).length === 0,
  )

  const isOutOfStock = item?.in_stock === false

  // The detail view is a commit step: add this exact configuration once and
  // close. Quantity is adjusted from the cart, not here - re-opening the item
  // to tweak modifiers would just make a different line anyway.
  const handleAddToCart = () => {
    if (missingRequiredGroup || isOutOfStock) return
    addItem(item!.id, selectedModifiers)
    handleClose?.()
  }

  return (
    <div
      className={cn(
        'rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden',
        'flex flex-col',
        'relative',
        `bg-menu-background-card`,
      )}
      dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
    >
      {item?.image ? (
        <div className="relative shrink-0">
          <div
            className={cn(
              'absolute top-0 w-full h-10 p-2',
              'flex flex-row items-center justify-between',
              'transition-all duration-150',
              `bg-menu-primary/10 hover:bg-menu-primary/50`,
              `z-[100]`,
            )}
          >
            <span>{/* spacer */}</span>
            <button
              aria-label={t('Close', (selectedLanguage || 'en') as Language)}
              className={cn(
                'text-white',
                'flex flex-row items-center gap-1',
                'cursor-pointer',
                `text-menu-primary`,
              )}
              onClick={() => {
                handleClose ? handleClose() : null
              }}
            >
              <IoClose className="inline h-6 w-auto text-menu-primary-contrast" />
            </button>
          </div>

          <div className="relative aspect-video w-full">
            <Image
              className="object-cover"
              src={(item?.image as MenuMedia)?.url || ''}
              alt={(item?.image as MenuMedia)?.filename || 'menu-item'}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'w-full h-10 p-2 shrink-0',
            'flex flex-row items-center justify-between',
            'transition-all duration-150',
            `bg-transparent`,
          )}
        >
          <span>{/* spacer */}</span>
          <button
            aria-label={t('Close', (selectedLanguage || 'en') as Language)}
            className={cn('text-white', 'flex flex-row items-center gap-1', 'cursor-pointer')}
            onClick={() => {
              handleClose ? handleClose() : null
            }}
          >
            <IoClose className="inline h-6 w-auto text-menu-primary" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <h6 className={cn('text-menu-primary font-menu-primary menu-item-title', 'text-lg', 'font-bold')}>
            {item.title}
          </h6>
          {isOutOfStock && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                'bg-error/15 text-error border border-error/30',
              )}
            >
              {t(`Out of stock`, (selectedLanguage || 'en') as Language)}
            </span>
          )}
        </div>
        {item?.description && (
          <p
            className={cn(
              'text-menu-neutral font-menu-secondary menu-item-description',
              'text-xs',
              `line-clamp-3`,
              `min-h-12`,
            )}
          >
            {item?.description}
          </p>
        )}

        <div className="flex flex-1 flex-col">
          <p className={cn('text-menu-neutral font-menu-secondary menu-section-label', 'text-[11px]')}>
            {t(`Allergens`, (selectedLanguage || 'en') as Language)}
          </p>
          {item?.allergen && item?.allergen.length > 0 && (
            <div className="flex flex-row gap-1 flex-wrap items-end">
              {item?.allergen?.map((a, aidx) => {
                const allergen = a as MenuAllergen
                const akey = allergen?.id || aidx
                const imgSrc = (allergen?.image as MenuMedia)?.url || ''

                return (
                  <span
                    key={akey}
                    className={cn(
                      'text-[11px] leading-none',
                      `text-menu-neutral`,
                      `border-[0.5px]`,
                      `border-menu-neutral`,
                      `rounded-lg`,
                      `px-1 py-0.5`,
                      `inline-flex items-center`,
                      `m-0!`,
                    )}
                  >
                    <span className="mr-1">{allergen?.title}</span>
                    {imgSrc && <img className="aspect-square w-2 h-auto" src={imgSrc} />}
                  </span>
                )
              })}
            </div>
          )}

          {item?.allergen?.length === 0 && (
            <span className={cn(`text-menu-neutral font-menu-tertiary font-light menu-allergen-value`, 'text-[11px]')}>
              {t(`None`, (selectedLanguage || 'en') as Language)}
            </span>
          )}
        </div>

        {modifierGroups.length > 0 && (
          <div className="flex flex-col gap-5">
            {modifierGroups.map((group) => {
              const groupAnswered = (answers[group.name] || []).length > 0
              return (
                <div key={group.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-menu-text font-menu-secondary menu-modifier-title', 'text-sm font-bold')}>
                      {group.name}
                    </p>
                    {group.required && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5',
                          'text-[10px] font-menu-secondary font-bold uppercase tracking-wide menu-badge',
                          groupAnswered
                            ? 'bg-menu-primary/10 text-menu-primary'
                            : 'bg-menu-primary text-menu-primary-contrast',
                        )}
                      >
                        {t(`Required`, (selectedLanguage || 'en') as Language)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {(group.options || []).map((option) => {
                      const checked = (answers[group.name] || []).includes(option.label)
                      return (
                        <label
                          key={option.label}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-2',
                            'border transition-colors cursor-pointer',
                            'text-xs font-menu-tertiary font-light text-menu-text menu-modifier-option',
                            checked
                              ? 'border-menu-primary bg-menu-primary/5'
                              : 'border-menu-primary/15 hover:border-menu-primary/40',
                          )}
                        >
                          <input
                            type={group.input_type === 'radio' ? 'radio' : 'checkbox'}
                            name={group.name}
                            checked={checked}
                            onChange={() => toggleSelection(group, option.label)}
                            className={cn(
                              group.input_type === 'radio'
                                ? 'radio radio-xs'
                                : 'checkbox checkbox-xs',
                              'shrink-0',
                              '[--input-color:var(--primary-color)]',
                              group.input_type === 'checkbox' && 'text-menu-primary-contrast',
                              group.input_type === 'radio' &&
                                '[--color-base-100:var(--background-card-color)]',
                            )}
                          />
                          {option.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={cn('shrink-0 flex flex-col gap-1.5 p-4', 'border-t border-menu-primary/10')}>
        {missingRequiredGroup && (
          <p className={cn('text-[11px] font-menu-tertiary font-light text-menu-neutral text-center menu-helper-text')}>
            {t(
              `Select the required options above to continue`,
              (selectedLanguage || 'en') as Language,
            )}
          </p>
        )}
        <div className="flex flex-row items-center justify-between gap-2">
          {showPrices && item?.price ? (
            <span className={cn(`text-menu-text font-menu-primary menu-price`, 'font-bold', `text-lg`)}>
              QAR {item?.price}
            </span>
          ) : (
            // Keep the quantity control right-aligned when the price is hidden.
            <span aria-hidden />
          )}
          {orderingEnabled && (
            <button
              type="button"
              aria-label={
                isOutOfStock
                  ? t(`Out of stock`, (selectedLanguage || 'en') as Language)
                  : t(`Add to cart`, (selectedLanguage || 'en') as Language)
              }
              disabled={missingRequiredGroup || isOutOfStock}
              onClick={handleAddToCart}
              className={cn(
                'flex items-center justify-center gap-1.5',
                'h-9 px-4 rounded-full',
                isOutOfStock
                  ? 'bg-menu-neutral/15 text-menu-neutral cursor-not-allowed opacity-60'
                  : 'bg-menu-primary text-menu-primary-contrast cursor-pointer',
                'text-xs font-bold font-menu-secondary menu-add-to-cart',
                'transition-opacity',
                missingRequiredGroup && !isOutOfStock && 'opacity-40 cursor-not-allowed',
              )}
            >
              <span className="leading-normal">
                {isOutOfStock
                  ? t(`Out of stock`, (selectedLanguage || 'en') as Language)
                  : t(`Add to cart`, (selectedLanguage || 'en') as Language)}
              </span>
              {!isOutOfStock && <FaPlus className="h-2.5 w-auto" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewItem
