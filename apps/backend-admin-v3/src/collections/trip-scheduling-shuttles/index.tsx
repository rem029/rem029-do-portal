import type { Access, CollectionConfig, FieldHook, Where } from 'payload'
import type { User } from '@/payload-types'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { accessCheck, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { beforeValidate } from './hooks/beforeValidate'

const COLLECTION_NAME = 'trip-scheduling-shuttles'
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * FIXED HOOK TYPE:
 * Cleaned up regex to avoid modifying strings that are already perfectly formatted.
 */
const formatTimeHook: FieldHook = ({ value }) => {
  if (!value || typeof value !== 'string') return value

  // If already in perfect HH:mm format, leave it alone
  if (timeRegex.test(value)) return value

  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 4) {
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`
  }
  return value
}

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

const TripSchedulingShuttles: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Shuttles', singular: 'Shuttle' },
  timestamps: true,
  access: {
    admin: async (args) => {
      const result = await accessCheckFields(args)
      return !!result
    },
    read: () => true, // 🔓 GLOBAL UTILITY: Opened up so any tenant employee can check shuttle routes & timings
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  admin: {
    useAsTitle: 'adminTitle',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['adminTitle', 'publicNote'],
    defaultColumns: ['adminTitle', 'direction', 'departureTime', 'isActive', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Route & Assignment',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'route',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-routes',
                  required: true, // Made required since validation hook relies heavily on route lookup
                  admin: {
                    width: '50%',
                    components: { Field: '@/common/components/trip-scheduling/route-select' },
                  },
                },
                {
                  name: 'location',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-locations',
                  admin: {
                    width: '50%',
                    components: { Field: '@/common/components/trip-scheduling/location-select' },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'vehicle',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-vehicles',
                  required: true,
                  admin: {
                    width: '40%',
                    components: { Field: '@/common/components/trip-scheduling/vehicle-select' },
                  },
                },
                {
                  name: 'driver',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-drivers',
                  admin: {
                    width: '35%',
                    components: { Field: '@/common/components/trip-scheduling/driver-select' },
                  },
                },
                {
                  name: 'driverPhone',
                  type: 'text',
                  admin: {
                    width: '25%',
                    readOnly: true,
                    components: { Field: '@/common/components/trip-scheduling/driver-phone' },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Schedule Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'direction',
                  type: 'select',
                  required: true,
                  admin: { width: '34%' },
                  options: [
                    { label: 'To Office (Pickup → Doha Oasis)', value: 'to-office' },
                    { label: 'From Office (Doha Oasis → Dropoff)', value: 'from-office' },
                  ],
                  defaultValue: 'to-office',
                },
                {
                  name: 'departureTime',
                  type: 'text',
                  label: 'Departure',
                  required: false,
                  admin: { width: '33%', placeholder: 'HH:mm' },
                  hooks: { beforeValidate: [formatTimeHook] },
                  validate: (val: string | string[] | null | undefined) =>
                    typeof val === 'string' && timeRegex.test(val) ? true : 'Use HH:mm (24hr)',
                },
                {
                  name: 'arrivalTime',
                  type: 'text',
                  label: 'Arrival',
                  required: false,
                  admin: { width: '33%', placeholder: 'HH:mm' },
                  hooks: { beforeValidate: [formatTimeHook] },
                  validate: (val: string | string[] | null | undefined) =>
                    typeof val === 'string' && timeRegex.test(val) ? true : 'Use HH:mm (24hr)',
                },
              ],
            },
            {
              name: 'segmentedLabel',
              type: 'ui',
              admin: {
                components: { Field: '@/common/components/trip-scheduling/segmented-label' },
              },
            },
            {
              type: 'row',
              fields: [
                // 📝 LOGISTICS FIX: Swapped type to number and removed the copy-pasted 'HH:mm' placeholders/hooks
                {
                  name: 'pickupManager',
                  type: 'number',
                  label: 'Manager',
                  admin: { width: '25%', placeholder: '0' },
                },
                {
                  name: 'pickupMale',
                  type: 'number',
                  label: 'Male',
                  admin: { width: '25%', placeholder: '0' },
                },
                {
                  name: 'pickupFemale',
                  type: 'number',
                  label: 'Female',
                  admin: { width: '25%', placeholder: '0' },
                },
                {
                  name: 'pickupGeneral',
                  type: 'number',
                  label: 'General',
                  admin: { width: '25%', placeholder: '0' },
                },
              ],
            },
            {
              name: 'publicNote',
              type: 'text',
              admin: {
                description: 'Visible to employees on the shuttle schedule.',
                style: { marginTop: '1.5rem' },
              },
            },
          ],
        },
        {
          label: 'Admin Details',
          fields: [
            {
              name: 'adminTitle',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Auto-generated internal title.',
              },
            },
            CreatedByField,
            UpdatedByField,
          ],
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}

export default TripSchedulingShuttles
