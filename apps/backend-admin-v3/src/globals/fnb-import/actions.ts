'use server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import slugify from 'slugify'

const cleanSlug = (text: string) => slugify(text, { lower: true, strict: true }) || 'unknown'

/**
 * Ensures a category exists for the operator.
 */
export async function ensureMenuCategoryAction(data: {
  name: string
  arName?: string
  operatorId: string
}) {
  const payload = await getPayload({ config })
  
  // Find existing
  const existing = await payload.find({
    collection: 'menu-categories',
    where: {
      title: { equals: data.name }
    },
    limit: 1
  })

  if (existing.docs.length > 0) {
    const doc = existing.docs[0]
    console.log(`[Import] Found category: ${doc.title} (${doc.id}). Updating Arabic if needed: ${data.arName}`)
    // Update Arabic if missing
    if (data.arName) {
      try {
        await payload.update({
          collection: 'menu-categories',
          id: doc.id,
          locale: 'ar',
          data: { 
            title: data.arName,
            slug: doc.slug || cleanSlug(data.name),
            operator: data.operatorId
          }
        })
      } catch (err) {
        console.error(`[Import] Error updating category Arabic title:`, err)
        throw err
      }
    }
    return doc.id
  }

  // Create new
  const slug = cleanSlug(data.name)
  console.log(`[Import] Creating category: ${data.name} (slug: ${slug}) for operator ${data.operatorId}`)
  const newCat = await payload.create({
    collection: 'menu-categories',
    data: {
      title: data.name,
      slug: slug,
      operator: data.operatorId,
    },
    draft: true
  })

  if (data.arName) {
    console.log(`[Import] Adding Arabic title to new category ${newCat.id}: ${data.arName}`)
    await payload.update({
      collection: 'menu-categories',
      id: newCat.id,
      locale: 'ar',
      data: { 
        title: data.arName,
        slug: slug,
        operator: data.operatorId
      }
    })
  }

  return newCat.id
}

/**
 * Ensures allergens exist for the operator.
 */
export async function ensureMenuAllergensAction(data: {
  names: string[]
  arNames: string[]
  operatorId: string
}) {
  const payload = await getPayload({ config })
  const ids: string[] = []

  for (let i = 0; i < data.names.length; i++) {
    const name = data.names[i]
    const arName = data.arNames[i]

    const existing = await payload.find({
      collection: 'menu-allergens',
      where: { title: { equals: name } },
      limit: 1
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      console.log(`[Import] Found allergen: ${doc.title} (${doc.id}). AR: ${arName}`)
      ids.push(doc.id)
      if (arName && arName !== name) {
        try {
          await payload.update({
            collection: 'menu-allergens',
            id: doc.id,
            locale: 'ar',
            data: { 
              title: arName,
              slug: doc.slug || cleanSlug(name),
              operator: data.operatorId
            }
          })
        } catch (err) {
          console.error(`[Import] Error updating allergen Arabic title:`, err)
          throw err
        }
      }
    } else {
      const slug = cleanSlug(name)
      console.log(`[Import] Creating allergen: ${name} (slug: ${slug})`)
      const newAllergen = await payload.create({
        collection: 'menu-allergens',
        data: {
          title: name,
          slug: slug,
          operator: data.operatorId
        },
        draft: true
      })
      ids.push(newAllergen.id)
      if (arName && arName !== name) {
        await payload.update({
          collection: 'menu-allergens',
          id: newAllergen.id,
          locale: 'ar',
          data: { 
            title: arName,
            slug: slug,
            operator: data.operatorId
          }
        })
      }
    }
  }

  return ids
}

/**
 * Uploads an image to menu-media.
 */
export async function uploadMenuMediaAction(formData: FormData) {
  const payload = await getPayload({ config })
  const file = formData.get('file') as File
  
  if (!file) throw new Error('No file provided')

  const media = await payload.create({
    collection: 'menu-media',
    data: {
      operator: formData.get('operatorId') as string,
    },
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type,
      size: file.size,
    }
  })

  return media.id
}

/**
 * Upserts a menu item.
 */
export async function upsertMenuItemAction(data: {
  item: any
  restaurantId: string
  operatorId: string
  categoryId: string
  imageId?: string | null
  allergenIds: string[]
}) {
  const payload = await getPayload({ config })

  const check = await payload.find({
    collection: 'menu-items',
    where: {
      and: [
        { slug: { equals: data.item.slug } },
        { restaurant: { equals: data.restaurantId } }
      ]
    },
    limit: 1
  })

  const itemData: any = {
    title: data.item.name,
    slug: data.item.slug,
    description: data.item.description,
    price: parseFloat(data.item.price.toString()),
    restaurant: data.restaurantId,
    operator: data.operatorId,
    allergen: data.allergenIds,
  }

  if (data.imageId) itemData.image = data.imageId

  let itemId: string
  if (check.docs.length > 0) {
    itemId = check.docs[0].id
    console.log(`[Import] Updating existing item: ${itemId}`)
    await payload.update({
      collection: 'menu-items',
      id: itemId,
      data: itemData
    })
  } else {
    console.log(`[Import] Creating new item: ${data.item.name}`)
    const newItem = await payload.create({
      collection: 'menu-items',
      data: itemData,
      draft: true
    })
    itemId = newItem.id
  }

  // Update Arabic
  if (data.item.lang?.ar) {
    try {
      console.log(`[Import] Updating Arabic for item: ${itemId}`)
      await payload.update({
        collection: 'menu-items',
        id: itemId,
        locale: 'ar',
        data: {
          title: data.item.lang.ar.name,
          description: data.item.lang.ar.description,
          slug: data.item.slug,
          operator: data.operatorId,
          restaurant: data.restaurantId,
          allergen: data.allergenIds,
          image: data.imageId || undefined,
        }
      })
    } catch (err) {
      console.error(`[Import] Error updating item Arabic content:`, err)
      throw err
    }
  }

  return itemId
}

/**
 * Associates an item with a menu.
 */
export async function updateMenuAction(data: {
  menuSlug: string
  itemId: string
  restaurantId: string
  categoryId: string
  operatorId: string
}) {
  const payload = await getPayload({ config })

  const existingMenu = await payload.find({
    collection: 'menu',
    where: { slug: { equals: data.menuSlug } },
    limit: 1
  })

  if (existingMenu.docs.length > 0) {
    const menu = existingMenu.docs[0]
    const currentItems = (menu.menu_items || []).map((mi: any) => typeof mi.item === 'string' ? mi.item : mi.item.id)
    
    if (!currentItems.includes(data.itemId)) {
      await payload.update({
        collection: 'menu',
        id: menu.id,
        data: {
          menu_items: [...(menu.menu_items || []), { item: data.itemId }]
        }
      })
    }
    return menu.id
  } else {
    const newMenu = await payload.create({
      collection: 'menu',
      data: {
        slug: data.menuSlug,
        restaurant: data.restaurantId,
        category: data.categoryId,
        operator: data.operatorId,
        menu_items: [{ item: data.itemId }]
      },
      draft: true
    })
    return newMenu.id
  }
}
