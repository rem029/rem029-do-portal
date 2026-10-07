import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  AccessAdmin,
  accessCheck,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const SLUG = 'link-shortener-media'

export const LinkShortenerMedia: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Links Media', singular: 'Links Media' },
  upload: {
    staticDir: path.resolve(dirname, `../../../../medias/${SLUG}`),
    adminThumbnail: ({ doc }) => {
      const url = `${BACKEND_URL_WITH_BASE}/api/${SLUG}/file/${doc.filename}`
      return url
    },
  },
  admin: {
    group: 'Link Shortener',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: true,
      refineAccess: async (hasAccess, _, req) => {
        if (!hasAccess) return false
        const accessSuper = await accessCheck(SLUG, 'super_user', { reqOverride: req })
        if (accessSuper) return true
        return { created_by: { equals: (req.user as User).id } }
      },
    }),
    admin: accessCheckResolver(SLUG, 'admin', { fallbackAccess: true }) as AccessAdmin,
    create: accessCheckResolver(SLUG, 'create', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: true }),
    delete: accessCheckResolver(SLUG, 'delete', { fallbackAccess: true }),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    CreatedByField,
    UpdatedByField,
  ],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}
