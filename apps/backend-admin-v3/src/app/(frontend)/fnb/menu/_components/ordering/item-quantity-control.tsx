'use client'

import { cn } from '@/utilities/cn'
import { useCartStore, SelectedModifierGroup } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import { FaMinus, FaPlus } from 'react-icons/fa'
import { t, Language } from '@/utilities/translations'
import useMenuNav from '../../_hooks/useMenuNav'

interface ItemQuantityControlProps {
  itemId: string
  selectedModifiers?: SelectedModifierGroup[]
  disabled?: boolean
}

const ItemQuantityControl = ({
  itemId,
  selectedModifiers = [],
  disabled = false,
}: ItemQuantityControlProps) => {
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language
  const quantity = useCartStore((state) => state.getQuantity(itemId, selectedModifiers))
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <div
      className={cn('flex flex-row items-center gap-2', 'text-menu-primary')}
      onClick={(e) => e.stopPropagation()}
    >
      {quantity > 0 && (
        <>
          <button
            type="button"
            aria-label={t('Remove one', lang)}
            className={cn(
              'flex items-center justify-center',
              'w-8 h-8 border-box rounded-full border-[0.5px] border-menu-primary',
              'cursor-pointer',
            )}
            onClick={() => removeItem(itemId, selectedModifiers)}
          >
            <FaMinus className="h-2.5 w-auto" />
          </button>
          <span className="text-xs font-bold font-menu-primary min-w-3 text-center menu-quantity-value">
            {quantity}
          </span>
        </>
      )}
      <button
        type="button"
        aria-label={t('Add to cart', lang)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center',
          'transition-[width,height] duration-300',
          quantity === 0
            ? 'w-fit max-w-[120px] h-6 px-2 border-box rounded-full'
            : 'w-8 h-8 border-box rounded-full',
          'bg-menu-primary text-menu-primary-contrast',
          'cursor-pointer',
          disabled && 'opacity-40 cursor-not-allowed',
          'text-[11px]',
          'gap-1',
        )}
        onClick={() => {
          if (disabled) return
          addItem(itemId, selectedModifiers)
        }}
      >
        {quantity === 0 && (
          <span className="font-menu-secondary leading-normal menu-add-to-cart">
            {t('Add to cart', lang)}
          </span>
        )}

        <FaPlus className="h-2.5 w-auto" />
      </button>
    </div>
  )
}

export default ItemQuantityControl
