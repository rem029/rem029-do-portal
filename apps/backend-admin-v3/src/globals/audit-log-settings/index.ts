import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'audit-log-settings'

const AuditLogSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Audit Logs',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: true }),
  },
  admin: {
    hidden: ({ user }) => {
      return accessHiddenBySlug(user as unknown as User, SLUG)
    },
    group: 'Settings',
  },

  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
  fields: [
    {
      type: 'number',
      name: 'retentionMonths',
      label: 'Retention Period (Months)',
      defaultValue: 3,
      min: 1,
      required: true,
      admin: {
        description: 'How many months of audit logs should be kept. Default: 1 month',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default AuditLogSettings
