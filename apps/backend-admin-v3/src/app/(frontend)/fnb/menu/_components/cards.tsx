'use client'

import { cn } from '@/utilities/cn'
import { FaPlus } from 'react-icons/fa'
import { MenuMedia, MenuAllergen, MenuItem } from '@/payload-types'
import useMenuNav from '../_hooks/useMenuNav'
import Image from 'next/image'
import { Language, t } from '@/utilities/translations'
import { useRestaurantStore } from '@/app/(frontend)/fnb/menu/_store/store'
import ItemQuantityControl from '@/app/(frontend)/fnb/menu/_components/ordering/item-quantity-control'

interface MenuCardProps {
  item: MenuItem
  position?: number
}

const MenuCard = ({ item, position }: MenuCardProps) => {
  const { handleSelectItem, selectedLanguage } = useMenuNav()
  const orderingEnabled = useRestaurantStore((state) => state.orderingEnabled)
  const showPrices = useRestaurantStore((state) => state.showPrices)
  const image = item?.image as MenuMedia
  // Any modifier group - required or optional - needs its own picker, which only the
  // detail view has room for. Card-level quick add stays limited to plain items.
  const hasModifierGroups = (item.modifier_groups || []).length > 0

  const openItem = () => handleSelectItem(item.slug, position)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${item.title}`}
      className={cn(
        'flex flex-row items-stretch cursor-pointer transition-colors',
        'bg-menu-background-card',
        'border-b-[0.5px] border-menu-neutral/40',
        'rounded-lg',
        'overflow-hidden shadow-xs',
        'hover:bg-menu-primary/5',
        'focus-visible:outline-2 focus-visible:outline-menu-primary focus-visible:outline-offset-[-2px]',
      )}
      onClick={openItem}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openItem()
        }
      }}
    >
      {image && (image as MenuMedia)?.url && (
        <div className="relative flex w-28 sm:w-32 h-auto aspect-square overflow-hidden shrink-0">
          <Image
            src={(image as MenuMedia).url!}
            alt={(image as MenuMedia).filename || 'menu-item'}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 128px, 128px"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-2.5 gap-1.5">
        <h6 className={cn('text-xs sm:text-sm font-bold font-menu-primary text-menu-primary line-clamp-1 menu-card-title')}>
          {item.title}
        </h6>
        {item?.description && (
          <p className={cn('text-xs font-menu-tertiary font-light text-menu-text line-clamp-2 leading-relaxed menu-card-description')}>
            {item?.description}
          </p>
        )}

        {item?.allergen && item?.allergen.length > 0 && (
          <div className="flex flex-row gap-1 flex-wrap items-end">
            {item?.allergen.slice(0, 3).map((a, aidx) => {
              const allergen = a as MenuAllergen
              const akey = allergen?.id || aidx
              const imgSrc = (allergen?.image as MenuMedia)?.url || ''
              const title = allergen?.title || ''

              return (
                <span
                  key={akey}
                  className={cn(
                    'text-[11px] leading-none',
                    'text-menu-neutral',
                    'border-[0.5px] border-menu-neutral',
                    'rounded-lg',
                    'px-1 py-0.5',
                    'inline-flex items-center',
                    'm-0!',
                  )}
                >
                  <span className="mr-1 font-menu-tertiary font-light menu-allergen-value">{title}</span>
                  {imgSrc && <img className="aspect-square w-2 h-auto" src={imgSrc} />}
                </span>
              )
            })}

            {item?.allergen.length > 3 && (
              <span className={cn('text-[11px]', 'text-menu-neutral')}>...</span>
            )}
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            {showPrices && item?.price ? (
              <span className={cn('font-bold font-menu-primary text-xs sm:text-sm text-menu-text menu-price')}>
                QAR {item?.price}
              </span>
            ) : (
              // Keep the add-to-cart control right-aligned when the price is hidden.
              <span aria-hidden />
            )}
            {item?.in_stock === false && (
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  'bg-error/15 text-error border border-error/30',
                )}
              >
                {t(`Out of stock`, (selectedLanguage || 'en') as Language)}
              </span>
            )}
          </div>

          {orderingEnabled &&
            (item?.in_stock === false ? (
              <button
                type="button"
                disabled
                aria-label={t(`Out of stock`, (selectedLanguage || 'en') as Language)}
                className={cn(
                  'flex items-center justify-center',
                  'w-fit max-w-[120px] h-6 px-2.5 border-box rounded-full',
                  'bg-menu-neutral/15 text-menu-neutral',
                  'cursor-not-allowed text-[11px] font-menu-secondary font-medium opacity-60 menu-badge',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="leading-normal">
                  {t(`Out of stock`, (selectedLanguage || 'en') as Language)}
                </span>
              </button>
            ) : hasModifierGroups ? (
              <button
                type="button"
                aria-label={t('Add to cart', (selectedLanguage || 'en') as Language)}
                className={cn(
                  'flex items-center justify-center gap-1',
                  'w-fit max-w-[120px] h-6 px-2.5 border-box rounded-full',
                  'bg-menu-primary text-menu-primary-contrast',
                  'cursor-pointer text-[11px] font-menu-secondary font-medium menu-add-to-cart',
                  'shadow-xs hover:opacity-90 transition-opacity',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  openItem()
                }}
              >
                <span className="leading-normal">
                  {t(`Add to cart`, (selectedLanguage || 'en') as Language)}
                </span>
                <FaPlus className="h-2 w-auto" />
              </button>
            ) : (
              <ItemQuantityControl itemId={item.id} />
            ))}
        </div>
      </div>
    </div>
  )
}

export default MenuCard
