import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { User, Outlet as OutletType } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'

const COLLECTION_NAME = 'outlets'

const Outlets: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Outlets', singular: 'Outlet' },
  admin: {
    useAsTitle: 'name',
    group: 'HACCP',
    listSearchableFields: ['name', 'description'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  fields: [
    {
      type: 'text',
      required: true,
      unique: true,
      name: 'name',
      label: 'Outlet Name',
      admin: {
        description: 'eg. Staff Restaurant, Cafeteria Kitchen',
      },
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
    },
    {
      type: 'checkbox',
      name: 'is_active',
      label: 'Active',
      defaultValue: true,
      required: true,
      admin: {
        description:
          'Uncheck to hide this outlet from active form dropdowns while preserving historical audit data.',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: true }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        console.log(`--- [OUTLET HOOK: beforeValidate] Op: ${operation} ---`)
        return data
      },
    ],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      ({ data, operation }) => {
        console.log(`--- [OUTLET HOOK: beforeChange] Op: ${operation} ---`, data?.name)
        return data
      },
    ],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default Outlets
