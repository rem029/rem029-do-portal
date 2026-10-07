import { CollectionConfig } from 'payload'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { getClientIp } from '@/utilities/get-ip'

const SLUG = 'analytics'

const Analytics: CollectionConfig = {
  slug: SLUG,
  labels: {
    singular: 'Analytic',
    plural: 'Analytics',
  },
  admin: {
    useAsTitle: 'eventType',
    group: 'Admin',
    listSearchableFields: ['eventType', 'path', 'referrer', 'ipAddress'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  fields: [
    {
      name: 'eventType',
      label: 'Event Type',
      type: 'select',
      options: [
        { label: 'Page View', value: 'page_view' },
        { label: 'Click', value: 'click' },
        { label: 'Form Submission', value: 'form_submission' },
        { label: 'Error', value: 'error' },
        { label: 'Video Started', value: 'video_started' },
        { label: 'Video Ended', value: 'video_ended' },
        { label: 'Search', value: 'search' },
      ],
      required: true,
    },
    {
      name: 'path',
      label: 'Page Path',
      type: 'text',
      required: true,
    },
    {
      name: 'elementId',
      label: 'Element ID',
      type: 'text',
    },
    {
      name: 'referrer',
      label: 'Referrer',
      type: 'text',
    },
    {
      name: 'ipAddress',
      label: 'IP Address',
      type: 'text',
    },
    {
      name: 'userAgent',
      label: 'User Agent',
      type: 'textarea',
      admin: {
        description: "Information about the user's browser and operating system.",
      },
    },
    {
      name: 'additionalData',
      label: 'Additional Data',
      type: 'json',
      admin: {
        description: 'Optional extra details related to the event.',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    create: () => true, // Explicitly allow anyone to create analytics events
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(SLUG, 'delete', { fallbackAccess: false }),
  },
  hooks: {
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          if (!data.ipAddress) {
            data.ipAddress = getClientIp(req)
          }
        }
        return data
      },
    ],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
  timestamps: true,
}

export default Analytics
