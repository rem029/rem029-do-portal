import { GlobalConfig, Access } from 'payload'
import { User } from '@/payload-types'
import { hasAnyEventPanelGrant } from '@/utilities/fnb-staff-access'

const SLUG = 'fnb-event-waiter-panel'
const ROLE = 'waiter' as const

const canRead: Access = ({ req }) => hasAnyEventPanelGrant(req.user as User | null, ROLE)

const FnbEventWaiterPanel: GlobalConfig = {
  slug: SLUG,
  label: 'Waiter',
  admin: {
    group: 'FnB Events',
    hidden: ({ user }) => !hasAnyEventPanelGrant(user as unknown as User, ROLE),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/fnb-event-waiter-panel/components/fnb-event-waiter-panel-view#FnbEventWaiterPanelView',
          },
        },
      },
    },
  },
  access: {
    read: canRead,
    update: canRead,
  },
  fields: [],
}

export default FnbEventWaiterPanel
