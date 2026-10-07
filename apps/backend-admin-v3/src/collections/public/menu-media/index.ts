import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { operatorAccessRefine } from '@/utilities/access-operator'

import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'

import { getOperatorField } from '../menu-pages/fields'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const SLUG = 'menu-media'

const FnbMenuMedia: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Media', singular: 'Media' },
  admin: {
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  upload: {
    staticDir: path.resolve(dirname, `../../../../medias/${SLUG}`),
    adminThumbnail: ({ doc }) => {
      const url = `${BACKEND_URL_WITH_BASE}/api/${SLUG}/file/${doc.filename}`
      return url
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    getOperatorField(),
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: true,
    }),
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: true,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: true,
      refineAccess: operatorAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: true,
      refineAccess: operatorAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: true,
      refineAccess: operatorAccessRefine,
    }),
  },
  hooks: {
    beforeValidate: [setOperatorSlugCollection('filename')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default FnbMenuMedia
