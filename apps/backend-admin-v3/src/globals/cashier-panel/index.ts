import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'cashier-panel'

const CashierPanel: GlobalConfig = {
  slug: SLUG,
  label: 'Cashier',
  admin: {
    group: 'FnB Orders',
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component: '/globals/cashier-panel/components/cashier-panel-view#CashierPanelView',
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

export default CashierPanel
