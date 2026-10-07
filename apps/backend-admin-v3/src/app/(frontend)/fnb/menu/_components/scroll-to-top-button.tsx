'use client'

import { useEffect, useState } from 'react'
import { IoArrowUp } from 'react-icons/io5'
import { cn } from '@/utilities/cn'
import { useMenuStore } from '@/app/(frontend)/fnb/menu/_store/store'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import { Language, t } from '@/utilities/translations'

// Past one screen's worth of scrolling, offer a shortcut back to the top -
// mirrors CartBar/the footer's own "fixed, centered to the max-w-md column"
// wrapper trick (fnb-menu.tsx) so it lines up with the page on wide viewports
// instead of drifting to the real viewport edge.
const SCROLL_THRESHOLD = 400

const ScrollToTopButton = () => {
  // Set only on the sticky-header/filter shell (task-12C-7), where items scrolls in
  // its own container instead of the window - null falls back to the page's own
  // window scrolling, same as before that task.
  const itemsScrollElement = useMenuStore((state) => state.itemsScrollElement)
  const { selectedLanguage } = useMenuNav()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const getScrollTop = () =>
      itemsScrollElement ? itemsScrollElement.scrollTop : window.scrollY

    const handleScroll = () => setVisible(getScrollTop() > SCROLL_THRESHOLD)
    handleScroll()

    const target: HTMLElement | Window = itemsScrollElement ?? window
    target.addEventListener('scroll', handleScroll, { passive: true })
    return () => target.removeEventListener('scroll', handleScroll)
  }, [itemsScrollElement])

  const scrollToTop = () => {
    if (itemsScrollElement) {
      itemsScrollElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    // z-40: above the "Powered by" footer (z-30) so it's never hidden behind it,
    // below CartBar (z-95) so an open cart naturally covers it instead of the two
    // fighting for the same corner.
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md pointer-events-none">
      <button
        type="button"
        aria-label={t('Scroll to top', (selectedLanguage || 'en') as Language)}
        onClick={scrollToTop}
        tabIndex={visible ? 0 : -1}
        className={cn(
          // h-9/w-9 (36px) is the small-but-still-tappable floor here - smaller than
          // the 44px "comfortable" touch target, but this button is a convenience
          // shortcut, not a primary action, so it can trade a little of that margin
          // for a lighter footprint over the item list.
          'absolute bottom-24 right-4 flex h-9 w-9 items-center justify-center rounded-full',
          'bg-menu-primary text-menu-primary-contrast shadow-lg cursor-pointer',
          'transition-all duration-200 ease-out motion-reduce:transition-none',
          visible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none',
        )}
      >
        <IoArrowUp className="h-4 w-4" />
      </button>
    </div>
  )
}

export default ScrollToTopButton
