import type { CollectionConfig } from 'payload'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { User } from '@/payload-types'

const COLLECTION_NAME = 'haccp-outlet-settings'

export const HaccpOutletSettings: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    singular: 'HACCP Outlet Setting',
    plural: 'HACCP Outlet Settings',
  },
  admin: {
    useAsTitle: 'outlet',
    group: 'HACCP',
    description: 'Manage staff, PIC, and HIC contact arrays per outlet.',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  access: {
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: true }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  fields: [
    {
      name: 'outlet',
      type: 'relationship',
      relationTo: 'outlets',
      required: true,
      unique: true,
      admin: {
        description: 'Select the outlet these contact rules apply to.',
      },
    },
    {
      name: 'staffEmails',
      type: 'array',
      label: 'Staff / Operational Emails',
      labels: { singular: 'Staff Email', plural: 'Staff Emails' },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
    {
      name: 'picEmails',
      type: 'array',
      label: 'Person In Charge (PIC) Emails',
      labels: { singular: 'PIC Email', plural: 'PIC Emails' },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
    {
      name: 'hicEmails',
      type: 'array',
      label: 'Hygiene In Charge (HIC) Emails',
      labels: { singular: 'HIC Email', plural: 'HIC Emails' },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
  ],
}
