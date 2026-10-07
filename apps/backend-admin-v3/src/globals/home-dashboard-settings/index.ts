import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'
import { validateDashboardItemSlugs } from '@/utilities/validations/home-dashboard-settings'

const SLUG = 'home-dashboard-settings'

const HomeDashboardSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Home Dashboard',
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
    CreatedByField,
    UpdatedByField,
    {
      type: 'checkbox',
      name: 'show_new_dashboard',
      label: 'Show New Dashboard UI',
      defaultValue: false,
      admin: {
        description:
          'When on, the new dashboard widget replaces the legacy H2A Oasys dashboard widget for all users who see either.',
      },
    },
    {
      type: 'upload',
      name: 'background_image',
      label: 'Dashboard Background Image',
      relationTo: 'internal-media',
      admin: {
        description:
          'Background image for the dashboard widget card. Leave empty for no background.',
      },
    },
    {
      type: 'array',
      name: 'dashboard_items',
      label: 'Dashboard Quick Links',
      labels: {
        singular: 'Item',
        plural: 'Items',
      },
      validate: validateDashboardItemSlugs,
      admin: {
        description:
          'Order controls display order on the dashboard. Each row must reference a real collection or global slug (e.g. "forms", "site-pages", "fnb-menu-events") — it only appears as a tile for a given user if that user\'s own access grant for that slug is not hidden.',
        components: {
          RowLabel: {
            path: 'src/common/components/array-row-label.tsx',
            clientProps: { path: 'slug' },
          },
        },
      },
      fields: [
        {
          type: 'text',
          name: 'slug',
          label: 'Slug',
          required: true,
          admin: {
            description: 'Must match an existing collection or global slug.',
          },
        },
        {
          type: 'text',
          name: 'title',
          label: 'Button Title',
          admin: {
            description:
              'Optional. Overrides the tile label. Leave empty to use the collection/global\'s own configured label.',
          },
        },
      ],
    },
  ],
}

export default HomeDashboardSettings
