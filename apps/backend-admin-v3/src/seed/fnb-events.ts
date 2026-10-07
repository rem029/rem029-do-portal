import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'

/**
 * Seeds demo events for the FnB order system under a dedicated event restaurant.
 *
 * Left as drafts (like seedFnbMenu's menu pages) — publishing from a standalone
 * seed script trips Next's `revalidateTag` invariant in the afterChange hook.
 * Idempotent: skips anything that already exists, keyed on slug.
 */
export const seedFnbEvents = async ({ payload }: { payload: Payload }): Promise<void> => {
  const { logger } = payload
  logger.info('Seeding FnB demo events...')

  // 1a. Doha Oasis Operator
  const dohaOasisOperator = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })

  const doOperator = dohaOasisOperator.docs[0]
  if (!doOperator) {
    logger.error('Doha Oasis operator not found. Skipping FnB events seed.')
    return
  }

  // Dedicated event restaurant
  let eventsRestaurant = await createCollectionIfNotExists({
    payload,
    collection: 'restaurants',
    where: { slug: { equals: 'doha-oasis-events' } },
    data: {
      title: 'Doha Oasis Events',
      operator: doOperator.id,
      slug: 'doha-oasis-events',
      event_enabled: true,
    },
    overrideAccess: true,
  })

  if (!eventsRestaurant.event_enabled) {
    eventsRestaurant = await payload.update({
      collection: 'restaurants',
      id: eventsRestaurant.id,
      data: { event_enabled: true },
      overrideAccess: true,
    })
    logger.info('✓ Marked "doha-oasis-events" available for events')
  }

  // 1d. Tables for the event restaurant
  const tableData = [
    { label: 'Event Table 1', slug: 'event-table-1', seat_count: 8 },
    { label: 'Event Table 2', slug: 'event-table-2', seat_count: 8 },
    { label: 'Event Table 3', slug: 'event-table-3', seat_count: 8 },
  ]

  for (const t of tableData) {
    await createCollectionIfNotExists({
      payload,
      collection: 'tables',
      where: {
        and: [
          { restaurant: { equals: eventsRestaurant.id } },
          { label: { equals: t.label } },
        ],
      },
      data: {
        operator: doOperator.id,
        restaurant: eventsRestaurant.id,
        label: t.label,
        slug: t.slug,
        seat_count: t.seat_count,
      },
      overrideAccess: true,
    })
  }

  // 1b. 3 menu-categories: Canapés, Grill, Sweets
  const categoriesData = [
    { title: 'Canapés', slug: 'canapes' },
    { title: 'Grill', slug: 'grill' },
    { title: 'Sweets', slug: 'sweets' },
  ]

  const seededCategories: Record<string, { id: string }> = {}
  for (const cat of categoriesData) {
    const res = await createCollectionIfNotExists({
      payload,
      collection: 'menu-categories',
      where: {
        and: [
          { title: { equals: cat.title } },
          { operator: { equals: doOperator.id } },
        ],
      },
      data: {
        title: cat.title,
        operator: doOperator.id,
        slug: cat.slug,
        _status: 'published',
      },
      overrideAccess: true,
    })
    seededCategories[cat.slug] = res
  }

  const canapesCat = seededCategories['canapes']
  const grillCat = seededCategories['grill']
  const sweetsCat = seededCategories['sweets']

  // 15 menu-items (5 per category, all with restaurant, operator, category, slugs prefixed evt-)
  const items = [
    // Canapés
    {
      title: 'Beef Tartare Toast',
      price: 48,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-beef-tartare-toast',
    },
    {
      title: 'Tuna Tostada',
      price: 52,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-tuna-tostada',
    },
    {
      title: 'Burrata & Fig',
      price: 44,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-burrata-fig',
    },
    {
      title: 'Salmon Blini',
      price: 46,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-salmon-blini',
    },
    {
      title: 'Wild Mushroom Arancini',
      price: 38,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-wild-mushroom-arancini',
    },
    {
      title: 'Oyster Trio',
      price: 58,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-oyster-trio',
      modifier_groups: [
        {
          name: 'Preparation',
          input_type: 'radio' as const,
          required: true,
          options: [{ label: 'Au Naturel' }, { label: 'Mignonette' }, { label: 'Bloody Mary' }],
        },
        {
          name: 'Extras',
          input_type: 'checkbox' as const,
          required: false,
          options: [{ label: 'Extra Lemon' }, { label: 'Tabasco' }],
        },
      ],
    },
    {
      title: 'Mini Slider Duo',
      price: 46,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [canapesCat.id],
      slug: 'evt-mini-slider-duo',
      modifier_groups: [
        {
          name: 'Choose two',
          input_type: 'checkbox' as const,
          required: true,
          options: [
            { label: 'Wagyu' },
            { label: 'Buttermilk Chicken' },
            { label: 'Halloumi' },
            { label: 'Short Rib' },
          ],
        },
        {
          name: 'Bun',
          input_type: 'radio' as const,
          required: false,
          options: [{ label: 'Brioche' }, { label: 'Sesame' }],
        },
      ],
    },
    // Grill
    {
      title: 'Wagyu Skewer',
      price: 95,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-wagyu-skewer',
      modifier_groups: [
        {
          name: 'Add ons',
          input_type: 'checkbox' as const,
          required: false,
          options: [{ label: 'Truffle Mayo' }, { label: 'Chimichurri' }],
        },
      ],
    },
    {
      title: 'Lamb Chop',
      price: 88,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-lamb-chop',
    },
    {
      title: 'Grilled Prawns',
      price: 78,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-grilled-prawns',
    },
    {
      title: 'Miso Black Cod',
      price: 110,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-miso-black-cod',
    },
    {
      title: 'Charred Cauliflower Steak',
      price: 55,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-charred-cauliflower-steak',
    },
    {
      title: 'Tomahawk to Share',
      price: 285,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-tomahawk-to-share',
      modifier_groups: [
        {
          name: 'Doneness',
          input_type: 'radio' as const,
          required: true,
          options: [
            { label: 'Rare' },
            { label: 'Medium Rare' },
            { label: 'Medium' },
            { label: 'Well Done' },
          ],
        },
        {
          name: 'Sauces',
          input_type: 'checkbox' as const,
          required: false,
          options: [{ label: 'Béarnaise' }, { label: 'Peppercorn' }, { label: 'Chimichurri' }],
        },
      ],
    },
    {
      title: 'Whole Roasted Sea Bass',
      price: 98,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [grillCat.id],
      slug: 'evt-whole-roasted-sea-bass',
      modifier_groups: [
        {
          name: 'Finish',
          input_type: 'radio' as const,
          required: true,
          options: [{ label: 'Salt Crust' }, { label: 'Lemon & Herb' }, { label: 'Harissa Butter' }],
        },
        {
          name: 'Add a side',
          input_type: 'checkbox' as const,
          required: false,
          options: [{ label: 'Grilled Asparagus' }, { label: 'Saffron Rice' }],
        },
      ],
    },
    // Sweets
    {
      title: 'Pistachio Baklava Cheesecake',
      price: 36,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-pistachio-baklava-cheesecake',
    },
    {
      title: 'Dark Chocolate Fondant',
      price: 38,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-dark-chocolate-fondant',
    },
    {
      title: 'Saffron Panna Cotta',
      price: 34,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-saffron-panna-cotta',
    },
    {
      title: 'Date & Toffee Pudding',
      price: 32,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-date-toffee-pudding',
    },
    {
      title: 'Rosewater Mille-feuille',
      price: 35,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-rosewater-mille-feuille',
    },
    {
      title: 'Build-Your-Own Sundae',
      price: 40,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-build-your-own-sundae',
      modifier_groups: [
        {
          name: 'Ice cream base',
          input_type: 'radio' as const,
          required: true,
          options: [{ label: 'Vanilla Bean' }, { label: 'Pistachio' }, { label: 'Date & Honey' }],
        },
        {
          name: 'Toppings',
          input_type: 'checkbox' as const,
          required: false,
          options: [
            { label: 'Caramelised Nuts' },
            { label: 'Fresh Berries' },
            { label: 'Chocolate Pearls' },
            { label: 'Halva Crumble' },
          ],
        },
      ],
    },
    {
      title: 'Chocolate Fountain Plate',
      price: 44,
      restaurant: eventsRestaurant.id,
      operator: doOperator.id,
      category: [sweetsCat.id],
      slug: 'evt-chocolate-fountain-plate',
      modifier_groups: [
        {
          name: 'Dippers (pick at least one)',
          input_type: 'checkbox' as const,
          required: true,
          options: [
            { label: 'Strawberries' },
            { label: 'Marshmallow' },
            { label: 'Churros' },
            { label: 'Pretzel Bites' },
          ],
        },
        {
          name: 'Chocolate',
          input_type: 'radio' as const,
          required: false,
          options: [{ label: 'Dark 70%' }, { label: 'Milk' }, { label: 'White' }],
        },
      ],
    },
  ]

  const seededItems: Record<string, { id: string }> = {}
  for (const item of items) {
    const res = await createCollectionIfNotExists({
      payload,
      collection: 'menu-items',
      where: { slug: { equals: item.slug } },
      data: { ...item, _status: 'published' },
      overrideAccess: true,
    })
    seededItems[item.slug] = res
  }

  // 3 menu docs
  const menusData = [
    {
      slug: 'evt-canapes-menu',
      category: canapesCat.id,
      itemSlugs: [
        'evt-beef-tartare-toast',
        'evt-tuna-tostada',
        'evt-burrata-fig',
        'evt-salmon-blini',
        'evt-wild-mushroom-arancini',
        'evt-oyster-trio',
        'evt-mini-slider-duo',
      ],
    },
    {
      slug: 'evt-grill-menu',
      category: grillCat.id,
      itemSlugs: [
        'evt-wagyu-skewer',
        'evt-lamb-chop',
        'evt-grilled-prawns',
        'evt-miso-black-cod',
        'evt-charred-cauliflower-steak',
        'evt-tomahawk-to-share',
        'evt-whole-roasted-sea-bass',
      ],
    },
    {
      slug: 'evt-sweets-menu',
      category: sweetsCat.id,
      itemSlugs: [
        'evt-pistachio-baklava-cheesecake',
        'evt-dark-chocolate-fondant',
        'evt-saffron-panna-cotta',
        'evt-date-toffee-pudding',
        'evt-rosewater-mille-feuille',
        'evt-build-your-own-sundae',
        'evt-chocolate-fountain-plate',
      ],
    },
  ]

  const seededMenus: Record<string, { id: string }> = {}
  for (const m of menusData) {
    const menuDoc = await createCollectionIfNotExists({
      payload,
      collection: 'menu',
      where: { slug: { equals: m.slug } },
      data: {
        restaurant: eventsRestaurant.id,
        operator: doOperator.id,
        category: m.category,
        slug: m.slug,
        menu_items: m.itemSlugs.map((slug) => ({ item: seededItems[slug].id })),
        _status: 'published',
      },
      overrideAccess: true,
    })
    seededMenus[m.slug] = menuDoc
  }

  const allMenuIds = menusData.map((m) => seededMenus[m.slug].id)

  // 1c. 2 demo events
  const demoEvents: Array<{
    slug: string
    title: string
    handlers: 'boh_only' | 'waiter_boh'
    showPrices: boolean
    headerLabel: string
  }> = [
    {
      slug: 'gala-dinner',
      title: 'Doha Oasis — Gala Dinner',
      handlers: 'boh_only',
      showPrices: false,
      headerLabel: 'Welcome to the Gala',
    },
    {
      slug: 'launch-party',
      title: 'Doha Oasis — Launch Party',
      handlers: 'waiter_boh',
      showPrices: true,
      headerLabel: 'Launch Party',
    },
  ]

  for (const eventSeed of demoEvents) {
    const existing = await payload.find({
      collection: 'fnb-menu-events',
      where: { 'info.slug': { equals: eventSeed.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      logger.info(`✓ Demo event "${eventSeed.slug}" already exists - skipping.`)
      continue
    }

    const data: RequiredDataFromCollectionSlug<'fnb-menu-events'> = {
      operator: doOperator.id,
      restaurant: eventsRestaurant.id,
      info: {
        title: eventSeed.title,
        slug: eventSeed.slug,
        slug_override: true,
      },
      c: {
        ordering_enabled: true,
        handlers: eventSeed.handlers,
        show_prices: eventSeed.showPrices,
        menus: allMenuIds,
        header: {
          label: eventSeed.headerLabel,
          show_language: true,
        },
        filter: {
          enabled: true,
          show_search: true,
          show_allergen_filters: true,
        },
        items: {
          title: 'The Menu',
          description: 'Chef’s selection for tonight',
        },
      },
      adv: {
        show_layout: false,
      },
      // Auto-computed by the setOperatorSlugCollection beforeValidate hook;
      // set here only to satisfy the required type.
      operator_slug: '',
    }

    await payload.create({
      collection: 'fnb-menu-events',
      data,
      overrideAccess: true,
    })

    logger.info(`✓ Seeded demo event: "${eventSeed.title}" (${eventSeed.slug})`)
  }

  logger.info('FnB demo events seeding completed!')
}
