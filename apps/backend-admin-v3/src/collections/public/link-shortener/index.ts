import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import {
  AccessAdmin,
  accessCheck,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { Access, CollectionConfig, TextFieldValidation, TextareaFieldValidation, Where } from 'payload'
import { deleteQRCode } from './hooks/deleteQRCode'
import { generateQRCode } from './hooks/generateQRCode'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const SLUG = 'link-shortener'
const COLLECTION_NAME_MEDIA = 'link-shortener-media'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(SLUG, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      if (hasAccess) return true
      const user = req.user as User
      if (!user) return false

      const constraints: Where[] = [{ created_by: { equals: user.id } }]

      return { and: constraints } as Where
    },
  })
}

const LinkShortener: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Links', singular: 'Link' },
  admin: {
    useAsTitle: 'slug',
    group: 'Link Shortener',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    listSearchableFields: ['slug', 'link', 'plain_text'],
  },
  fields: [
    {
      type: 'text',
      unique: true,
      required: true,
      name: 'slug',
      label: 'Slug',
      admin: { description: 'Unique identifier for the link' },
    },
    {
      type: 'select',
      required: true,
      name: 'type',
      label: 'Type',
      defaultValue: 'link',
      options: [
        { label: 'Link', value: 'link' },
        { label: 'Plain Text', value: 'plain_text' },
      ],
      admin: {
        description: 'Whether this short link redirects to a URL or displays plain text (e.g. WiFi name/password)',
      },
    },
    {
      type: 'text',
      name: 'link',
      label: 'Link',
      admin: {
        description: 'The actual link',
        condition: (_, siblingData) => siblingData?.type !== 'plain_text',
      },
      validate: ((value, { siblingData }) => {
        const data = siblingData as { type?: string }
        if (data?.type !== 'plain_text' && !value) {
          return 'Link is required'
        }
        return true
      }) as TextFieldValidation,
    },
    {
      type: 'textarea',
      name: 'plain_text',
      label: 'Plain Text',
      admin: {
        description: 'The plain text content (e.g. WiFi name and password)',
        condition: (_, siblingData) => siblingData?.type === 'plain_text',
      },
      validate: ((value, { siblingData }) => {
        const data = siblingData as { type?: string }
        if (data?.type === 'plain_text' && !value) {
          return 'Plain Text is required'
        }
        return true
      }) as TextareaFieldValidation,
    },
    {
      type: 'ui',
      name: 'url-preview',
      label: 'URL',
      admin: {
        components: {
          Field: `./collections/public/link-shortener/components/link-shortener-url`,
        },
      },
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      admin: { description: 'A brief description of the link' },
    },
    {
      type: 'upload',
      name: 'qr_png',
      label: 'QR Code PNG',
      relationTo: COLLECTION_NAME_MEDIA,
      displayPreview: true,
      admin: {
        description: 'PNG version of the QR code',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      type: 'upload',
      name: 'qr_svg',
      label: 'QR Code SVG',
      relationTo: COLLECTION_NAME_MEDIA,
      displayPreview: true,
      admin: {
        description: 'SVG version of the QR code',
        readOnly: true,
        position: 'sidebar',
      },
    },

    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'super_user', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckFields,
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection, generateQRCode],
    beforeDelete: [deleteQRCode],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default LinkShortener
