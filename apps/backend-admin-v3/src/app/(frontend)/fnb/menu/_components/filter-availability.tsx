'use client'

import { cn } from '@/utilities/cn'
import useMenuNav from '../_hooks/useMenuNav'
import { MenuItemAvailability } from '../_store/store'

const AVAILABILITY: { label: string; value: MenuItemAvailability }[] = [
  { label: 'All Day', value: 'all_day' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
]

import CarouselFilters from '@/common/components/embla-carousel/carousel-filters'
import { Language, t } from '@/utilities/translations'

const FilterAvailability = () => {
  const { selectedAvailability, handleSelectAvailability, selectedLanguage } = useMenuNav()

  const handleFilters = (value: MenuItemAvailability, pos: number) => {
    handleSelectAvailability(value, pos)
  }

  return (
    <CarouselFilters showButtons={false}>
      {AVAILABILITY.map((a, pos) => {
        const selected = selectedAvailability
          ? selectedAvailability === a.value
          : a.value === 'all_day'
        return (
          <button
            key={a.value}
            className={cn(
              'category-chip cursor-pointer h-6 px-2.5 flex items-center justify-center font-menu-secondary rounded-full text-[11px]! whitespace-nowrap transition-all w-full menu-availability-chip',
              selected && 'font-bold',
            )}
            onClick={() => handleFilters(a.value, pos)}
          >
            {t(a.label, (selectedLanguage || 'en') as Language)}
          </button>
        )
      })}
    </CarouselFilters>
  )
}

export default FilterAvailability
