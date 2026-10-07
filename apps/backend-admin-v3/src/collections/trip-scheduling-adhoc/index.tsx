import type { CollectionConfig, Where } from 'payload'
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

const COLLECTION_NAME = 'trip-scheduling-adhoc'

// Status, driver and decline fields are approval state: only approvers may write them over the API.
const approverAccess = approverFieldAccess(COLLECTION_NAME)

export const TripSchedulingAdhoc: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Adhoc Requests',
    singular: 'Adhoc Request',
  },
  timestamps: true,
  admin: {
    useAsTitle: 'fullName',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['fullName', 'email', 'origin', 'destination'],
    defaultColumns: [
      'status',
      'fullName',
      'origin',
      'destination',
      'travelDate',
      'pickupTime',
      'vehicleNeeded',
      'driverName',
      'driverPhone',
      'updatedAt',
    ],
  },
  access: {
    admin: () => true,
    // Owners (created_by, or the email on the request) can only read their own row. Writing needs a grant.
    ...tripRequestAccess(
      COLLECTION_NAME,
      (user): Where => ({
        or: [{ created_by: { equals: user.id } }, { email: { equals: user.email } }],
      }),
    ),
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
          label: 'Trip Request',
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
            /** Row 2: Capacity, Vehicle & Brand Operator Tenant **/
            {
              type: 'row',
              fields: [
                {
                  name: 'passengers',
                  type: 'number',
                  required: true,
                  admin: { width: '16.6%' },
                },
                {
                  name: 'operator',
                  type: 'relationship',
                  relationTo: 'operators',
                  required: true,
                  admin: {
                    width: '41.7%',
                    description: 'Tenant company making this request.',
                  },
                },
                {
                  name: 'vehicleNeeded',
                  type: 'relationship',
                  relationTo: 'trip-scheduling-vehicles',
                  admin: {
                    width: '41.7%',
                    components: { Field: '@/common/components/trip-scheduling/vehicle-select' },
                  },
                },
              ],
            },
            /** Row 3: Chronology (When) **/
            {
              type: 'row',
              fields: [
                // { name: 'travelDate', type: 'date', required: true, admin: { width: '33.3%' } },
                {
                  name: 'travelDate',
                  type: 'date',
                  required: true,
                  admin: {
                    width: '33.3%',
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'MMM d, yyy',
                    },
                  },
                },
                { name: 'pickupTime', type: 'text', required: true, admin: { width: '33.3%' } },
                { name: 'dropoffTime', type: 'text', admin: { width: '33.3%' } },
              ],
            },
            /** Collapsible: Purpose & Path (Where & Why) **/
            {
              type: 'collapsible',
              label: 'Trip Itinerary & Reason',
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'origin', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'destination', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'reason',
                  type: 'textarea',
                  required: true,
                  admin: { description: 'Please explain the purpose of this adhoc request.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Admin Details',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'adhocId', type: 'text', admin: { readOnly: true, width: '50%' } },
                { name: 'slug', type: 'text', admin: { readOnly: true, width: '50%' } },
              ],
            },
            CreatedByField,
            UpdatedByField,
          ],
        },
      ],
    },

    /** SIDEBAR - Purely Reserved for Your Reactive Approval Actions **/
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
          Field: '@/common/components/trip-scheduling/adhoc-approval-actions',
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
        description: 'Internal notes or specific instructions for the driver.',
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
    // {
    //   name: 'driverName',
    //   type: 'text',
    //   label: 'Driver Name',
    //   admin: {
    //     position: 'sidebar',
    //   },
    // },
    {
      name: 'driverPhone',
      type: 'text',
      access: approverAccess,
      label: 'Driver Phone',
      admin: {
        position: 'sidebar',
        disabled: true,
        condition: (data) => data?.status === 'approved' || data?.status === 'completed',
        components: {
          afterInput: ['@/collections/trip-scheduling/components/driver-phone-watcher'],
        },
      },
    },
    {
      name: 'declineReason',
      type: 'textarea',
      access: approverAccess,
      admin: {
        condition: (data) => data?.status === 'declined',
        position: 'sidebar',
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

    /** BACKGROUND TRACKING TOKENS **/
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

export default TripSchedulingAdhoc
