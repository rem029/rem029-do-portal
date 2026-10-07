'use client'

import { BlockFilter as BlockFilterType, MenuCategory } from '@/payload-types'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import { UNCATEGORIZED_CATEGORY_SLUG, useMenuStore } from '@/app/(frontend)/fnb/menu/_store/store'
import { cn } from '@/utilities/cn'
import FilterCategories from '@/app/(frontend)/fnb/menu/_components/filter-categories'
import FilterAllergens from '@/app/(frontend)/fnb/menu/_components/filter-allergens'
import FilterAvailability from '@/app/(frontend)/fnb/menu/_components/filter-availability'
import { IoFilter } from 'react-icons/io5'
import { Language, t } from '@/utilities/translations'

interface BlockFilterProps {
  block: BlockFilterType
}

export const BlockFilter = ({ block }: BlockFilterProps) => {
  const { showFilters, setShowFilters, selectedLanguage } = useMenuNav()
  const categories = useMenuStore((state) => state.categories)

  // Availability and Allergens share one funnel-toggled panel, each opt-in via its own checkbox.
  const showAvailability = !!block?.c?.showAvailabilityFilters
  const showAllergens = !!block?.c?.showAllergenFilters
  const showFunnelButton = showAvailability || showAllergens
  // Uncategorized items surface under "All" but don't get their own tab (see
  // filter-categories.tsx) - exclude the synthetic entry here too, or a restaurant with
  // exactly one real category plus uncategorized items would wrongly show a filter bar
  // with nothing meaningful to filter by.
  const realCategoryCount = (categories || []).filter(
    (c) => (c as MenuCategory).slug !== UNCATEGORIZED_CATEGORY_SLUG,
  ).length
  const hasCategories = realCategoryCount > 1

  const toggleShowFilters = () => {
    setShowFilters(!showFilters)
  }

  // With 0 or 1 category and no funnel button, there is nothing to filter by
  if (!hasCategories && !showFunnelButton) return null

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div className={cn('flex flex-col w-full py-1', block?.settings?.className)}>
        <div className="w-full py-1 flex flex-row items-center gap-2">
          {hasCategories && (
            <div className="overflow-hidden flex-1 h-10 rounded-full bg-menu-background-card shadow-sm px-2 flex items-center">
              <FilterCategories variant="text" />
            </div>
          )}

          {showFunnelButton && (
            <button
              type="button"
              aria-label={t('Filter', (selectedLanguage || 'en') as Language)}
              className={cn(
                'size-10 rounded-full bg-menu-background-card shadow-sm flex items-center justify-center shrink-0 transition-colors duration-200 cursor-pointer',
                showFilters
                  ? 'text-menu-primary'
                  : 'text-menu-neutral hover:text-menu-primary-contrast',
                !hasCategories && 'ms-auto',
              )}
              onClick={toggleShowFilters}
            >
              <IoFilter className="text-xl" />
            </button>
          )}
        </div>

        {showFunnelButton && showFilters && (
          <div className="flex flex-col w-full gap-2 pt-1 pb-2">
            {showAvailability && (
              <div className="overflow-hidden">
                <FilterAvailability />
              </div>
            )}

            {showAllergens && (
              <div className={cn('flex flex-col w-full items-start justify-start')}>
                <FilterAllergens />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
