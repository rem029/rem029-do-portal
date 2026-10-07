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
const SLUG = 'internal-media'

export const InternalMedias: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Internal Media', singular: 'Internal Media' },
  upload: {
    staticDir: path.resolve(dirname, `../../../../medias/${SLUG}`),
    adminThumbnail: ({ doc }) => {
      const url = `${BACKEND_URL_WITH_BASE}/api/${SLUG}/file/${doc.filename}`
      return url
    },
  },
  admin: {
    group: 'Common',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: true,
    }),
    admin: accessCheckResolver(SLUG, 'admin', { fallbackAccess: false }) as AccessAdmin,
    create: accessCheckResolver(SLUG, 'create', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: true }),
    delete: accessCheckResolver(SLUG, 'delete', { fallbackAccess: false }),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // required: true,
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
