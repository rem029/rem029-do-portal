import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'

const SLUG = 'back-of-house-panel'

const BackOfHousePanel: GlobalConfig = {
  slug: SLUG,
  label: 'Back of House',
  admin: {
    group: 'FnB Orders',
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    components: {
      views: {
        edit: {
          default: {
            Component:
              '/globals/back-of-house-panel/components/back-of-house-panel-view#BackOfHousePanelView',
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

export default BackOfHousePanel
