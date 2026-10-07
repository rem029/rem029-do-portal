import type { GlobalConfig } from 'payload'
import { User } from '@/payload-types'
import {
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'survey-send-invitation'

const SurveySendInvitation: GlobalConfig = {
  slug: SLUG,
  label: 'Send Invitations',
  admin: {
    group: 'Surveys',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    components: {
      elements: {
        SaveButton: './common/components/null-save-button',
      },
    },
  },
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
    readVersions: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
  },
  versions: { drafts: false },
  fields: [
    {
      type: 'ui',
      name: 'send_panel',
      admin: {
        components: {
          Field: './globals/survey-send-invitation/components/bulk-send',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
}

export default SurveySendInvitation
