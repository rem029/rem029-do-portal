import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import { User } from '@/payload-types'

const SLUG = 'workflow-dashboard' as const

const WorkflowDashboard: GlobalConfig = {
  slug: SLUG,
  label: 'Dashboard',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  admin: {
    hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, SLUG),
    group: 'Workflow V2',
  },
  fields: [
    {
      name: 'workflow_submissions_table',
      type: 'ui',
      admin: {
        components: {
          Field: '@/globals/workflow-dashboard/components/index',
        },
      },
    },
  ],
}

export default WorkflowDashboard
