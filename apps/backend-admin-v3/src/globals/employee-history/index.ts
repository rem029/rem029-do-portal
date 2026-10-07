import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'

const SLUG = 'employee-history'

const EmployeeHistory: GlobalConfig = {
  slug: SLUG,
  label: 'Employee History',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: true }),
  },
  admin: {
    hidden: ({ user }) => {
      return accessHiddenBySlug(user as unknown as User, SLUG)
    },
    group: 'Reports',
  },
  fields: [
    {
      name: 'employee_history_table',
      type: 'ui',
      admin: {
        components: {
          Field: '@/globals/employee-history/components/index',
        },
      },
    },
  ],
}

export default EmployeeHistory
