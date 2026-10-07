import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'

import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-routes'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      if (hasAccess) return true
      const user = req.user as User | undefined
      if (!user) return false
      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingRoutes: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Routes', singular: 'Route' },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // 🔓 OPENED GLOBALLY: So any tenant booking can access the shared route definitions
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['name'],
    defaultColumns: ['name', 'isActive', 'updatedAt'],
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
      unique: true, // Prevents duplicate route strings in the database
      index: true,
      admin: { description: 'Route name (e.g., Al Sadd, Yasameen)' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: "Inactive routes won't show on frontend",
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default TripSchedulingRoutes
