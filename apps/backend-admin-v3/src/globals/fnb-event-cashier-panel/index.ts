import { GlobalConfig, Access } from 'payload'
import { User } from '@/payload-types'
import { hasAnyEventPanelGrant } from '@/utilities/fnb-staff-access'

const SLUG = 'fnb-event-cashier-panel'
const ROLE = 'cashier' as const

const canRead: Access = ({ req }) => hasAnyEventPanelGrant(req.user as User | null, ROLE)

const FnbEventCashierPanel: GlobalConfig = {
  slug: SLUG,
  label: 'Cashier',
  admin: {
    group: 'FnB Events',
    hidden: ({ user }) => !hasAnyEventPanelGrant(user as unknown as User, ROLE),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/fnb-event-cashier-panel/components/fnb-event-cashier-panel-view#FnbEventCashierPanelView',
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

export default FnbEventCashierPanel
