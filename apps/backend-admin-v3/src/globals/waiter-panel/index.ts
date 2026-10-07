import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'waiter-panel'

const WaiterPanel: GlobalConfig = {
  slug: SLUG,
  label: 'Waiter',
  admin: {
    group: 'FnB Orders',
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component: '/globals/waiter-panel/components/waiter-panel-view#WaiterPanelView',
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

export default WaiterPanel
