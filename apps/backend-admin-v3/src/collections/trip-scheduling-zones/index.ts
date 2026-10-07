import type { Access, CollectionConfig, Where } from 'payload' // ✅ Maintained proper typing imports
import type { User } from '@/payload-types'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeValidate } from './hooks/beforeValidate'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-zones'

// 🔒 Maintained security routing wrapper for strict access verification
const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME as any, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      if (hasAccess) return true
      const user = req.user as User | undefined
      if (!user) return false
      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingZones: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Zones', singular: 'Zone' },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // Globally exposed so frontend select components work cleanly
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'zoneNumber',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['zoneNumber', 'district'],
    defaultColumns: ['indexNumber', 'zoneNumber', 'district', 'tripCost', 'isActive', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    beforeDelete: [beforeDelete],
  },
  fields: [
    {
      name: 'indexNumber',
      type: 'number',
      label: 'Index Number',
      required: false,
      unique: true,
      index: true,
      admin: {
        description: 'Numeric index for zones',
      },
    },
    {
      name: 'zoneNumber',
      type: 'text',
      label: 'Zone Number', // 🎉 Moved to top level
      required: false,
      unique: true,
      index: true,
      admin: {
        description: 'Zone reference number or identifier code (e.g., 1, 22, or 98)',
      },
    },
    {
      name: 'district',
      type: 'text',
      label: 'District Name', // 🎉 Moved to top level
      required: false,
      index: true,
      admin: {
        description:
          'The matching municipality area district designation name (e.g., Bin Mahmoud, Duhail, Al Wakrah)',
      },
    },
    {
      name: 'tripCost',
      type: 'number',
      label: 'Trip Cost (QAR)', // 🎉 Moved to top level
      required: false,
      defaultValue: 0,
      admin: {
        description:
          'Internal operational transport billing metrics baseline cost for background ledger reporting.',
      },
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

export default TripSchedulingZones
