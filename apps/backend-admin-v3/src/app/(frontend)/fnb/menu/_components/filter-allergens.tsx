'use client'

import useMenuNav from '../_hooks/useMenuNav'
import { cn } from '@/utilities/cn'
import { useEffect } from 'react'

const FilterAllergens = () => {
  const { selectedLanguage, handleSelectAllergens, allergens, filters, fetchAllergens } =
    useMenuNav()

  useEffect(() => {
    fetchAllergens(selectedLanguage || 'en')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  const handleFilters = (value: string, position?: number) => {
    handleSelectAllergens(value, position)
  }

  return (
    <div className={cn('w-full p-0 m-0 rounded-none')}>
      <div className={cn('transition-all duration-150', 'grid grid-cols-4 py-2 gap-4')}>
        {allergens &&
          allergens?.map((a, pos) => {
            const checked = filters.allergens?.includes(a.slug)
            const id = `filter-allergen-${a.id}`
            return (
              <div key={id} className="form-control w-full">
                <label className="label cursor-pointer w-full">
                  <span
                    className={cn(
                      `grow label-text font-menu-secondary menu-allergen-filter-chip`,
                      checked ? `text-menu-primary text-sm!` : `text-menu-neutral text-xs!`,
                    )}
                  >
                    {a.title}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    className={cn('checkbox checkbox-xs', checked && `checked:bg-menu-neutral`)}
                    onChange={() => handleFilters(a.slug, pos + 1)}
                  />
                </label>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default FilterAllergens
