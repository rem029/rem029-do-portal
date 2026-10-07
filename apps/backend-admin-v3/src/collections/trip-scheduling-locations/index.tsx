import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-locations'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      // Direct data operations (Create/Update/Delete) are restricted to super_users or record owners
      if (hasAccess) return true
      const user = req.user as User | undefined
      if (!user) return false
      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingLocations: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Locations', singular: 'Location' },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // COMPLIANT: Opened globally so any multi-tenant employee can select destination points on booking forms
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['name'],
    defaultColumns: ['name', 'route', 'isActive', 'updatedAt'],
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
      unique: true, // Safeguards against duplicate spatial definitions globally
      index: true,
      admin: { description: 'Location name (e.g., Industrial Area Gate 3)' },
    },
    {
      name: 'route',
      type: 'relationship',
      relationTo: 'trip-scheduling-routes',
      required: true,
      index: true,
      admin: { description: 'Route this location belongs to' },
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

export default TripSchedulingLocations
