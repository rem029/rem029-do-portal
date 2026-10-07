'use client'

import { BlockHeader as BlockHeaderType, MenuMedia } from '@/payload-types'
import { MdLanguage } from 'react-icons/md'
import { CiSearch } from 'react-icons/ci'
import { useMemo } from 'react'
import { cn } from '@/utilities/cn'
import { useRestaurantStore, useMenuStore } from '@/app/(frontend)/fnb/menu/_store/store'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import Image from 'next/image'
import SearchOverlay from '@/app/(frontend)/fnb/menu/_components/search-overlay'
import { Language, t } from '@/utilities/translations'

interface BlockHeaderProps {
  block: BlockHeaderType
}

export const BlockHeader = ({ block }: BlockHeaderProps) => {
  const { handleSelectLanguage, selectedLanguage, filters } = useMenuNav()
  const restaurant = useRestaurantStore((state) => state.restaurant)
  const setSearchOverlayOpen = useMenuStore((state) => state.setSearchOverlayOpen)
  const showSearch = useMenuStore((state) => state.showSearch)

  const { label, logo } = useMemo(() => {
    let label = ''
    let logo: MenuMedia | null = null

    const labelBlock = block?.c?.label
    const logoBlock = block?.c?.logo

    label = labelBlock || restaurant?.title || 'Menu'
    logo = (logoBlock as MenuMedia) || ((restaurant as any)?.logo as MenuMedia) || null

    return {
      label,
      logo,
    }
  }, [block, restaurant])

  const handleLanguageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    handleSelectLanguage(e.target.checked ? 'en' : 'ar')
  }

  return (
    <>
      {block?.settings?.css && <style>{block.settings.css}</style>}
      <div
        className={cn(
          'w-full h-12 rounded-full bg-menu-background flex flex-row items-center justify-between gap-2',
          block?.settings?.className,
        )}
      >
        <div className="flex flex-row gap-2.5 items-center min-w-0 flex-1 overflow-hidden">
          {logo && (
            <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
              <Image
                className="object-contain"
                src={(logo as MenuMedia)?.url || ''}
                alt={(logo as MenuMedia)?.filename || 'logo'}
                fill
                sizes="32px"
              />
            </div>
          )}
          {label && (
            <h1
              className={cn(
                'm-0! truncate',
                'text-menu-primary',
                'text-sm! sm:text-xs!',
                'font-bold',
                'font-menu-primary',
                'menu-header-title',
              )}
            >
              {label}
            </h1>
          )}
        </div>

        <div className="flex flex-row gap-2 items-center shrink-0">
          {showSearch && (
            <button
              type="button"
              aria-label={t('Search', (selectedLanguage || 'en') as Language)}
              className={cn(
                'btn btn-circle btn-ghost btn-sm text-xl! shrink-0 transition-colors duration-200',
                filters?.search
                  ? 'text-menu-primary'
                  : 'text-menu-primary/80 hover:text-menu-primary-contrast',
              )}
              onClick={() => setSearchOverlayOpen(true)}
            >
              <CiSearch className="text-xl!" />
            </button>
          )}

          {block?.c?.show_language && (
            <div className="flex flex-row gap-1 items-center">
              <label className="swap">
                <input
                  type="checkbox"
                  onChange={handleLanguageChange}
                  checked={selectedLanguage !== 'ar'}
                />
                <div
                  className={cn('text-menu-primary', 'swap-on text-xs!', 'font-menu-primary/40')}
                >
                  EN
                </div>
                <div
                  className={cn('text-menu-primary', 'swap-off text-xs!', 'font-menu-primary/40')}
                >
                  AR
                </div>
              </label>
              <MdLanguage className={cn('text-menu-primary', 'h-4 w-auto')} />
            </div>
          )}
        </div>
      </div>

      {showSearch && <SearchOverlay />}
    </>
  )
}
