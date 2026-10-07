import CreatedByField from '@/common/fields/created-by'
import { Slug } from '@/common/fields/slug'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { CollectionConfig } from 'payload'

const COLLECTION_NAME = 'crm-categories'

const CrmCategories: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'CRM Categories', singular: 'CRM Category' },
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
    listSearchableFields: ['slug', 'title'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'managed_by_department',
      type: 'relationship',
      label: 'Managed By Department',
      relationTo: 'departments',
      hasMany: false,
      admin: {
        appearance: 'drawer',
      },
    },
    CreatedByField,
    UpdatedByField,
    ...Slug(false, { watchPath: 'title' }),
  ],
  // Deliberately global/non-multi-tenant (no operatorAccessRefine)
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', {
      fallbackAccess: false,
    }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', {
      fallbackAccess: false,
    }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', {
      fallbackAccess: false,
    }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', {
      fallbackAccess: false,
    }),
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default CrmCategories
