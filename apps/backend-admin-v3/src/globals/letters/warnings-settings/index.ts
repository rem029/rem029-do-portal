import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'warnings-settings'

const WarningsSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Warnings',
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
      name: 'header_image',
      label: 'Header Image',
      relationTo: 'internal-media',
      admin: {
        description: 'Header image for warning documents',
      },
    },
    {
      type: 'upload',
      name: 'footer_image',
      label: 'Footer Image',
      relationTo: 'internal-media',
      admin: {
        description: 'Footer image for warning documents',
      },
    },
    {
      type: 'upload',
      name: 'docx_template',
      label: 'DOCX Template',
      relationTo: 'internal-media',
      admin: {
        description: 'Upload Word template file (.docx) for warning documents',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default WarningsSettings
