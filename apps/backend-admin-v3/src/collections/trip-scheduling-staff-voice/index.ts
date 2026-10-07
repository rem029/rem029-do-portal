import type { Access, CollectionConfig, Where } from 'payload'
import type { User } from '@/payload-types'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import {
  AccessAdmin,
  accessCheck,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { TOKEN_FIELD_ACCESS } from '@/utilities/trip-scheduling-approval-token'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { validateEmailDomain } from '../trip-scheduling/hooks/validate-domain'
import { afterChange } from './hooks/afterChange'
import { generateApprovalToken } from './hooks/beforeChange'

const COLLECTION_NAME = 'trip-scheduling-staff-voice'

const accessCheckFields: Access = async ({ req }) => {
  return await accessCheck(COLLECTION_NAME as any, 'super_user', {
    reqOverride: req,
    refineAccess: async (hasAccess, _, req) => {
      if (hasAccess) return true
      const user = req.user as User | undefined
      if (!user) return false
      return { created_by: { equals: user.id } } as Where
    },
  })
}

const TripSchedulingStaffVoice: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { singular: 'Staff Voice Submission', plural: 'Staff Voice Submissions' },
  timestamps: true,
  access: {
    // Read, update, delete and admin depend only on collection-level access grants (or super user).
    // Public submissions have no created_by, so a created_by rule would hide them from admins.
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: false }),
    // The public form creates records through the submitStaffVoice server action (Local API), which
    // bypasses access. Over REST/GraphQL, creating requires being logged in.
    create: accessCheckFields,
    update: accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  admin: {
    useAsTitle: 'subject',
    group: 'Trip Scheduling',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME),
    listSearchableFields: ['subject', 'fullName', 'email', 'message'],
    defaultColumns: ['subject', 'category', 'fullName', 'email', 'status', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [validateEmailDomain],
    beforeChange: [setUserCreatedOrUpdatedByCollection, generateApprovalToken],
    afterChange: [afterChange],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: 'Staff Name',
          required: true,
          index: true,
        },
        {
          name: 'email',
          type: 'email',
          label: 'Staff Email',
          required: true,
          index: true,
        },
      ],
    },
    {
      name: 'category',
      type: 'select',
      label: 'Feedback Category',
      required: true,
      index: true,
      defaultValue: 'suggestion',
      options: [
        { label: '💡 Suggestion / Idea', value: 'suggestion' },
        { label: '⚠️ Service / Route Concern', value: 'concern' },
        { label: '👏 Compliment / Praise', value: 'compliment' },
        { label: '❓ General Inquiry', value: 'inquiry' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Feedback Subject',
      required: true,
      index: true,
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Detailed Feedback / Message',
      required: true,
    },
    {
      name: 'resolutionNotes',
      type: 'textarea',
      label: 'Logistics Team Resolution Notes',
      admin: {
        description:
          'Notes on how this item was addressed. A response sent through the review link is saved here and emailed to the staff member; notes typed in the admin are internal and are not emailed.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: '⏳ New / Pending', value: 'pending' },
        { label: '👀 Under Review', value: 'under-review' },
        { label: '✅ Addressed / Closed', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'respondedAt',
      type: 'date',
      label: 'Responded At',
      access: { create: () => false, update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { displayFormat: 'dd MMM yyyy, HH:mm' },
        description: 'Set when the staff member was answered through the review link.',
      },
    },
    CreatedByField,
    UpdatedByField,

    /** BACKGROUND TRACKING TOKENS **/
    {
      name: 'approvalToken',
      type: 'text',
      access: TOKEN_FIELD_ACCESS,
      admin: {
        disabled: true,
        hidden: true,
      },
    },
    {
      name: 'tokenExpiration',
      type: 'date',
      access: TOKEN_FIELD_ACCESS,
      admin: {
        disabled: true,
        hidden: true,
      },
    },
  ],
}

export default TripSchedulingStaffVoice
