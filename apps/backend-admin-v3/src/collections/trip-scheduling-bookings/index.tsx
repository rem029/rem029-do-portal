import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { accessHiddenBySlug } from '@/utilities/access'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { TOKEN_FIELD_ACCESS } from '@/utilities/trip-scheduling-approval-token'
import { approverFieldAccess, tripRequestAccess } from '@/utilities/trip-scheduling-approver'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { stampCompletedAt } from '@/common/hooks/trip-scheduling-completed-at'
import { beforeValidate } from './hooks/beforeValidate'
import { normalizeOnApprove } from './hooks/normalizeOnApprove'
import { beforeChange } from './hooks/beforeChange'
import { afterChangeHook } from './hooks/afterChange'
import { notifyDriverOnApproval } from './hooks/notifyDriverOnApproval'
import { beforeDelete } from './hooks/beforeDelete'

const COLLECTION_NAME = 'trip-scheduling-bookings'

// Status, driver and decline fields are approval state: only approvers may write them over the API.
const approverAccess = approverFieldAccess(COLLECTION_NAME)

export const TripSchedulingBookings: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Bookings',
    singular: 'Booking',
  },
  timestamps: true,
  admin: {
    useAsTitle: 'fullName',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['fullName', 'email', 'phone'],
    defaultColumns: [
      'status',
      'fullName',
      'operator',
      'tripCategory',
      'vehicleNeeded',
      'travelDate',
      'travelTime',
      'driver',
      'driverPhone',
      'zones',
      'updatedAt',
    ],
  },
  access: {
    admin: () => true,
    // Owners (created_by) can only read their own row. Writing needs a grant.
    ...tripRequestAccess(COLLECTION_NAME, (user) => ({ created_by: { equals: user.id } })),
  },
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      normalizeOnApprove,
      beforeChange,
      stampCompletedAt,
    ],
    afterChange: [afterChangeHook, notifyDriverOnApproval],
    beforeDelete: [beforeDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Booking Details',
          fields: [
            /** Row 1: Requester Info **/
            {
              type: 'row',
              fields: [
                { name: 'fullName', type: 'text', required: true, admin: { width: '33.3%' } },
                { name: 'email', type: 'email', required: true, admin: { width: '33.3%' } },
                { name: 'phone', type: 'text', required: true, admin: { width: '33.3%' } },
              ],
            },
            /** Row 2: Operator & Categorization **/
            {
              type: 'row',
              fields: [
                {
                  name: 'operator',
                  type: 'relationship',
                  relationTo: 'operators',
                  required: true,
                  admin: { width: '33.3%' },
                },
                {
                  name: 'tripCategory',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-categories',
                  required: true,
                  admin: { width: '66.7%' },
                },
              ],
            },
            /** Row 3: Fleet Allocations **/
            {
              type: 'row',
              fields: [
                { name: 'passengers', type: 'number', required: true, admin: { width: '33.3%' } },
                {
                  name: 'vehicleNeeded',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-vehicles',
                  required: true,
                  admin: {
                    width: '66%',
                    components: { Field: '@/common/components/trip-scheduling/vehicle-select' },
                  },
                },
              ],
            },
            /** Collapsible Section: Route Info **/
            {
              type: 'collapsible',
              label: 'Route & Itinerary',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'pickupLocation',
                      type: 'text',
                      required: true,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'destination',
                      type: 'text',
                      required: true,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'zones',
                      type: 'relationship',
                      relationTo: 'trip-scheduling-zones',
                      required: true,
                      admin: {
                        width: '50%',
                        components: { Field: '@/common/components/trip-scheduling/zone-select' },
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'travelDate', type: 'date', required: true, admin: { width: '50%' } },
                    { name: 'travelTime', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'reason',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Admin Info',
          fields: [CreatedByField, UpdatedByField],
        },
      ],
    },

    /** SIDEBAR - Your Fast-Lane Dispatch Components **/
    {
      name: 'status',
      type: 'select',
      access: approverAccess,
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
        { label: 'Completed', value: 'completed' },
        { label: 'Expired', value: 'expired' },
      ],
      admin: {
        position: 'sidebar',
        condition: () => false,
      },
    },
    {
      name: 'approveDeclineActions',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/common/components/trip-scheduling/bookings-approval-actions',
        },
      },
    },
    {
      name: 'approverNotes',
      label: 'Approver Notes / Special Instructions',
      type: 'textarea',
      access: approverAccess,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.id && data?.status !== 'declined',
      },
    },
    {
      name: 'driver',
      type: 'relationship',
      relationTo: 'trip-scheduling-drivers',
      access: approverAccess,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'approved' || data?.status === 'completed',
      },
    },
    {
      name: 'driverPhone',
      type: 'text',
      access: approverAccess,
      label: 'Driver Phone',
      admin: {
        position: 'sidebar',
        disabled: true,
        condition: (data) => data?.status === 'approved' || data?.status === 'completed',
      },
    },
    {
      name: 'declineReason',
      type: 'textarea',
      access: approverAccess,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'declined',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      access: approverAccess,
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { displayFormat: 'dd MMM yyyy, HH:mm' },
        condition: (data) => data?.status === 'completed',
      },
    },
    {
      name: 'settlementSource',
      label: 'Settled By',
      type: 'select',
      options: [
        { label: 'Driver confirmed', value: 'driver' },
        { label: 'Auto-completed', value: 'auto' },
      ],
      // System-set by settleTrip through the Local API; never writable over the API.
      access: { create: () => false, update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.settlementSource),
      },
    },
    {
      name: 'bookingId',
      type: 'text',
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'driverName',
      type: 'text',
      access: approverAccess,
      admin: { disabled: true, hidden: true },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        disabled: true,
        hidden: true,
      },
    },

    /** BACKGROUND TRACKING METRICS **/
    {
      name: 'tripStartTimestamp',
      type: 'date',
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'tripEndTimestamp',
      type: 'date',
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'approvalToken',
      type: 'text',
      access: TOKEN_FIELD_ACCESS,
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'tokenExpiration',
      type: 'date',
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'driverToken',
      type: 'text',
      access: TOKEN_FIELD_ACCESS,
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'driverTokenExpiration',
      type: 'date',
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'is_trip_settled',
      type: 'checkbox',
      access: approverAccess,
      defaultValue: false,
      admin: {
        disabled: true,
        hidden: true,
      },
    },
  ],
}

export default TripSchedulingBookings
