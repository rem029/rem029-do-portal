import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'

const SLUG = 'forms-dashboard'

const FormsDashboard: GlobalConfig = {
  slug: SLUG,
  label: 'Dashboard',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  admin: {
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    group: 'Forms',
  },
  fields: [
    {
      name: 'submissions_table',
      type: 'ui',
      admin: {
        components: {
          Field: '@/globals/forms-dashboard/components/index',
        },
      },
    },
  ],
}

export default FormsDashboard
