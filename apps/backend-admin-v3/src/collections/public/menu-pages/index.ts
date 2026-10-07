import type { CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { Slug } from '@/common/fields/slug'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { revalidateMenuPage, revalidateMenuPageDelete } from './hooks/revalidate'
import { restaurantAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import getFields, { getOperatorField, getRestaurantField } from './fields'
import { getThemeFields } from './fields/theme'
import { getOrderHandlingFields } from './fields/order-handling'
import { BlockSection } from './blocks/section'
import { getContentBySlug } from './endpoints/get-content-by-slug'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { assertMenuPageSlugUniqueVsEvents } from './hooks/slug-unique'

const SLUG = 'menu-pages'
const COLLECTION_NAME_MENU = 'menu'

const FnbMenuPages: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Pages', singular: 'Page' },
  admin: {
    useAsTitle: 'operator_slug',
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    livePreview: {
      url: ({ data }) => {
        const slug = data?.info?.slug || ''
        return `${BACKEND_URL_WITH_BASE}/fnb/menu/${slug}?preview=true`
      },
    },
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    getOperatorField(),
    getRestaurantField(),
    {
      type: 'tabs',
      tabs: [
        {
          name: 'info',
          label: 'Information',
          fields: [
            {
              type: 'ui',
              name: 'frontend_url_preview',
              admin: {
                components: {
                  Field: {
                    path: '@/common/components/frontend-url-preview',
                    clientProps: {
                      pathPrefix: '/fnb/menu',
                      useSlug: true,
                      slugPath: 'info.slug',
                      includeCollectionSlug: false,
                      label: 'Public Menu URL',
                    },
                  },
                },
              },
            },
            ...getFields([{ type: 'title' }]),
            {
              type: 'checkbox',
              name: 'slug_override',
              label: 'Override Slug?',
            },
            {
              type: 'text',
              name: 'slug',
              label: 'Slug',
              unique: true,
              required: true,
              admin: {
                components: {
                  Field: './collections/public/menu-pages/components/menu-page-slug',
                },
                description: 'The slug is used in the URL for this menu page.',
              },
            },
          ],
        },
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'collapsible',
              label: 'Theme',
              fields: [...getThemeFields()],
            },
            {
              type: 'relationship',
              name: 'menus',
              label: 'Menus',
              relationTo: COLLECTION_NAME_MENU,
              filterOptions: ({ data }) => {
                if (!data?.restaurant) return false
                return { restaurant: { equals: data.restaurant } }
              },
              hasMany: true,
              admin: {
                description:
                  'Select the menu(s) to display items from this page. If no menu is selected, all items from the restaurant will be displayed.',
              },
            },
            ...getOrderHandlingFields({ includeCashier: true }),
            {
              type: 'blocks',
              name: 'blk',
              label: 'Layouts',
              labels: { plural: 'Layouts', singular: 'Layout' },
              blocks: [BlockSection],
              minRows: 1,
              required: true,
            },
          ],
        },
        {
          name: 'adv',
          label: 'Advanced',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }])],
        },
        {
          name: 'seo',
          label: 'SEO',
          fields: [
            ...getFields([
              { type: 'title' },
              { type: 'description' },
              { type: 'image', override: { relationTo: 'menu-media' } },
            ]),
          ],
        },
      ],
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
      setOperatorSlugCollection('info.slug', 'operator', 'restaurant'),
      assertMenuPageSlugUniqueVsEvents,
    ],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG), revalidateMenuPage],
    afterDelete: [auditLogAfterDelete(SLUG), revalidateMenuPageDelete],
  },
  endpoints: [getContentBySlug],
}

export default FnbMenuPages
