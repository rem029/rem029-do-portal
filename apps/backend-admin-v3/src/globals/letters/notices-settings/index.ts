import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'notices-settings'

const NoticesSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Notices',
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
      name: 'seed_button',
      type: 'ui',
      admin: {
        components: {
          Field: '@/globals/letters/salary-deduction-settings/components/seed-button',
        },
        condition: () => process.env.NODE_ENV !== 'production',
      },
    },
    {
      type: 'text',
      name: 'workflow_slug_salary_deduction',
      label: 'Workflow Slug (Salary Deduction)',
      admin: {
        position: 'sidebar',
        description: 'Slug of the associated workflow process. Requires Super User',
      },
    },
    {
      type: 'text',
      name: 'workflow_slug_warnings',
      label: 'Workflow Slug (Warnings)',
      admin: {
        position: 'sidebar',
        description: 'Slug of the associated workflow process. Requires Super User',
      },
    },
    {
      type: 'number',
      name: 'cutoff_day_salary_deduction',
      label: 'Monthly Cutoff Day (Salary Deduction)',
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
      type: 'number',
      name: 'cutoff_day_warnings',
      label: 'Monthly Cutoff Day (Warnings)',
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
      name: 'docx_template_salary_deduction',
      label: 'DOCX Template (Salary Deduction)',
      relationTo: 'internal-media',
      admin: {
        description: 'Upload Word template file (.docx) for salary deduction documents',
      },
    },
    {
      type: 'upload',
      name: 'docx_template_warnings',
      label: 'DOCX Template (Warnings)',
      relationTo: 'internal-media',
      admin: {
        description: 'Upload Word template file (.docx) for warnings documents',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default NoticesSettings
