import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'fnb-event-orders-report'

const FnbEventOrdersReport: GlobalConfig = {
  slug: SLUG,
  label: 'Reporting',
  admin: {
    group: 'FnB Events',
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/fnb-event-orders-report/components/report-view#FnbEventOrdersReportView',
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

export default FnbEventOrdersReport
