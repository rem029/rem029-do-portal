import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { User, HaccpDryStore as HaccpDryStoreType } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { afterChangeHook } from './hooks'

const COLLECTION_NAME = 'haccp-dry-store'

const HaccpDryStore: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Dry Store Logs',
    singular: 'Dry Store Log',
  },
  admin: {
    useAsTitle: 'monthYear',
    defaultColumns: ['monthYear', 'outlet', 'status', 'updatedAt'],
    group: 'HACCP',
    hidden: false,
    components: {
      views: {
        edit: {
          default: {
            Component: '@/common/components/haccp/dry-store',
          },
        },
      },
    },
    custom: {
      workflowType: '3-step',
    },
  },
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: false }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: ({ req, data }) => {
      const typedUser = req.user as User & { role?: string }
      if (data?.status === 'verified' && typedUser?.role !== 'hygiene-in-charge') {
        return false
      }
      return accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false })({
        req,
        data,
      })
    },
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'outlet',
          type: 'relationship',
          relationTo: 'outlets',
          required: true,
          label: 'Outlet',
          admin: { width: '50%' },
        },
        {
          name: 'monthYear',
          type: 'text',
          required: true,
          label: 'Month & Year (MM-YYYY)',
          admin: {
            description: 'Format: MM-YYYY (e.g., 08-2026)',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'dailyEntries',
      type: 'array',
      label: '31-Day Temperature & Humidity Entries',
      minRows: 31,
      maxRows: 31,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'number',
              required: true,
              label: 'Day',
              admin: { width: '10%' },
            },
            {
              name: 'tempAm',
              type: 'number',
              label: 'AM Temp (°C)',
              admin: { width: '15%', description: '< 25°C' },
            },
            {
              name: 'humidityAm',
              type: 'number',
              label: 'AM Hum (%)',
              admin: { width: '15%', description: '< 65%' },
            },
            {
              name: 'tempPm',
              type: 'number',
              label: 'PM Temp (°C)',
              admin: { width: '15%', description: '< 25°C' },
            },
            {
              name: 'humidityPm',
              type: 'number',
              label: 'PM Hum (%)',
              admin: { width: '15%', description: '< 65%' },
            },
            {
              name: 'correctiveAction',
              type: 'text',
              label: 'Corrective Action',
              admin: { width: '20%' },
            },
            {
              name: 'initials',
              type: 'text',
              label: 'Initials',
              admin: { width: '15%', description: 'Staff initials' },
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending PIC Approval', value: 'pending-pic-approval' },
        { label: 'Pending HIC Verification', value: 'pending-hic-verification' },
        { label: 'Verified', value: 'verified' },
      ],
      defaultValue: 'draft',
      required: true,
      label: 'Status',
    },
    {
      name: 'checkedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Checked By (PIC)',
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Verified By (Hygiene-In-Charge)',
    },
    CreatedByField,
    UpdatedByField,
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [DRY STORE HOOK: beforeValidate] Op: ${operation} ---`)
        return data
      },
    ],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [DRY STORE HOOK: beforeChange] Op: ${operation} ---`)
        return data as HaccpDryStoreType
      },
    ],
    afterChange: [auditLogAfterChange(COLLECTION_NAME), afterChangeHook],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default HaccpDryStore
