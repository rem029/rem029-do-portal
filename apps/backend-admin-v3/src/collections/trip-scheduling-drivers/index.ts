import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'

import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-drivers'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      // Shared resource pool: Everyone can read/see drivers to assign them,
      // but only super_users or creators can modify driver records.
      if (hasAccess || req.method === 'GET') return true

      const user = req.user as User | undefined
      if (!user) return false

      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingDrivers: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Drivers',
    singular: 'Driver',
  },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // Allows all multi-tenant operators to select from the global driver pool
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['name', 'phone', 'email', 'route'],
    defaultColumns: ['name', 'route', 'phone', 'email', 'isActive', 'updatedAt'],
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    beforeDelete: [beforeDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'route',
      type: 'text',
      required: false,
      index: true,
      admin: {
        description: 'Optional default route preference assignment for this driver.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phone',
          type: 'text',
          required: true,
          index: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          index: true,
        },
      ],
    },
    /** Sidebar Section **/
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default TripSchedulingDrivers
