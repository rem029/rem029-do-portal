import type { CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { Slug } from '@/common/fields/slug'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import {
  AccessAdmin,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { operatorAccessRefine, restaurantAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import getFields, { getOperatorField, getRestaurantField } from '../menu-pages/fields'
import { getSlugField } from '../menu-pages/fields/slug-field'
import { fnbVerifySlug } from './hooks/verify-slug'
import { fnbVerifyMenuItems } from './hooks/verify-menu-items'
import { updateCategoryTitle } from './hooks/update-category-title'
import { updateRestaurantTitle } from './hooks/update-restaurant-title'

const SLUG = 'menu'
const COLLECTION_NAME_ITEMS = 'menu-items'
const COLLECTION_NAME_MEDIA = 'menu-media'
const COLLECTION_NAME_CATEGORIES = 'menu-categories'

const FnbMenu: CollectionConfig = {
  slug: SLUG,
  labels: { plural: "Menu's", singular: 'Menu' },
  admin: {
    useAsTitle: 'category_title',
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    getOperatorField(),
    getRestaurantField(),
    ...getFields([
      { type: 'image', override: { relationTo: COLLECTION_NAME_MEDIA } },
      {
        type: 'title',
        override: {
          name: 'category_title',
          admin: { 
            readOnly: true,
          },
          hooks: {
            afterRead: [updateCategoryTitle],
            beforeValidate: [updateCategoryTitle],
          },
        },
      },
      {
        type: 'title',
        override: {
          name: 'restaurant_title',
          admin: { 
            readOnly: true,
          },
          hooks: {
            afterRead: [updateRestaurantTitle],
            beforeValidate: [updateRestaurantTitle],
          },
        },
      },
    ]),
    ...getSlugField('slug', 'category_title', 'restaurant_title', false),
    ...getFields([
      {
        type: 'category',
        override: {
          relationTo: COLLECTION_NAME_CATEGORIES,
          hasMany: false,
          required: true,
        },
      },
      { type: 'description' },
    ]),
    {
      type: 'array',
      name: 'menu_items',
      label: 'Menu Item',
      fields: [
        {
          name: 'item',
          label: 'Item',
          type: 'relationship',
          relationTo: COLLECTION_NAME_ITEMS,
          filterOptions: ({ data }) => {
            if (!data?.restaurant) return false
            return { restaurant: { equals: data?.restaurant } }
          },
          required: true,
        },
        {
          type: 'ui',
          name: 'image',
          admin: {
            components: {
              Field: './collections/public/menu/components/menu-item-preview',
            },
          },
        },
        {
          type: 'text',
          name: '_title',
          admin: { hidden: true },
        },
      ],
      admin: {
        components: {
          RowLabel: './collections/public/menu/components/menu-row-label',
        },
      },
    },
    {
      type: 'text',
      unique: true,
      required: true,
      name: 'operator_slug',
      label: 'Operator Slug',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Unique identifier with operator name.',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
  },
  hooks: {
    beforeValidate: [
      fnbVerifySlug('slug', 'category_title', 'restaurant_title'),
      fnbVerifyMenuItems,
      setOperatorSlugCollection('slug', 'operator', 'restaurant'),
    ],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default FnbMenu
