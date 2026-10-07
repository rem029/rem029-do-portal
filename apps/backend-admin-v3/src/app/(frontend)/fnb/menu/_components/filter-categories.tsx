'use client'

import { cn } from '@/utilities/cn'
import { MenuCategory } from '@/payload-types'
import useMenuNav from '../_hooks/useMenuNav'
import CarouselFilters from '@/common/components/embla-carousel/carousel-filters'
import { Language, t } from '@/utilities/translations'
import { UNCATEGORIZED_CATEGORY_SLUG } from '@/app/(frontend)/fnb/menu/_store/store'

interface FilterCategoriesProps {
  variant?: 'default' | 'text'
}

const FilterCategories = ({ variant = 'default' }: FilterCategoriesProps) => {
  const { selectedCategorySlug, handleSelectCategory, selectedLanguage, categories } = useMenuNav()

  const handleFilters = (slug: string | undefined, pos: number) => {
    handleSelectCategory(slug, pos)
  }

  // Uncategorized items surface under "All" (see useMenuItems.ts's aggregation), but
  // don't get their own tab - a dedicated "Uncategorized" filter is confusing UX for a
  // bucket guests didn't create. Real categories only, here and in the count below.
  const visibleCategories = (categories || []).filter(
    (c) => (c as MenuCategory).slug !== UNCATEGORIZED_CATEGORY_SLUG,
  )

  // With 0 or 1 real category, "All" and the sole category select the same
  // items — there's nothing meaningful left to filter by, so hide the bar.
  if (visibleCategories.length <= 1) return null

  return (
    <CarouselFilters
      showButtons={false}
      showDots={false}
      slideSize="auto"
      slideSpacing="0.25rem"
      className="h-full"
    >
      <button
        type="button"
        style={{ background: 'transparent' }}
        className={cn(
          'relative cursor-pointer px-3 py-1.5 font-menu-secondary text-xs whitespace-nowrap transition-all flex items-center justify-center h-full !bg-transparent menu-category-chip',
          !selectedCategorySlug
            ? '!text-menu-primary font-bold'
            : '!text-menu-neutral hover:!text-menu-text',
        )}
        onClick={() => handleFilters(undefined, 0)}
      >
        <span>{t('All', (selectedLanguage || 'en') as Language)}</span>
        {!selectedCategorySlug && (
          <span className="absolute bottom-0 left-2 right-2 h-1 bg-menu-primary rounded-full" />
        )}
      </button>
      {visibleCategories.map((category, pos) => {
        const c = category as MenuCategory
        const selected = selectedCategorySlug === c.slug
        return (
          <button
            key={c.id}
            type="button"
            style={{ background: 'transparent' }}
            className={cn(
              'relative cursor-pointer px-3 py-1.5 font-menu-secondary text-xs whitespace-nowrap transition-all flex items-center justify-center h-full !bg-transparent menu-category-chip',
              selected
                ? '!text-menu-primary font-bold'
                : '!text-menu-neutral hover:!text-menu-text',
            )}
            onClick={() => handleFilters(c.slug, pos + 1)}
          >
            <span>{c?.title || 'No Title'}</span>
            {selected && (
              <span className="absolute bottom-0 left-2 right-2 h-1 bg-menu-primary rounded-full" />
            )}
          </button>
        )
      })}
    </CarouselFilters>
  )
}

export default FilterCategories
