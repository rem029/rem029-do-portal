import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { User, HaccpBuffetTemperature as HaccpBuffetTemperatureType } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { afterChangeHook } from './hooks'

const COLLECTION_NAME = 'haccp-buffet-temperature'

const HaccpBuffetTemperature: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Buffet Temperature',
    singular: 'Buffet Temperature',
  },
  admin: {
    useAsTitle: 'date',
    group: 'HACCP',
    listSearchableFields: ['outlet', 'functionType', 'status'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
    components: {
      views: {
        edit: {
          default: {
            Component: '@/common/components/haccp/buffet-temperature/index.tsx',
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
      name: 'outlet',
      type: 'relationship',
      relationTo: 'outlets',
      required: true,
      label: 'Outlet',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      label: 'Checklist Date',
    },
    {
      name: 'functionType',
      type: 'text',
      required: true,
      label: 'Function Type',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Food Item Logs',
      fields: [
        { name: 'foodItem', type: 'text', required: true, label: 'Food Item Pickup' },
        { name: 'pickupTime', type: 'text', required: true, label: 'Pickup Time' },
        { name: 'initialTemp', type: 'number', required: true, label: 'Initial Temp (°C)' },
        { name: 'tempAfter2Hrs', type: 'number', label: 'Temp After 2 hrs' },
        { name: 'tempAfter4Hrs', type: 'number', label: 'Temp After 4 hrs' },
        {
          name: 'correctiveAction',
          type: 'select',
          options: [
            { label: 'None Required', value: 'none' },
            { label: 'Reheated', value: 'reheated' },
            { label: 'Cooled', value: 'cooled' },
          ],
          defaultValue: 'none',
          label: 'Corrective Action',
        },
        { name: 'initials', type: 'text', required: true, label: 'Initials' },
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
    CreatedByField,
    UpdatedByField,
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [BUFFET HOOK: beforeValidate] Op: ${operation} ---`)
        req.payload.logger.info(
          `Payload data received for validation: ${JSON.stringify(data, null, 2)}`,
        )
        return data
      },
    ],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [BUFFET HOOK: beforeChange] Op: ${operation} ---`)
        req.payload.logger.info(`Outlet received: ${data?.outlet}`)
        req.payload.logger.info(`Items array count: ${data?.items?.length ?? 0}`)
        return data as HaccpBuffetTemperatureType
      },
    ],
    afterChange: [auditLogAfterChange(COLLECTION_NAME), afterChangeHook],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default HaccpBuffetTemperature
