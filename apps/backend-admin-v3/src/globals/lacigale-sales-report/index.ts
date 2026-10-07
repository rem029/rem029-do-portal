import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'lacigale-sales-report'

const LacigaleSalesReport: GlobalConfig = {
  slug: SLUG,
  label: 'La Cigale Sales',
  admin: {
    group: 'Reports',
    // Matches the Operators pattern for hiding the sidebar link
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component: '/globals/lacigale-sales-report/components/report-view#ReportView',
          },
        },
      },
    },
  },
  // Adding the access controls to match your Operators logic
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  fields: [], // Kept empty as we are overriding the view
}

export default LacigaleSalesReport
