'use client'

import { BACKEND_URL, BASE_PATH } from '@/utilities/constant'
import { MenuPage } from '@/payload-types'
import { useLivePreview } from '@payloadcms/live-preview-react'
import FnbMenu from '@/app/(frontend)/fnb/menu/_components/fnb-menu'
import type { OrderingContext } from '@/app/(frontend)/fnb/menu/_actions/orders'

// Live preview for a menu-pages document. See fnb-event-live.tsx for the
// fnb-menu-events counterpart - page.tsx picks between the two by `kind`.
const FnbMenuLive = ({ initialData }: { initialData: MenuPage }) => {
  const { data } = useLivePreview<MenuPage>({
    initialData,
    serverURL: BACKEND_URL,
    apiRoute: BASE_PATH ? `${BASE_PATH}/api` : `/api`,
    depth: 5,
  })

  const page = data || initialData
  const orderingContext: OrderingContext = {
    collection: 'menu-pages',
    slug: page.info?.slug || '',
  }

  return <FnbMenu initialData={page} orderingContext={orderingContext} />
}

export default FnbMenuLive
