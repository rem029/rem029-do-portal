import CreatedByField from '@/common/fields/created-by'
import { Slug } from '@/common/fields/slug'
import UpdatedByField from '@/common/fields/updated-by'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { CollectionConfig } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const COLLECTION_NAME = 'restaurants'

const Restaurants: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Restaurants', singular: 'Restaurant' },
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
    listSearchableFields: ['slug', 'title'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  fields: [
    {
      type: 'text',
      required: true,
      name: 'title',
      label: 'Title',
      admin: {
        description: 'eg. The Restaurant Name',
      },
    },
    {
      type: 'relationship',
      required: true,
      name: 'operator',
      label: 'Operator',
      relationTo: 'operators',
    },
    {
      type: 'upload',
      name: 'header_image',
      label: 'Header Image',
      relationTo: 'media',
    },
    {
      type: 'upload',
      name: 'logo',
      label: 'Logo',
      relationTo: 'media',
    },
    {
      type: 'richText',
      name: 'description',
      label: 'Description',
    },
    {
      type: 'checkbox',
      name: 'event_enabled',
      label: 'Available for events',
      defaultValue: false,
      admin: {
        description: 'Tick this to let this restaurant be picked when creating an Event menu.',
      },
    },
    {
      type: 'number',
      name: 'last_order_number',
      label: 'Last Order Number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          'Internal counter — do not edit. Powers each order\'s daily sequential order number.',
      },
    },
    {
      type: 'date',
      name: 'last_order_number_date',
      label: 'Last Order Number Date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly' },
        description: 'The calendar day (Asia/Qatar) last_order_number currently counts.',
      },
    },
    CreatedByField,
    UpdatedByField,
    ...Slug(true, { watchPath: 'title' }),
  ],
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  hooks: {
    beforeValidate: [setOperatorSlugCollection('slug')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default Restaurants
