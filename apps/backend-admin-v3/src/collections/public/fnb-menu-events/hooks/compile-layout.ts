import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Synthesizes a fixed page layout (Section -> Header, Carousel?, Filter, Items) from the
 * friendly admin fields (c.header/c.carousel/c.filter/c.items). Pulled out of
 * compileEventLayout so fnb-event-live.tsx can recompile c.blk client-side too.
 *
 * Block ids are stable per document (not fresh on every recompute) so live
 * preview doesn't remount every block per keystroke, but namespaced with
 * `keyBase` (the event's slug) so they don't collide with another event's
 * blocks - Payload's Postgres adapter keys these rows globally, not per
 * parent doc, so a literal id like `'header'` is a one-events-only resource.
 */
export const buildEventLayoutBlocks = (
  c: Record<string, unknown> | undefined,
  keyBase: string,
): Record<string, unknown>[] => {
  const header = (c?.header as Record<string, unknown> | undefined) ?? {}
  const carousel = (c?.carousel as Record<string, unknown> | undefined) ?? {}
  const filter = (c?.filter as Record<string, unknown> | undefined) ?? {}
  const items = (c?.items as Record<string, unknown> | undefined) ?? {}

  const subBlocks: Record<string, unknown>[] = []

  // 1. Header block
  subBlocks.push({
    id: `header-${keyBase}`,
    blockType: 'header',
    blockName: null,
    c: {
      label: header.label || null,
      logo: header.logo || null,
      show_language: header.show_language !== false,
    },
    settings: { className: null, css: null },
  })

  // 2. Carousel block (only if at least one image is configured) - blocks/carousel.tsx
  // itself also renders nothing for an empty slide list, so this is belt-and-suspenders
  // for the common case, not the only thing keeping an empty carousel off the page.
  //
  // Slide ids are stable (keyBase + index), same reasoning as the top-level block ids
  // above: this hook rebuilds c.blk from scratch on every save, and slides[].image is a
  // localized upload field, so a fresh (unstable) id here would make each save's write
  // create a brand-new DB row for the current locale only - silently discarding whatever
  // other locale's image was saved into the previous row instead of merging into it.
  const carouselImages =
    (carousel.images as Array<{ image?: string | null } | null> | undefined) ?? []
  const carouselSlides = carouselImages
    .filter((img): img is { image: string } => !!img?.image)
    .map((img, index) => ({ id: `carousel-${keyBase}-slide-${index}`, image: img.image }))
  if (carouselSlides.length > 0) {
    subBlocks.push({
      id: `carousel-${keyBase}`,
      blockType: 'carousel',
      blockName: null,
      c: {
        slides: carouselSlides,
      },
      settings: {},
    })
  }

  // 3. Filter block (only if filter.enabled is not explicitly false)
  if (filter.enabled !== false) {
    subBlocks.push({
      id: `filter-${keyBase}`,
      blockType: 'filter',
      blockName: null,
      c: {
        showSearch: filter.show_search !== false,
        showAllergenFilters: filter.show_allergen_filters !== false,
        showAvailabilityFilters: filter.show_availability_filters === true,
      },
      settings: {},
    })
  }

  // 4. Items block
  subBlocks.push({
    id: `items-${keyBase}`,
    blockType: 'items',
    blockName: null,
    c: {
      title: items.title || null,
      description: items.description || null,
    },
    settings: { className: null, css: null },
  })

  // Section wrapper
  const section: Record<string, unknown> = {
    id: `section-${keyBase}`,
    blockType: 'section',
    blockName: null,
    c: {
      blks: subBlocks,
    },
    settings: {},
  }

  return [section]
}

/**
 * Synthesizes a fixed page layout (Section -> Header, Carousel?, Filter, Items) from the
 * friendly admin fields into c.blk on save, unless adv.show_layout is enabled.
 */
export const compileEventLayout: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data

  const wasAdvanced = !!(originalDoc?.adv as { show_layout?: boolean } | undefined)?.show_layout
  const isAdvanced = !!(data?.adv as { show_layout?: boolean } | undefined)?.show_layout

  // If power user enabled the raw layout builder, stop overwriting manual block edits on
  // every later save - but not on the very save that flips it on, so c.blk is seeded from
  // whatever the simple fields (possibly just edited in this same save) currently hold,
  // instead of the builder opening on a stale layout from before the toggle was checked.
  if (isAdvanced && wasAdvanced) {
    return data
  }

  const c = {
    ...((originalDoc?.c as Record<string, unknown> | undefined) ?? {}),
    ...((data.c as Record<string, unknown> | undefined) ?? {}),
  }

  // info.slug is required and already set (setOperatorSlugCollection runs first)
  const info = (data.info as { slug?: string } | undefined) ?? (originalDoc?.info as { slug?: string } | undefined)
  const keyBase = info?.slug || (data.id as string | undefined) || (originalDoc?.id as string | undefined) || 'event'

  data.c = {
    ...c,
    // Structural cast: synthesize layout blocks matching BlockSection schema
    blk: buildEventLayoutBlocks(c, keyBase) as unknown as NonNullable<Record<string, unknown>>[],
  }

  return data
}
