// apps/backend-admin-v3/src/globals/trip-scheduling-settings/index.ts
import type { GlobalConfig, Field } from 'payload'
import type { User } from '@/payload-types'
import { accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'

const SLUG = 'trip-scheduling-settings'

const TripSchedulingSettings: GlobalConfig = {
  slug: SLUG,
  label: 'Options',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  admin: {
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Configuration',
          fields: [
            {
              name: 'notificationEmails',
              label: 'Approver Notification Emails',
              type: 'array',
              fields: [{ name: 'email', type: 'email', required: true }],
            },
            {
              name: 'allowedDomains',
              // 🔌 UPDATED LABEL FOR BOOKINGS AND AD-HOC DOMAINS
              label: 'Allowed Email Domains for Booking and Ad-hoc Requests',
              type: 'array',
              fields: [{ name: 'domain', type: 'text', required: true }],
            },
            {
              name: 'historyAccessEmails',
              // 🔌 UPDATED LABEL FOR BOOKINGS AND AD-HOC HISTORY PERMISSIONS
              label: 'Emails Allowed to Request Booking and Ad-hoc Request History',
              type: 'array',
              fields: [{ name: 'email', type: 'email', required: true }],
            },
          ],
        },
        {
          label: 'FAQ',
          fields: [
            {
              name: 'faqs',
              label: 'FAQs',
              type: 'array',
              labels: { singular: 'FAQ', plural: 'FAQs' },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: 'src/common/components/array-row-label.tsx',
                    clientProps: { path: 'question' },
                  },
                },
              },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'Backgrounds',
          fields: [
            {
              name: 'generalBackgroundImage',
              label: 'General Page Background',
              type: 'upload',
              relationTo: 'internal-media',
              admin: {
                description:
                  'Background for the trip-scheduling pages (gateway, booking, adhoc, history, shuttles, staff voice, FAQ). Leave empty to use the built-in default.',
              },
            },
            {
              name: 'landingHeaderBackgroundImage',
              label: 'Gateway Header Background',
              type: 'upload',
              relationTo: 'internal-media',
              admin: {
                description:
                  'Background for the gateway page header card only. Leave empty to use the built-in default.',
              },
            },
          ],
        },
        {
          label: 'Audit Trail',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'createdAt',
                  type: 'date',
                  admin: { readOnly: true, width: '50%' },
                },
                {
                  name: 'updatedAt',
                  type: 'date',
                  admin: { readOnly: true, width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                // We define these as separate fields to avoid the spread type-bug
                {
                  ...CreatedByField,
                  name: 'created_by', // Explicitly adding the name fixes the ArrayField check
                  admin: { width: '50%' },
                } as Field,
                {
                  ...UpdatedByField,
                  name: 'updated_by',
                  admin: { width: '50%' },
                } as Field,
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'dataTools',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/globals/trip-scheduling-settings/components/data-tools',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
}

export default TripSchedulingSettings
