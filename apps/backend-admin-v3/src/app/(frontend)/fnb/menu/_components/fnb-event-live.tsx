'use client'

import { BACKEND_URL, BASE_PATH } from '@/utilities/constant'
import { MenuPage } from '@/payload-types'
import { useLivePreview } from '@payloadcms/live-preview-react'
import FnbMenu from '@/app/(frontend)/fnb/menu/_components/fnb-menu'
import type { OrderingContext } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { buildEventLayoutBlocks } from '@/collections/public/fnb-menu-events/hooks/compile-layout'

// Live preview for fnb-menu-events. Unlike menu-pages, events compile their
// friendly fields (c.header/carousel/filter/items) into c.blk via a server
// hook on save - live preview only syncs raw fields, so we recompile c.blk
// client-side here with the same function, or skip it when adv.show_layout
// is on (manual block edits shouldn't be overwritten).
//
// initialData is typed MenuPage, not FnbMenuEvent - same structural cast
// page.tsx's resolvePage already does; the fields FnbMenu reads line up.
const FnbEventLive = ({ initialData }: { initialData: MenuPage }) => {
  const { data } = useLivePreview<MenuPage>({
    initialData,
    serverURL: BACKEND_URL,
    apiRoute: BASE_PATH ? `${BASE_PATH}/api` : `/api`,
    depth: 5,
  })

  const synced = data || initialData
  // Structural cast: adv/c are fnb-menu-events-only fields not on MenuPage's type.
  const eventFields = synced as unknown as {
    c?: Record<string, unknown>
    adv?: { show_layout?: boolean }
  }
  const c = eventFields.c
  const showLayoutBuilder = !!eventFields.adv?.show_layout

  const page = showLayoutBuilder
    ? synced
    : {
        ...synced,
        c: {
          ...c,
          blk: buildEventLayoutBlocks(c, synced.info?.slug || 'event') as unknown as MenuPage['c']['blk'],
        },
      }

  const orderingContext: OrderingContext = {
    collection: 'fnb-menu-events',
    slug: page.info?.slug || '',
  }

  return <FnbMenu initialData={page} orderingContext={orderingContext} />
}

export default FnbEventLive
