import type { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import {
  AccessAdmin,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'fnb-import'

const FnbImport: GlobalConfig = {
  slug: SLUG,
  label: 'FnB Import',
  admin: {
    group: 'Settings',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    components: {
      elements: {
        SaveButton: undefined,
      },
    },
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
    readVersions: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
  },
  versions: { drafts: false },
  fields: [
    {
      type: 'ui',
      name: 'import_ui',
      admin: {
        components: {
          Field: './globals/fnb-import/components/fnb-import-ui',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
}

export default FnbImport
