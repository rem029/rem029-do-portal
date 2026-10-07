import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import React from 'react'
import SitePage from '@/app/(frontend)/page/_components/site-page'
import SitePageLive from '@/app/(frontend)/page/_components/site-page-live'
import { Config, SitePage as SitePageType } from '@/payload-types'
import { cache } from 'react'
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const fetchSitePage = async (slug: string, lang: Config['locale']) => {
  const payload = await getPayload({ config })
  const { logger } = payload

  logger.info(`fetchSitePage.slug ${slug} [${lang}]`)

  const pages = await payload.find({
    collection: 'site-pages',
    locale: lang,
    where: {
      'info.slug': {
        equals: slug,
      },
    },
    overrideAccess: true,
    depth: 5,
  })
  return pages.docs[0] as SitePageType | undefined
}

const getSitePage = cache(async (slug: string, lang: Config['locale']) => {
  return await fetchSitePage(slug, lang)
})

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const pages = await payload.find({
    collection: 'site-pages',
    limit: 100,
    overrideAccess: true,
    select: {
      info: true,
    },
  })

  return pages.docs.map((page) => ({
    slug: (page.info as any)?.slug,
  }))
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params
  const { lang: langQuery } = await searchParams
  const lang = ((Array.isArray(langQuery) ? langQuery[0] : langQuery) as Config['locale']) || 'en'

  const page = await getSitePage(slug, lang)

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: `${page.seo?.title || page.info?.title || 'Page'} | Doha Oasis`,
    description: page.seo?.description || `Explore this page.`,
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview, lang: langQuery } = await searchParams

  const lang = ((Array.isArray(langQuery) ? langQuery[0] : langQuery) as Config['locale']) || 'en'

  const isPreview = preview === 'true'
  const page = isPreview ? await fetchSitePage(slug, lang) : await getSitePage(slug, lang)

  if (!page) {
    return notFound()
  }

  if (isPreview) {
    return <SitePageLive initialData={page} />
  }

  return <SitePage initialData={page} />
}
