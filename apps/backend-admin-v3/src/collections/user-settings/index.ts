import type { CollectionConfig } from 'payload'
import { User } from '@/payload-types'
import {
  accessCheckResolver,
  accessCheck,
  isCollectionSuperUser,
  accessHiddenBySlug,
} from '@/utilities/access'

const SLUG = 'user-settings'

const UserSettings: CollectionConfig = {
  slug: SLUG,
  labels: {
    singular: 'User Setting',
    plural: 'User Settings',
  },
  admin: {
    useAsTitle: 'id',
    group: 'Admin',
    // We can hide it from the main menu if we only want to access it via the "Settings" link
    // hidden: true,
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: async (hasAccess, _, req) => {
        if (!req.user) return false
        if (req.user.super_user) return true
        return {
          user: {
            equals: req.user.id,
          },
        }
      },
    }),
    create: ({ req }) => !!req.user,
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: async (hasAccess, _, req) => {
        if (!req.user) return false
        if (req.user.super_user) return true
        return {
          user: {
            equals: req.user.id,
          },
        }
      },
    }),
    delete: ({ req }) => req.user?.super_user || false,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      defaultValue: ({ user }) => user?.id,
      access: {
        update: ({ req }) => isCollectionSuperUser(req.user as User, SLUG),
      },
    },
    // ─── Full Signature ───────────────────────────────────────────────────────
    {
      name: 'signature_group',
      type: 'group',
      label: 'Full Signature',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Input Method',
          defaultValue: 'draw',
          options: [
            { label: 'Sign using Signature Pad', value: 'draw' },
            { label: 'Upload Image', value: 'upload' },
          ],
        },
        {
          name: 'signature_base64',
          type: 'text',
          label: 'Signature (Base64)',
          admin: {
            components: {
              Field: '@/collections/user-settings/components/signature-pad#SignaturePad',
            },
          },
        },
      ],
    },
    // ─── Initials ─────────────────────────────────────────────────────────────
    {
      name: 'initials_group',
      type: 'group',
      label: 'Initials',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Input Method',
          defaultValue: 'draw',
          options: [
            { label: 'Sign using Signature Pad', value: 'draw' },
            { label: 'Upload Image', value: 'upload' },
          ],
        },
        {
          name: 'signature_base64',
          type: 'text',
          label: 'Signature (Base64)',
          admin: {
            components: {
              Field: '@/collections/user-settings/components/signature-pad#SignaturePad',
            },
          },
        },
      ],
    },
  ],
}

export default UserSettings
