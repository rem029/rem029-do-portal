import type { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import {
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'survey-report'

const SurveyReport: GlobalConfig = {
  slug: SLUG,
  label: 'Reports',
  admin: {
    group: 'Surveys',
    // ClientUser structural mismatch resolved with cast
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    components: {
      elements: {
        SaveButton: './common/components/null-save-button',
      },
    },
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: () => false,
  },
  versions: { drafts: false },
  fields: [
    {
      type: 'ui',
      name: 'report',
      admin: {
        components: {
          Field: './globals/survey-report/components/report-view',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
}

export default SurveyReport
