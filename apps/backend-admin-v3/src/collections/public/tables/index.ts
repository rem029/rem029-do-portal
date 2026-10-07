import type { CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { Slug } from '@/common/fields/slug'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { restaurantAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import { getOperatorField, getRestaurantField } from '../menu-pages/fields'
import { uniqueSlugPerRestaurant } from './hooks/unique-slug-per-restaurant'

const SLUG = 'tables'

const FnbTables: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Tables', singular: 'Table' },
  admin: {
    useAsTitle: 'label',
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    listSearchableFields: ['label'],
    defaultColumns: ['label', 'table_qr', 'seat_count', 'restaurant'],
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    {
      type: 'ui',
      name: 'table_qr',
      label: 'QR Code',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/collections/public/tables/components/table-qr',
          },
          Cell: {
            path: '@/collections/public/tables/components/table-qr-cell',
          },
        },
      },
    },
    getOperatorField(),
    getRestaurantField(),
    {
      type: 'text',
      name: 'label',
      label: 'Label',
      required: true,
      admin: {
        description: 'eg. Table 4, Patio 2',
      },
    },
    ...Slug(true, { watchPath: 'label' }),
    {
      type: 'number',
      name: 'seat_count',
      label: 'Seat Count',
      required: true,
      min: 1,
      defaultValue: 4,
      admin: {
        description:
          'Number of seats at this table — guests choose their seat number up to this count when ordering.',
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
      uniqueSlugPerRestaurant,
      setOperatorSlugCollection('slug', 'operator', 'restaurant'),
    ],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default FnbTables
