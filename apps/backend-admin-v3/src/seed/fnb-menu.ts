import type { Payload } from 'payload'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'

export const seedFnbMenu = async ({ payload }: { payload: Payload }) => {
  const { logger } = payload
  logger.info('Seeding FnB Menu data...')

  // 1. Get Operators
  const dohaOasisOperator = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'doha-oasis' } },
    limit: 1,
    overrideAccess: true,
  })

  const printempsOperator = await payload.find({
    collection: 'operators',
    where: { slug: { equals: 'printemps' } },
    limit: 1,
    overrideAccess: true,
  })

  const doOperator = dohaOasisOperator.docs[0]
  const ptOperator = printempsOperator.docs[0]

  if (!doOperator || !ptOperator) {
    logger.error('Doha Oasis or Printemps operator not found. Skipping FnB seed.')
    return
  }

  // 2. Seed Restaurants
  const restaurantsData = [
    { title: 'Planet Hollywood', operator: doOperator.id, slug: 'planet-hollywood' },
    { title: 'Vertigo', operator: doOperator.id, slug: 'vertigo' },
    { title: 'Cova', operator: ptOperator.id, slug: 'cova' },
    { title: 'Twiga', operator: ptOperator.id, slug: 'twiga' },
  ]

  const restaurants = []
  for (const r of restaurantsData) {
    const res = await createCollectionIfNotExists({
      payload,
      collection: 'restaurants',
      where: {
        and: [
          { title: { equals: r.title } },
          { operator: { equals: r.operator } },
        ],
      },
      data: r,
      overrideAccess: true,
    })
    restaurants.push(res)
  }

  // 3. Seed Menu Categories
  const categoriesData = ['Appetizers', 'Main Courses', 'Desserts', 'Drinks']
  const categories = []
  for (const catName of categoriesData) {
    // We'll create categories for each operator since categories are operator-scoped in our schema
    for (const op of [doOperator, ptOperator]) {
      const cat = await createCollectionIfNotExists({
        payload,
        collection: 'menu-categories',
        where: {
          and: [
            { title: { equals: catName } },
            { operator: { equals: op.id } },
          ],
        },
        data: { title: catName, operator: op.id, slug: catName.toLowerCase().replace(/ /g, '-') },
        overrideAccess: true,
      })
      categories.push(cat)
    }
  }

  // 4. Seed Menu Items
  // Samples for each restaurant
  const planetHollywood = restaurants.find((r) => r.title === 'Planet Hollywood')
  const vertigo = restaurants.find((r) => r.title === 'Vertigo')
  const cova = restaurants.find((r) => r.title === 'Cova')
  const twiga = restaurants.find((r) => r.title === 'Twiga')

  logger.info(`Found restaurants: PH:${!!planetHollywood}, V:${!!vertigo}, C:${!!cova}, T:${!!twiga}`)

  const appetizersDO = categories.find((c) => c.title === 'Appetizers' && (typeof c.operator === 'object' ? c.operator.id === doOperator.id : c.operator === doOperator.id))
  const mainDO = categories.find((c) => c.title === 'Main Courses' && (typeof c.operator === 'object' ? c.operator.id === doOperator.id : c.operator === doOperator.id))
  const dessertsDO = categories.find((c) => c.title === 'Desserts' && (typeof c.operator === 'object' ? c.operator.id === doOperator.id : c.operator === doOperator.id))
  const drinksDO = categories.find((c) => c.title === 'Drinks' && (typeof c.operator === 'object' ? c.operator.id === doOperator.id : c.operator === doOperator.id))

  const appetizersPT = categories.find((c) => c.title === 'Appetizers' && (typeof c.operator === 'object' ? c.operator.id === ptOperator.id : c.operator === ptOperator.id))
  const drinksPT = categories.find((c) => c.title === 'Drinks' && (typeof c.operator === 'object' ? c.operator.id === ptOperator.id : c.operator === ptOperator.id))

  logger.info(`Found categories DO: Appetizers:${!!appetizersDO}, Main:${!!mainDO}, Desserts:${!!dessertsDO}, Drinks:${!!drinksDO}`)
  logger.info(`Found categories PT: Appetizers:${!!appetizersPT}, Drinks:${!!drinksPT}`)

  // Items for Planet Hollywood
  if (planetHollywood && appetizersDO && mainDO && dessertsDO) {
    const items = [
      { title: 'Chicken Crunch', price: 55, restaurant: planetHollywood.id, operator: doOperator.id, slug: 'ph-chicken-crunch', category: [appetizersDO.id] },
      { title: 'VIP Burger', price: 85, restaurant: planetHollywood.id, operator: doOperator.id, slug: 'ph-vip-burger', category: [mainDO.id] },
      { title: 'World Famous Nachos', price: 65, restaurant: planetHollywood.id, operator: doOperator.id, slug: 'ph-nachos', category: [appetizersDO.id] },
      { title: 'LA Lasagna', price: 95, restaurant: planetHollywood.id, operator: doOperator.id, slug: 'ph-lasagna', category: [mainDO.id] },
      { title: 'Strawberry Cheesecake', price: 45, restaurant: planetHollywood.id, operator: doOperator.id, slug: 'ph-cheesecake', category: [dessertsDO.id] },
    ]
    for (const item of items) {
      await createCollectionIfNotExists({ payload, collection: 'menu-items', where: { slug: { equals: item.slug } }, data: item, overrideAccess: true })
    }
  }

  // Items for Vertigo
  if (vertigo && drinksDO) {
    const items = [
      { title: 'Sunset Cocktail', price: 75, restaurant: vertigo.id, operator: doOperator.id, slug: 'v-sunset', category: [drinksDO.id] },
      { title: 'Skyline Mocktail', price: 45, restaurant: vertigo.id, operator: doOperator.id, slug: 'v-skyline', category: [drinksDO.id] },
      { title: 'Cloud 9 Gin', price: 80, restaurant: vertigo.id, operator: doOperator.id, slug: 'v-cloud9', category: [drinksDO.id] },
      { title: 'Starry Night Martini', price: 90, restaurant: vertigo.id, operator: doOperator.id, slug: 'v-martini', category: [drinksDO.id] },
      { title: 'Midnight Breeze', price: 50, restaurant: vertigo.id, operator: doOperator.id, slug: 'v-breeze', category: [drinksDO.id] },
    ]
    for (const item of items) {
      await createCollectionIfNotExists({ payload, collection: 'menu-items', where: { slug: { equals: item.slug } }, data: item, overrideAccess: true })
    }
  }

  // Items for Cova
  if (cova && drinksPT) {
    const items = [
      { title: 'Cova Espresso', price: 30, restaurant: cova.id, operator: ptOperator.id, slug: 'c-espresso', category: [drinksPT.id] },
      { title: 'Italian Latte', price: 40, restaurant: cova.id, operator: ptOperator.id, slug: 'c-latte', category: [drinksPT.id] },
      {
        title: 'Cappuccino',
        price: 35,
        restaurant: cova.id,
        operator: ptOperator.id,
        slug: 'c-cappuccino',
        category: [drinksPT.id],
        // Demo item for the guest ordering modifier picker: one required choice, one optional add-on.
        modifier_groups: [
          {
            name: 'Hot/Iced',
            input_type: 'radio' as const,
            required: true,
            options: [{ label: 'Hot' }, { label: 'Iced' }],
          },
          {
            name: 'Condiments',
            input_type: 'checkbox' as const,
            required: false,
            options: [{ label: 'Extra Sugar' }],
          },
        ],
      },
      { title: 'Classic Cannoli', price: 25, restaurant: cova.id, operator: ptOperator.id, slug: 'c-cannoli', category: [drinksPT.id] },
      { title: 'Signature Tiramisu', price: 50, restaurant: cova.id, operator: ptOperator.id, slug: 'c-tiramisu', category: [drinksPT.id] },
    ]
    for (const item of items) {
      await createCollectionIfNotExists({ payload, collection: 'menu-items', where: { slug: { equals: item.slug } }, data: item, overrideAccess: true })
    }
  }

  // Items for Twiga
  if (twiga && appetizersPT) {
    const items = [
      { title: 'Twiga Tartare', price: 120, restaurant: twiga.id, operator: ptOperator.id, slug: 't-tartare', category: [appetizersPT.id] },
      { title: 'Spicy Edamame', price: 45, restaurant: twiga.id, operator: ptOperator.id, slug: 't-edamame', category: [appetizersPT.id] },
      { title: 'Miso Black Cod', price: 180, restaurant: twiga.id, operator: ptOperator.id, slug: 't-cod', category: [appetizersPT.id] },
      { title: 'Wagyu Sliders', price: 95, restaurant: twiga.id, operator: ptOperator.id, slug: 't-sliders', category: [appetizersPT.id] },
      {
        title: 'Truffle Fries',
        price: 55,
        restaurant: twiga.id,
        operator: ptOperator.id,
        slug: 't-fries',
        category: [appetizersPT.id],
        modifier_groups: [
          {
            name: 'Dip',
            input_type: 'radio' as const,
            required: false,
            options: [{ label: 'Truffle Mayo' }, { label: 'Spicy Mayo' }, { label: 'Ketchup' }],
          },
        ],
      },
    ]
    for (const item of items) {
      await createCollectionIfNotExists({ payload, collection: 'menu-items', where: { slug: { equals: item.slug } }, data: item, overrideAccess: true })
    }
  }

  // 5. Seed Menus (one per restaurant for simplicity in seed)
  const menuData = [
    { slug: 'ph-menu', restaurant: planetHollywood, operator: doOperator, category: appetizersDO },
    { slug: 'v-menu', restaurant: vertigo, operator: doOperator, category: drinksDO },
    { slug: 'c-menu', restaurant: cova, operator: ptOperator, category: drinksPT },
    { slug: 't-menu', restaurant: twiga, operator: ptOperator, category: appetizersPT },
  ]

  for (const m of menuData) {
    logger.info(`Processing menu: ${m.slug} - R:${!!m.restaurant}, O:${!!m.operator}, C:${!!m.category}`)
    if (m.restaurant && m.operator && m.category) {
      const items = await payload.find({
        collection: 'menu-items',
        where: { restaurant: { equals: m.restaurant.id } },
        overrideAccess: true,
      })
      
      await createCollectionIfNotExists({
        payload,
        collection: 'menu',
        where: { slug: { equals: m.slug } },
        data: {
          restaurant: m.restaurant.id,
          operator: m.operator.id,
          category: m.category.id,
          slug: m.slug,
          menu_items: items.docs.map(i => ({ item: i.id })),
        },
        overrideAccess: true,
      })
    }
  }

  // 6. Seed Menu Pages
  const pageData = [
    { slug: 'planet-hollywood-page', title: 'Planet Hollywood', restaurant: planetHollywood, operator: doOperator, menuSlug: 'ph-menu' },
    { slug: 'vertigo-page', title: 'Vertigo Rooftop', restaurant: vertigo, operator: doOperator, menuSlug: 'v-menu' },
    { slug: 'cova-page', title: 'Cova Cafe', restaurant: cova, operator: ptOperator, menuSlug: 'c-menu' },
    { slug: 'twiga-page', title: 'Twiga Lounge', restaurant: twiga, operator: ptOperator, menuSlug: 't-menu' },
  ]

  for (const p of pageData) {
    if (p.restaurant && p.operator) {
      const menu = await payload.find({
        collection: 'menu',
        where: { slug: { equals: p.menuSlug } },
        overrideAccess: true,
      })

      await createCollectionIfNotExists({
        payload,
        collection: 'menu-pages',
        where: { 'info.slug': { equals: p.slug } },
        data: {
          info: { title: p.title, slug: p.slug },
          restaurant: p.restaurant.id,
          operator: p.operator.id,
          c: {
            menus: menu.docs.map(m => m.id),
            blk: [{
              blockType: 'section',
              c: {
                blks: [
                  { blockType: 'header', c: { label: `Welcome to ${p.title}`, show_language: true } },
                  { blockType: 'items', c: { title: 'Our Selection', description: 'Fresh and delicious' } },
                ],
              },
            }],
          },
        },
        overrideAccess: true,
      })
    }
  }

  logger.info('FnB Menu seeding completed!')
}

