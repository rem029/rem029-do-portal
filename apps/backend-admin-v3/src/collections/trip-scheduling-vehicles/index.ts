import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'

import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-vehicles'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      // Shared resource pool: All operators can see vehicles to book them,
      // but only super_users or creators can modify vehicle records.
      if (hasAccess || req.method === 'GET') return true

      const user = req.user as User | undefined
      if (!user) return false

      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingVehicles: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Vehicles',
    singular: 'Vehicle',
  },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // Allows all multi-tenant operators to select from the global fleet pool
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['name', 'description'],
    defaultColumns: ['name', 'category', 'capacity', 'isActive', 'updatedAt'],
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
      unique: true, // COMPLIANT: Restored unique check at global pool scope
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'Bus', value: 'bus' },
        { label: 'Cargo', value: 'cargo' },
        { label: 'Freezer', value: 'freezer' },
        { label: 'Limousine', value: 'limousine' },
        { label: 'Passenger', value: 'passenger' },
        { label: 'Employee Transport', value: 'employee-transport' },
        { label: 'Truck', value: 'truck' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'passenger',
      required: true,
      admin: {
        description: 'Specify the vehicle type to assist in trip assignment.',
      },
    },
    {
      type: 'group',
      name: 'capacity',
      label: 'Capacity',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
            {
              name: 'unit',
              type: 'select',
              options: [
                { label: 'People', value: 'people' },
                { label: 'Tons', value: 'tons' },
                { label: 'Kilograms', value: 'kg' },
                { label: 'Liters', value: 'liters' },
                { label: 'Other', value: 'other' },
              ],
              defaultValue: 'people',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
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

export default TripSchedulingVehicles
