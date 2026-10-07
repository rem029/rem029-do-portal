import { GlobalConfig, Access } from 'payload'
import { User } from '@/payload-types'
import { hasAnyEventPanelGrant } from '@/utilities/fnb-staff-access'

const SLUG = 'fnb-event-back-of-house-panel'
const ROLE = 'boh' as const

const canRead: Access = ({ req }) => hasAnyEventPanelGrant(req.user as User | null, ROLE)

const FnbEventBackOfHousePanel: GlobalConfig = {
  slug: SLUG,
  label: 'Back of House',
  admin: {
    group: 'FnB Events',
    hidden: ({ user }) => !hasAnyEventPanelGrant(user as unknown as User, ROLE),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/fnb-event-back-of-house-panel/components/fnb-event-back-of-house-panel-view#FnbEventBackOfHousePanelView',
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

export default FnbEventBackOfHousePanel
