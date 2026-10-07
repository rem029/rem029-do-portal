import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'disciplinary-actions-settings'

const DisciplinaryActionsSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Disciplinary Actions',
  access: {
    read: accessCheckResolver(SLUG as any, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG as any, 'update', { fallbackAccess: true }),
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
      type: 'text',
      name: 'workflow_slug',
      label: 'Workflow Slug',
      admin: {
        position: 'sidebar',
        description: 'Slug of the associated workflow process. Requires Super User',
      },
    },
    {
      type: 'number',
      name: 'cutoff_day',
      label: 'Monthly Cutoff Day',
      defaultValue: 15,
      min: 1,
      max: 31,
      required: true,
      admin: {
        position: 'sidebar',
        description:
          'Day of the month after which creates/updates are disabled (except for final approvers). Default: 15',
      },
    },
    {
      type: 'upload',
      name: 'docx_template',
      label: 'DOCX Template',
      relationTo: 'internal-media',
      admin: {
        description: 'Upload Word template file (.docx) for disciplinary action documents',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default DisciplinaryActionsSettings
