import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'

import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'

const COLLECTION_NAME = 'trip-scheduling-categories'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      // Shared resource pool: All operators can see categories to create bookings,
      // but only super_users or creators can modify category rules.
      if (hasAccess || req.method === 'GET') return true

      const user = req.user as User | undefined
      if (!user) return false

      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingCategories: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    singular: 'Trip Category',
    plural: 'Trip Categories',
  },
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // Allows all multi-tenant operators to select from the global category pool
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['name', 'description'],
    defaultColumns: ['name', 'isActive', 'order', 'updatedAt'],
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true, // COMPLIANT: Enforced uniqueness globally across the entire platform
      index: true,
      admin: { description: 'Category label shown in dropdown' },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    /** Sidebar Section **/
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Disable to hide from dropdown',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first in dropdown',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default TripSchedulingCategories
