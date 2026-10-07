'use client'

import { BlockFilter, Menu, MenuCategory, MenuMedia, MenuPage, Restaurant } from '@/payload-types'
import { RenderBlocks, RenderBlocksProps } from '@/app/(frontend)/fnb/menu/_components/render-blocks'
import { cn } from '@/utilities/cn'
import { useCallback, useEffect, useState } from 'react'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'
import Modal from '@/app/(frontend)/fnb/menu/_components/modal'
import ViewItem from '@/app/(frontend)/fnb/menu/_components/view-item'
import {
  ROOT_KEYS,
  UNCATEGORIZED_CATEGORY,
  useMenuStore,
  useRestaurantStore,
} from '@/app/(frontend)/fnb/menu/_store/store'
import { useCartStore } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import TablePicker from '@/app/(frontend)/fnb/menu/_components/ordering/table-picker'
import SeatPicker from '@/app/(frontend)/fnb/menu/_components/ordering/seat-picker'
import CartBar from '@/app/(frontend)/fnb/menu/_components/ordering/cart-bar'
import ScrollToTopButton from '@/app/(frontend)/fnb/menu/_components/scroll-to-top-button'
import { useElementHeight } from '@/app/(frontend)/fnb/menu/_hooks/useElementHeight'
import { resolveTableAction, type OrderingContext } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { usePathname } from 'next/navigation'

// MenuPage['c']['blk'] is generated as `BlockSection[]`, but the block-type union
// RenderBlocks actually handles (header/filter/items/etc.) only shows up once you
// pull the element type back out of RenderBlocksProps's own (wider) `blocks` union -
// mirrors how RenderBlocks/getBlockKey already treat this field loosely at runtime.
type PageBlock = NonNullable<RenderBlocksProps['blocks']>[number]

// Every real page/event wraps its whole block list in exactly one top-level `section`
// block (verified against launch-party/twiga-page's actual stored data - `c.blk` is
// `[{ blockType: 'section', c: { blks: [header, filter, items, ...] } }]`, not
// [header, filter, items] directly) - blocks/section.tsx is what unwraps that today,
// rendering `block.c.blks` inside its own `px-4 py-2` padded div. This unwraps the
// same single section so the header/filter/items composition can be matched below.
const unwrapSingleSection = (blocks: PageBlock[] | undefined): PageBlock[] | undefined => {
  if (blocks?.length === 1 && blocks[0].blockType === 'section') {
    return blocks[0].c?.blks || []
  }
  return blocks
}

// The sticky shell (task-12C-7, reworked by 12C-8 for the carousel) only applies to the
// two block compositions actually used across real pages/events today - [header, filter,
// items] (no carousel configured) or [header, carousel, filter, items] (task-12C-8).
// Anything else (extra blocks, a different order, more than one items block) falls back
// to today's plain window-scrolling render untouched - see task-12C-7 §2.1 for why a
// fully generic "sticky everything before the first items block" system isn't built here.
interface StickyShellBlocks {
  header: PageBlock
  carousel: PageBlock | null
  filter: PageBlock
  items: PageBlock
}

const getStickyShellBlocks = (blocks: PageBlock[] | undefined): StickyShellBlocks | null => {
  const innerBlocks = unwrapSingleSection(blocks)
  if (!innerBlocks) return null

  if (innerBlocks.length === 3) {
    const [header, filter, items] = innerBlocks
    if (header.blockType === 'header' && filter.blockType === 'filter' && items.blockType === 'items') {
      return { header, carousel: null, filter, items }
    }
    return null
  }

  if (innerBlocks.length === 4) {
    const [header, carousel, filter, items] = innerBlocks
    if (
      header.blockType === 'header' &&
      carousel.blockType === 'carousel' &&
      filter.blockType === 'filter' &&
      items.blockType === 'items'
    ) {
      return { header, carousel, filter, items }
    }
    return null
  }

  return null
}

const FnbMenu = ({
  initialData: content,
  tableParam,
  orderingContext,
}: {
  initialData: MenuPage
  tableParam?: string
  orderingContext?: OrderingContext
}) => {
  const {
    selectedItemSlug,
    selectedLanguage,
    handleSelectItem,
    setCategories,
    addAnalytics,
    isPreview,
  } = useMenuNav()
  const setRestaurant = useRestaurantStore((state) => state.setRestaurant)
  const setOrderingEnabled = useRestaurantStore((state) => state.setOrderingEnabled)
  const setShowPrices = useRestaurantStore((state) => state.setShowPrices)
  const setOrderingContext = useRestaurantStore((state) => state.setOrderingContext)
  const orderingEnabled = useRestaurantStore((state) => state.orderingEnabled)
  const setTableId = useCartStore((state) => state.setTableId)
  const syncCartPage = useCartStore((state) => state.syncPage)
  const setItemsScrollElement = useMenuStore((state) => state.setItemsScrollElement)
  const setShowSearch = useMenuStore((state) => state.setShowSearch)
  // A stable ref callback, not an inline arrow function - an inline `ref={(el) => ...}`
  // gets a new identity every render, so React detaches/reattaches it (re-running the
  // setState inside) on *every* render, not just mount/unmount - that fed straight back
  // into a "Maximum update depth exceeded" loop. setItemsScrollElement is itself a
  // stable zustand action reference, so this callback never changes identity.
  const itemsScrollRef = useCallback(
    (el: HTMLElement | null) => setItemsScrollElement(el),
    [setItemsScrollElement],
  )
  // Filter's sticky `top` tracks header's actual rendered height (task-12C-8's stacked
  // sticky layout) - varies with font size, logo presence, translated text length, so
  // it's measured, not hardcoded.
  const headerHeight = useElementHeight()
  const pathname = usePathname()
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const [seatPickerOpen, setSeatPickerOpen] = useState(false)

  useEffect(() => {
    // Drop a stale cart (table/seat/items) when this is a different ordering
    // page than the one the persisted cart belongs to.
    if (content?.info?.slug) {
      syncCartPage(content.info.slug)
    }

    fillCategories()

    if (content?.restaurant) {
      setRestaurant(content?.restaurant as Restaurant)
    }

    const pageBlocks = unwrapSingleSection(content?.c?.blk)
    const filterBlock = pageBlocks?.find((b) => b.blockType === 'filter') as BlockFilter | undefined
    setShowSearch(filterBlock?.c?.showSearch !== false)

    setOrderingEnabled(!!content?.c?.ordering_enabled)
    setShowPrices(content?.c?.show_prices !== false)
    setOrderingContext(orderingContext ?? null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  useEffect(() => {
    if (!content?.restaurant || !tableParam) return

    const restaurantId = (content.restaurant as Restaurant).id

    resolveTableAction(tableParam, restaurantId).then((result) => {
      if (result.success && result.data) {
        setTableId(result.data.id)
      }
    })
  }, [content?.restaurant, tableParam, setTableId])

  useEffect(() => {
    addAnalytics('page_view', pathname, {}, isPreview)
  }, [])

  // Item data itself is fetched on demand per category (see _hooks/useMenuItems.ts) - the
  // page.tsx fetch no longer embeds menu_items, so this only builds the category tab list.
  const fillCategories = () => {
    const menus = (content?.c?.menus || []) as Menu[]
    const categories = [] as MenuCategory[]

    for (const menu of menus) {
      if (menu?.category) {
        categories.push(menu.category as MenuCategory)
      }
    }

    categories.push(UNCATEGORIZED_CATEGORY)

    setCategories(categories)
  }

  if (!content) return <p>No content</p>

  const stickyShell = getStickyShellBlocks(content?.c?.blk)

  return (
    <>
      <style>{css(content)}</style>
      {/* Hide the sticky shell's own scroll pane's scrollbar entirely - it now spans
          header/carousel/filter/items together (task-12C-8's stacked sticky rework), so a
          scrollbar can't apply to just the items portion the way it could when items had
          its own separate scroll container; phone-first touch scrolling doesn't need a
          persistent visual scrollbar anyway. Firefox via scrollbar-width, everything else
          via the webkit pseudo-element, -ms-overflow-style for legacy Edge. */}
      <style>{`
        .fnb-menu-items-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .fnb-menu-items-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <Modal isOpen={!!selectedItemSlug} onClick={() => handleSelectItem()}>
        {selectedItemSlug && (
          <ViewItem selectedItemSlug={selectedItemSlug} handleClose={() => handleSelectItem()} />
        )}
      </Modal>

      {orderingEnabled && content?.restaurant && (
        <>
          <TablePicker
            restaurantId={(content.restaurant as Restaurant).id}
            isOpen={tablePickerOpen}
            onClose={() => setTablePickerOpen(false)}
          />
          <SeatPicker isOpen={seatPickerOpen} onClose={() => setSeatPickerOpen(false)} />
          <CartBar
            onRequestTable={() => setTablePickerOpen(true)}
            onRequestSeat={() => setSeatPickerOpen(true)}
          />
        </>
      )}

      {stickyShell ? (
        // Stacked sticky shell (task-12C-7, reworked by 12C-8 for the carousel): one
        // single scrollable container holds header, carousel (if configured), filter,
        // and items in normal document order. Header sticks at the very top; filter
        // sticks directly below it (top = header's measured height) once scrolled past
        // the carousel; carousel/items are plain flowing content that scrolls underneath
        // both. `h-dvh` (not `vh`) so mobile browser chrome showing/hiding doesn't
        // over/undershoot the real visible area.
        <div
          className={cn(
            `bg-menu-background`,
            `text-menu-text`,
            content.adv?.className || '',
            'w-full h-dvh flex flex-col',
          )}
          dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="mx-auto w-full max-w-md h-full flex flex-col relative">
            {/* px-4/pb-10 replicate blocks/section.tsx's own wrapper padding (the single
                top-level section block these are unwrapped from - see
                getStickyShellBlocks) now that header/carousel/filter/items render
                outside it directly. The matching top padding lives on the header's own
                box below, NOT here - a scroll container's own top padding shifts where a
                sticky child's "stuck" position lands (sticky offsets are resolved against
                the scrollport's padding edge), which left a permanent gap at the true
                viewport top where the carousel peeked through once header was stuck. */}
            <div
              ref={itemsScrollRef}
              className="fnb-menu-items-scroll flex-1 min-h-0 overflow-y-auto px-4 pb-10"
            >
              {/* z-20/bg so items/carousel scrolling underneath never show through once
                  stuck; pt-2 lives in the header's own box (see above) so its background
                  covers all the way to the true top instead of leaving a gap outside it.
                  RenderBlocksProps['blocks'] typing note - see PageBlock above. */}
              <div ref={headerHeight.ref} className="sticky top-0 z-20 bg-menu-background pt-2">
                <RenderBlocks
                  blocks={[stickyShell.header] as unknown as RenderBlocksProps['blocks']}
                />
              </div>
              {stickyShell.carousel && (
                <RenderBlocks
                  blocks={[stickyShell.carousel] as unknown as RenderBlocksProps['blocks']}
                />
              )}
              <div
                className="sticky z-10 bg-menu-background"
                style={{ top: headerHeight.height }}
              >
                <RenderBlocks
                  blocks={[stickyShell.filter] as unknown as RenderBlocksProps['blocks']}
                />
              </div>
              <RenderBlocks blocks={[stickyShell.items] as unknown as RenderBlocksProps['blocks']} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            `bg-menu-background`,
            `text-menu-text`,
            content.adv?.className || '',
            'w-full h-full min-h-screen',
          )}
          dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          <div
            className={cn(
              'mx-auto w-full max-w-md h-full flex flex-col items-center justify-center relative pb-10',
            )}
          >
            <RenderBlocks blocks={content?.c?.blk} />
          </div>
        </div>
      )}

      {/* Fixed to the viewport bottom like CartBar, but z-30 keeps it underneath
          CartBar's z-95 - CartBar covers it whenever the cart has items, and it's the
          only thing visible at the bottom otherwise. bg-menu-background matches the
          page so it reads as part of the page, not a contrasting bar. */}
      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md bg-menu-background">
        <div className="h-10 p-2">
          <h6 className="text-sm font-menu-tertiary font-light text-menu-primary/20 text-center menu-footer">
            Powered by Doha Oasis IT Team
          </h6>
        </div>
      </div>

      <ScrollToTopButton />
    </>
  )
}

const css = (data: MenuPage) => {
  const styles = ['']
  const { c } = data
  const vars = [
    `${ROOT_KEYS.PRIMARY}: ${c?.primary || 'black'};`,
    `${ROOT_KEYS.PRIMARY_CONTRAST}: ${c?.primary_contrast || 'white'};`,
    `${ROOT_KEYS.BACKGROUND}: ${c?.bg || 'white'};`,
    `${ROOT_KEYS.BACKGROUND_CARD}: ${c?.bg_card || 'white'};`,
    `${ROOT_KEYS.TEXT}: ${c?.text || 'black'};`,
    `${ROOT_KEYS.NEUTRAL}: ${c?.neutral || 'gray'};`,
  ]

  const getFileType = (fileName: string) => {
    const parts = fileName.split('.')
    return parts[parts.length - 1]
  }

  const getFileName = (fileName: string, type: string) => {
    if (!fileName) return ''
    const name = fileName.replace(`.${type}`, '')
    return `${name}`
  }

  const getFontFormat = (type: string) => {
    switch (type) {
      case 'woff2':
        return 'woff2'
      case 'woff':
        return 'woff'
      case 'ttf':
        return 'truetype'
      case 'otf':
        return 'opentype'
      default:
        return 'woff2'
    }
  }

  const getFontFaceStyle = (font: MenuMedia) => {
    const type = getFileType(font?.filename || '')
    const fileName = getFileName(font?.filename || '', type)
    const format = getFontFormat(type)
    const url = font?.url || ''

    return {
      fileName: fileName,
      css: `
        @font-face {
          font-family: "${fileName}";
          src: local("${fileName}"), url(${url}) format("${format}");
          font-weight: normal;
          font-style: normal;
        }
      `,
    }
  }

  if (data?.c?.font_primary) {
    const font = getFontFaceStyle(data.c.font_primary as MenuMedia)
    vars.push(`${ROOT_KEYS.FONT_PRIMARY}: "${font.fileName}";`)
    styles.push(font.css)
  }
  if (data?.c?.font_secondary) {
    const font = getFontFaceStyle(data.c.font_secondary as MenuMedia)
    vars.push(`${ROOT_KEYS.FONT_SECONDARY}: "${font.fileName}";`)
    styles.push(font.css)
  }

  const root = [`:root {`, vars.join('\n'), `}`].join('\n')
  styles.push(root)
  styles.push(data.adv?.css ? data.adv.css : '')
  return styles.join('\n')
}

export default FnbMenu
