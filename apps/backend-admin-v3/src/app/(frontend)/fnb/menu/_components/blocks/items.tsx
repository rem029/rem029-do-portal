'use client'

import { Fragment, useMemo } from 'react'
import {
  BlockItems as BlockItemsType,
  MenuAllergen,
  MenuCategory,
  MenuItem,
} from '@/payload-types'
import {
  MenuItemWithCategory,
  UNCATEGORIZED_CATEGORY_SLUG,
  useMenuStore,
  useRestaurantStore,
} from '@/app/(frontend)/fnb/menu/_store/store'
import { cn } from '@/utilities/cn'
import MenuCard from '@/app/(frontend)/fnb/menu/_components/cards'
import MenuCardSkeleton from '@/app/(frontend)/fnb/menu/_components/menu-card-skeleton'
import useMenuItems from '@/app/(frontend)/fnb/menu/_hooks/useMenuItems'
import { useInfiniteScroll } from '@/app/(frontend)/fnb/menu/_hooks/useInfiniteScroll'
import OrderTracker from '@/app/(frontend)/fnb/menu/_components/ordering/order-tracker'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import { Language, t } from '@/utilities/translations'

interface BlockItemsProps {
  block: BlockItemsType
}

interface CategoryGroup {
  category: MenuCategory
  items: MenuItemWithCategory[]
}

const groupItemsByCategory = (
  items: MenuItemWithCategory[],
  categories: MenuCategory[],
): CategoryGroup[] => {
  const itemsMap = new Map<string, MenuItemWithCategory[]>()
  for (const item of items) {
    const list = itemsMap.get(item.categorySlug)
    if (list) {
      list.push(item)
    } else {
      itemsMap.set(item.categorySlug, [item])
    }
  }

  const groups: CategoryGroup[] = []
  for (const category of categories) {
    const categoryItems = itemsMap.get(category.slug)
    if (categoryItems && categoryItems.length > 0) {
      groups.push({
        category,
        items: categoryItems,
      })
    }
  }
  return groups
}

export const BlockItems = ({ block }: BlockItemsProps) => {
  const { title, description } = block?.c || {}

  const filters = useMenuStore((state) => state.filters)
  const categories = useMenuStore((state) => state.categories)
  // Null on a page that didn't match the sticky-header/filter shell (fnb-menu.tsx's
  // isStickyShellLayout) - both hooks below already fall back to plain window/viewport
  // behavior when their container/root is null, so no extra branching is needed here.
  const itemsScrollElement = useMenuStore((state) => state.itemsScrollElement)
  const orderingEnabled = useRestaurantStore((state) => state.orderingEnabled)
  const { items, isLoadingItems, hasMore, loadNextCategory } = useMenuItems()
  const { selectedLanguage } = useMenuNav()

  // This list no longer reacts to search at all - search results only ever render
  // inside the search overlay (search-overlay.tsx). Grouping is purely category-driven.
  const isGrouping = !filters?.category

  const filteredItems = useMemo(() => {
    let filtered = items

    // availability and allergens stay client-side filters over whatever's currently
    // loaded - category selection and search are what actually decide what gets fetched
    // (see _hooks/useMenuItems.ts)
    if (filters?.availability && filters.availability !== 'all_day') {
      filtered = filtered.filter((i) => {
        const item = i.item as MenuItem
        const availability = item.availability_period || []
        // if item has no availability, show it (all day)
        if (availability.length === 0) return true
        return availability.includes(filters.availability!)
      })
    }

    if (filters?.allergens && filters.allergens.length > 0) {
      filtered = filtered.filter((i) => {
        const itemAllergens = (i.item?.allergen || []) as MenuAllergen[]
        // if item has any of the filtered allergens, keep it
        const hasAllergen = itemAllergens.some((a) => {
          const allergenSlug = typeof a === 'string' ? a : a.slug
          return filters.allergens?.includes(allergenSlug || '')
        })
        return hasAllergen
      })
    }

    return filtered
  }, [items, filters])

  const groupedItems = useMemo(() => {
    if (!isGrouping) return []
    return groupItemsByCategory(filteredItems, categories)
  }, [isGrouping, filteredItems, categories])

  // The "Others" heading is only meaningful alongside a real category to distinguish
  // it from - with nothing else grouped, label it or not, it's still everything on the
  // page, so skip the redundant heading and just list the items directly.
  const hasRealCategoryGroup = groupedItems.some(
    (g) => g.category.slug !== UNCATEGORIZED_CATEGORY_SLUG,
  )

  const { triggerRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: loadNextCategory,
    root: itemsScrollElement,
  })

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('flex flex-col gap-4', block?.settings?.className)}>
        {orderingEnabled && <OrderTracker />}
        {(title || description) && (
          <div className="flex flex-col items-start gap-1">
            {title && (
              <h2 className={cn('text-base font-bold font-menu-primary text-menu-primary menu-section-heading')}>
                {title}
              </h2>
            )}
            {description && (
              <p className={cn('text-xs text-menu-neutral font-menu-tertiary font-light leading-relaxed menu-section-subheading')}>
                {description}
              </p>
            )}
          </div>
        )}

        {isGrouping ? (
          groupedItems.map((group) => {
            const { category, items: groupItems } = group
            const isUncategorized = category.slug === UNCATEGORIZED_CATEGORY_SLUG
            const showHeading = !isUncategorized || hasRealCategoryGroup
            return (
              <Fragment key={category.id || category.slug}>
                {showHeading && (
                  <h3
                    className={cn(
                      'text-base font-semibold font-menu-primary text-menu-primary mt-4 menu-category-heading',
                    )}
                  >
                    {category.title || 'No Title'}
                  </h3>
                )}
                {groupItems.map((i, idx) => {
                  const item = i.item as MenuItem
                  return <MenuCard key={item.id} item={item} position={idx} />
                })}
              </Fragment>
            )
          })
        ) : (
          filteredItems?.map((i, idx) => {
            const item = i.item as MenuItem
            return <MenuCard key={item.id} item={item} position={idx} />
          })
        )}

        {hasMore && <div ref={triggerRef} className="h-1 w-full" />}

        {isLoadingItems && (
          <div className="flex flex-col gap-3">
            <MenuCardSkeleton />
            <MenuCardSkeleton />
            <MenuCardSkeleton />
          </div>
        )}

        {!isLoadingItems && filteredItems.length === 0 && (
          <p className={cn('text-sm', `text-menu-neutral`)}>{t('No items found', (selectedLanguage || 'en') as Language)}</p>
        )}

        {/* Clears the fixed-bottom CartBar (cart-bar.tsx, z-95), which otherwise
            overlaps the last card when the page doesn't scroll far enough past it. */}
        <div className="h-8" aria-hidden />
      </div>
    </>
  )
}
