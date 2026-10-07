import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'
import FnbMenu from '@/app/(frontend)/fnb/menu/_components/fnb-menu'
import FnbMenuLive from '@/app/(frontend)/fnb/menu/_components/fnb-menu-live'
import FnbEventLive from '@/app/(frontend)/fnb/menu/_components/fnb-event-live'
import { Config, FnbMenuEvent, Menu, MenuPage } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const fetchMenuPage = async (
  slug: string,
  lang: Config['locale'],
  { preview = false }: { preview?: boolean } = {},
) => {
  const payload = await getPayload({ config })
  const { logger } = payload

  logger.info(`fetchMenuPage.slug ${slug} [${lang}]`)

  const pages = await payload.find({
    collection: 'menu-pages',
    locale: lang,
    where: {
      and: [
        { 'info.slug': { equals: slug } },
        // The main collection row always holds the latest saved data
        // (draft or published) — `find()` has no built-in published-only
        // filter, unlike `draft: true`'s versions-table path. Without this,
        // an unpublished draft edit is reachable on the public menu URL.
        // Live preview is the one place drafts should be visible.
        ...(preview ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
    overrideAccess: true,
    depth: 5,
    // Menu items are fetched on demand per category (see _actions/index.ts) instead of
    // being embedded here - a restaurant can have 100+ items across its categories, and
    // pulling them all into the initial SSR payload was the root cause of slow menu loads.
    populate: {
      menu: { category: true },
    },
  })
  return pages.docs[0] as MenuPage | undefined
}

const getMenuPage = cache(async (slug: string, lang: Config['locale']) => {
  return await fetchMenuPage(slug, lang)
})

const fetchEvent = async (
  slug: string,
  lang: Config['locale'],
  { preview = false }: { preview?: boolean } = {},
) => {
  const payload = await getPayload({ config })
  const { logger } = payload

  logger.info(`fetchEvent.slug ${slug} [${lang}]`)

  const events = await payload.find({
    collection: 'fnb-menu-events',
    locale: lang,
    where: {
      and: [
        { 'info.slug': { equals: slug } },
        // See fetchMenuPage's comment: only live preview should see a draft.
        ...(preview ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
    overrideAccess: true,
    depth: 5,
    populate: {
      menu: { category: true },
    },
  })
  return events.docs[0] as FnbMenuEvent | undefined
}

const getEvent = cache(async (slug: string, lang: Config['locale']) => {
  return await fetchEvent(slug, lang)
})

/**
 * A menu whose only linked item(s) are disabled (_status: draft) renders as an empty
 * category tab (groupItemsByCategory in blocks/items.tsx already hides an empty category
 * from the "All" list, but the tab bar itself is built from this raw `c.menus` list, so it
 * needs the same emptiness check applied up front).
 */
const filterMenusWithPublishedItems = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  restaurantId: string,
  menus: (string | Menu)[],
) => {
  if (menus.length === 0) return menus

  const { docs: menuDocs } = await payload.find({
    collection: 'menu',
    where: { restaurant: { equals: restaurantId } },
    depth: 1,
    limit: 0,
    overrideAccess: true,
  })

  const nonEmptyCategoryIds = new Set<string>()
  for (const m of menuDocs) {
    const catId = typeof m.category === 'object' && m.category ? m.category.id : m.category
    if (!catId) continue
    const hasPublishedItem = (m.menu_items || []).some(
      (mi) => mi.item && typeof mi.item === 'object' && mi.item._status !== 'draft',
    )
    if (hasPublishedItem) nonEmptyCategoryIds.add(String(catId))
  }

  return menus.filter((menuEntry) => {
    if (typeof menuEntry === 'string') return false
    const cat = menuEntry.category
    const catId = typeof cat === 'object' && cat ? cat.id : cat
    return Boolean(catId && nonEmptyCategoryIds.has(String(catId)))
  })
}

const resolvePage = async (
  slug: string,
  lang: Config['locale'],
  { preview }: { preview: boolean },
): Promise<{ kind: 'menu-page'; page: MenuPage } | { kind: 'event'; page: MenuPage } | null> => {
  const mp = preview ? await fetchMenuPage(slug, lang, { preview: true }) : await getMenuPage(slug, lang)
  if (mp) {
    return { kind: 'menu-page', page: mp }
  }

  const ev = preview ? await fetchEvent(slug, lang, { preview: true }) : await getEvent(slug, lang)
  if (ev) {
    // The event's own c.ordering_enabled / c.handlers / c.show_prices / theme / compiled
    // c.blk already match what FnbMenu reads; structural cast only (FnbMenuEvent vs MenuPage).
    return { kind: 'event', page: ev as unknown as MenuPage }
  }

  return null
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const [pages, events] = await Promise.all([
    payload.find({
      collection: 'menu-pages',
      limit: 100,
      overrideAccess: true,
      select: {
        info: true,
      },
    }),
    payload.find({
      collection: 'fnb-menu-events',
      limit: 100,
      overrideAccess: true,
      select: {
        info: true,
      },
    }),
  ])

  const menuPageSlugs = pages.docs
    .map((page) => page.info?.slug)
    .filter((slug): slug is string => Boolean(slug))

  const eventSlugs = events.docs
    .map((event) => event.info?.slug)
    .filter((slug): slug is string => Boolean(slug))

  return [...menuPageSlugs, ...eventSlugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params
  const { lang: langQuery } = await searchParams
  const lang = ((Array.isArray(langQuery) ? langQuery[0] : langQuery) as Config['locale']) || 'en'

  const page = (await getMenuPage(slug, lang)) ?? (await getEvent(slug, lang))

  if (!page) {
    return {
      title: 'Menu Not Found',
    }
  }

  const seoImageUrl =
    page.seo?.image && typeof page.seo.image === 'object'
      ? page.seo.image.url || `/api/media/file/${page.seo.image.filename}`
      : null

  return {
    title: `${page.seo?.title || page.info?.title || 'Menu'} | Doha Oasis`,
    description: page.seo?.description || `Explore our menu.`,
    openGraph: {
      images: seoImageUrl ? [seoImageUrl] : [],
    },
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { preview, lang: langQuery, table: tableQuery } = await searchParams

  const lang = ((Array.isArray(langQuery) ? langQuery[0] : langQuery) as Config['locale']) || 'en'
  const tableParam = Array.isArray(tableQuery) ? tableQuery[0] : tableQuery

  const isPreview = preview === 'true'
  const resolved = await resolvePage(slug, lang, { preview: isPreview })

  if (!resolved) {
    return notFound()
  }

  if (isPreview) {
    return resolved.kind === 'event' ? (
      <FnbEventLive initialData={resolved.page} />
    ) : (
      <FnbMenuLive initialData={resolved.page} />
    )
  }

  const restaurantId =
    typeof resolved.page.restaurant === 'object'
      ? resolved.page.restaurant?.id
      : resolved.page.restaurant

  if (restaurantId && resolved.page.c?.menus?.length) {
    const payload = await getPayload({ config })
    resolved.page.c.menus = await filterMenusWithPublishedItems(
      payload,
      restaurantId,
      resolved.page.c.menus,
    )
  }

  const orderingContext = {
    collection: resolved.kind === 'event' ? ('fnb-menu-events' as const) : ('menu-pages' as const),
    slug,
  }

  return <FnbMenu initialData={resolved.page} tableParam={tableParam} orderingContext={orderingContext} />
}
