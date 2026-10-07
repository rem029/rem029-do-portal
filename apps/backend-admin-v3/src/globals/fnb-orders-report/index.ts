import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'fnb-orders-report'

const FnbOrdersReport: GlobalConfig = {
  slug: SLUG,
  label: 'Reporting',
  admin: {
    group: 'FnB Orders',
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/fnb-orders-report/components/report-view#FnbOrdersReportView',
          },
        },
      },
    },
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  fields: [],
}

export default FnbOrdersReport
