'use client'

import { BACKEND_URL, BACKEND_URL_WITH_BASE, BASE_PATH } from '@/utilities/constant'
import { SitePage as SitePageType } from '@/payload-types'
import { useLivePreview } from '@payloadcms/live-preview-react'
import SitePage from '@/app/(frontend)/page/_components/site-page'

const SitePageLive = ({ initialData }: { initialData: SitePageType }) => {
  const { data } = useLivePreview({
    initialData: initialData,
    serverURL: BACKEND_URL,
    apiRoute: BASE_PATH ? `${BASE_PATH}/api` : `/api`,
    depth: 5,
  })

  return <SitePage initialData={(data as SitePageType) || initialData} />
}

export default SitePageLive
