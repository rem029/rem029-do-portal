import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import {
  User,
  HaccpDishwashingTemperature as HaccpDishwashingTemperatureType,
} from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { afterChangeHook } from './hooks/afterChange'

const COLLECTION_NAME = 'haccp-dishwashing-temperature'

export const HaccpDishwashingTemperature: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: 'Dishwashing Temperature',
    singular: 'Dishwashing Temperature',
  },
  admin: {
    useAsTitle: 'monthYear',
    group: 'HACCP',
    listSearchableFields: ['outlet', 'monthYear', 'status'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
    components: {
      views: {
        edit: {
          default: {
            Component: '@/common/components/haccp/dishwashing-temperature/index.tsx',
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
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [DISHWASHER HOOK: beforeValidate] Op: ${operation} ---`)
        req.payload.logger.info(
          `Payload data received for validation: ${JSON.stringify(data, null, 2)}`,
        )
        return data
      },
    ],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [DISHWASHER HOOK: beforeChange] Op: ${operation} ---`)
        req.payload.logger.info(`Outlet received: ${data?.outlet}`)
        req.payload.logger.info(`Daily entries count: ${data?.dailyEntries?.length ?? 0}`)
        return data as HaccpDishwashingTemperatureType
      },
    ],
    afterChange: [auditLogAfterChange(COLLECTION_NAME), afterChangeHook],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
  fields: [
    {
      name: 'unit',
      type: 'text',
      required: true,
      label: 'Unit / Machine ID',
    },
    {
      name: 'outlet',
      type: 'relationship',
      relationTo: 'outlets',
      required: true,
      label: 'Outlet',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'monthYear',
      type: 'text',
      required: true,
      label: 'Month & Year',
      admin: {
        description: 'Format: MM-YYYY (e.g. 08-2026)',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending PIC Approval', value: 'pending-pic-approval' },
        { label: 'Pending HIC Verification', value: 'pending-hic-verification' },
        { label: 'Verified', value: 'verified' },
      ],
      label: 'Status',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dailyEntries',
      type: 'array',
      label: '31-Day Temperature & Cleanliness Log',
      fields: [
        {
          name: 'day',
          type: 'number',
          required: true,
        },
        // Breakfast
        {
          type: 'row',
          fields: [
            { name: 'breakfastWash', type: 'number', admin: { width: '33%' } },
            { name: 'breakfastFinalRinse', type: 'number', admin: { width: '33%' } },
            { name: 'breakfastInitials', type: 'text', admin: { width: '34%' } },
          ],
        },
        // Lunch
        {
          type: 'row',
          fields: [
            { name: 'lunchWash', type: 'number', admin: { width: '33%' } },
            { name: 'lunchFinalRinse', type: 'number', admin: { width: '33%' } },
            { name: 'lunchInitials', type: 'text', admin: { width: '34%' } },
          ],
        },
        // Dinner
        {
          type: 'row',
          fields: [
            { name: 'dinnerWash', type: 'number', admin: { width: '33%' } },
            { name: 'dinnerFinalRinse', type: 'number', admin: { width: '33%' } },
            { name: 'dinnerInitials', type: 'text', admin: { width: '34%' } },
          ],
        },
        // Supper
        {
          type: 'row',
          fields: [
            { name: 'supperWash', type: 'number', admin: { width: '33%' } },
            { name: 'supperFinalRinse', type: 'number', admin: { width: '33%' } },
            { name: 'supperInitials', type: 'text', admin: { width: '34%' } },
          ],
        },
        // Cleanliness
        {
          type: 'row',
          fields: [
            { name: 'cleanlinessWashArms', type: 'text', admin: { width: '50%' } },
            { name: 'cleanlinessInsideMachine', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'weeklyDescaling',
      type: 'array',
      label: 'Weekly Descaling Log',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'weekNumber', type: 'number', admin: { width: '20%' } },
            { name: 'date', type: 'text', admin: { width: '30%' } },
            { name: 'descalingSignature', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'correctiveAction',
      type: 'textarea',
      label: 'Corrective Action (if any)',
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default HaccpDishwashingTemperature
