import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { User, HaccpPersonalHygiene as HaccpPersonalHygieneType } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { afterChangeHook } from './hooks'

const COLLECTION_NAME = 'haccp-personal-hygiene'

const HaccpPersonalHygiene: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Personal Hygiene', singular: 'Personal Hygiene' },
  admin: {
    useAsTitle: 'date',
    group: 'HACCP',
    listSearchableFields: ['outlet', 'status'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
    components: {
      views: {
        edit: {
          default: {
            Component: '@/common/components/haccp/personal-hygiene/index.tsx',
          },
        },
      },
    },
    custom: {
      workflowType: '2-step',
    },
  },
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: false }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: ({ req, data }) => {
      const typedUser = req.user as User & { role?: string; enableAccessToAllCollections?: boolean }
      const isSuperUser =
        typedUser?.role === 'admin' || typedUser?.enableAccessToAllCollections === true

      if (data?.status === 'verified' && !isSuperUser && typedUser?.role !== 'hygiene-in-charge') {
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
      name: 'entries',
      type: 'array',
      label: 'Staff Hygiene Entries',
      fields: [
        { name: 'staffName', type: 'text', required: true, label: 'Staff Name' },
        { name: 'hair', type: 'select', options: ['Short', 'Long'], required: true, label: 'Hair' },
        {
          name: 'nails',
          type: 'select',
          options: ['Short', 'Long'],
          required: true,
          label: 'Nails',
        },
        {
          name: 'uniform',
          type: 'select',
          options: ['Clean', 'Dirty'],
          required: true,
          label: 'Uniform',
        },
        {
          name: 'shoes',
          type: 'select',
          options: ['Clean', 'Dirty'],
          required: true,
          label: 'Shoes',
        },
        { name: 'jewellery', type: 'checkbox', defaultValue: false, label: 'Jewellery' },
        {
          name: 'symptomsOfSick',
          type: 'checkbox',
          defaultValue: false,
          label: 'Symptoms of Sickness',
        },
        { name: 'medicalCard', type: 'checkbox', defaultValue: true, label: 'Medical Card' },
        { name: 'remark', type: 'textarea', label: 'Remarks' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
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
        req.payload.logger.info(`--- [HYGIENE HOOK: beforeValidate] Op: ${operation} ---`)
        req.payload.logger.info(
          `Payload data received for validation: ${JSON.stringify(data, null, 2)}`,
        )
        return data
      },
    ],
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      ({ data, operation, req }) => {
        req.payload.logger.info(`--- [HYGIENE HOOK: beforeChange] Op: ${operation} ---`)
        req.payload.logger.info(`Outlet received: ${data?.outlet}`)
        req.payload.logger.info(`Entries array count: ${data?.entries?.length ?? 0}`)
        return data as HaccpPersonalHygieneType
      },
    ],
    afterChange: [auditLogAfterChange(COLLECTION_NAME), afterChangeHook],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default HaccpPersonalHygiene
