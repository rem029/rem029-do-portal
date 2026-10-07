import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'

const COLLECTION_NAME = 'operators'

const Operators: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Operators', singular: 'Operator' },
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
    listSearchableFields: ['title', 'slug'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  fields: [
    {
      type: 'text',
      required: true,
      name: 'title',
      label: 'Title',
      admin: {
        description: 'eg. Doha Oasis, Doha Quest, IT, Printemps',
      },
    },
    {
      type: 'text',
      unique: true,
      required: true,
      name: 'slug',
      label: 'Slug',
      admin: {
        components: {
          Field: {
            path: '@/common/components/slug',
            clientProps: { slugProps: { watchPath: 'title' } },
          },
        },
        description: 'Unique identifier for the link. eg. doha-oasis, doha-quest, it or printemps',
      },
    },
    {
      type: 'text',
      unique: true,
      name: 'h2a_division_id',
      label: 'H2A Division ID',
      admin: {
        description: 'Unique H2A Division identifier for the operator.',
      },
    },
    {
      type: 'checkbox',
      name: 'super_user',
      label: 'Super User',
      defaultValue: false,
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: false }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default Operators
